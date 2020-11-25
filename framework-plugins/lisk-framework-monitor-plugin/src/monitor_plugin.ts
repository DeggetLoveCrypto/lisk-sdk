/*
 * Copyright © 2020 Lisk Foundation
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Unless otherwise agreed in a custom licensing agreement with the Lisk Foundation,
 * no part of this software, including this file, may be copied, modified,
 * propagated, or distributed except according to the terms contained in the
 * LICENSE file.
 *
 * Removal or modification of this copyright notice is prohibited.
 */
import { Server } from 'http';
import { RawBlock, RawBlockHeader } from '@liskhq/lisk-chain';
import { codec } from '@liskhq/lisk-codec';
import { hash } from '@liskhq/lisk-cryptography';
import { objects } from '@liskhq/lisk-utils';
import {
	ActionsDefinition,
	BaseChannel,
	BasePlugin,
	EventInfoObject,
	EventPostBlockData,
	EventsArray,
	PluginInfo,
} from 'lisk-framework';
import * as express from 'express';
import type { Express } from 'express';
import * as cors from 'cors';
import * as rateLimit from 'express-rate-limit';
import * as middlewares from './middlewares';
import * as config from './defaults';
import { Options, SharedState } from './types';
import * as controllers from './controllers';

// eslint-disable-next-line
const pJSON = require('../package.json');
const movingAverageSampleSize = 100000;

interface Data {
	readonly block: string;
}

export class MonitorPlugin extends BasePlugin {
	private _server!: Server;
	private _app!: Express;
	private _channel!: BaseChannel;
	private _state!: SharedState;

	// eslint-disable-next-line @typescript-eslint/class-literal-property-style
	public static get alias(): string {
		return 'monitor';
	}

	// eslint-disable-next-line @typescript-eslint/class-literal-property-style
	public static get info(): PluginInfo {
		return {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
			author: pJSON.author,
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
			version: pJSON.version,
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
			name: pJSON.name,
		};
	}

	// eslint-disable-next-line class-methods-use-this
	public get defaults(): Record<string, unknown> {
		return config.defaultConfig;
	}

	// eslint-disable-next-line class-methods-use-this
	public get events(): EventsArray {
		return [];
	}

	// eslint-disable-next-line class-methods-use-this
	public get actions(): ActionsDefinition {
		return {
			getTransactionStats: async () =>
				controllers.transactions.getTransactionStats(this._channel, this._state),
			getBlockStats: async () => controllers.blocks.getBlockStats(this._channel, this._state),
			getNetworkStats: async () => controllers.network.getNetworkStats(this._channel),
			getForkStats: () => controllers.forks.getForkStats(this._state),
		};
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async load(channel: BaseChannel): Promise<void> {
		this._app = express();
		const options = objects.mergeDeep({}, config.defaultConfig.default, this.options) as Options;
		this._channel = channel;

		this._state = {
			forks: {
				forkEventCount: 0,
				blockHeaders: {},
			},
			transactions: {
				transactions: {},
				movingAverage: 0,
			},
			blocks: {},
		};

		this._channel.once('app:ready', () => {
			this._registerMiddlewares(options);
			this._registerControllers();
			this._registerAfterMiddlewares(options);
			this._subscribeToEvents();
			this._server = this._app.listen(options.port, '0.0.0.0');
		});
	}

	public async unload(): Promise<void> {
		await new Promise((resolve, reject) => {
			this._server.close(err => {
				if (err) {
					reject(err);
					return;
				}
				resolve();
			});
		});
	}

	public get state(): SharedState {
		return this._state;
	}

	private _registerMiddlewares(options: Options): void {
		// Register middlewares
		this._app.use(cors(options.cors));
		this._app.use(express.json());
		this._app.use(rateLimit(options.limits));
		this._app.use(middlewares.whiteListMiddleware(options));
	}

	private _registerAfterMiddlewares(_options: Options): void {
		this._app.use(middlewares.errorMiddleware());
	}

	private _registerControllers(): void {
		this._app.get(
			'/api/prometheus/metrics',
			controllers.prometheusExport.getData(this._channel, this._state),
		);
	}

	private _subscribeToEvents(): void {
		this._channel.subscribe('app:network:event', (info: EventInfoObject) => {
			const {
				data: { event, data },
			} = info as {
				data: { event: string; data: unknown };
			};

			if (event === 'postTransactionsAnnouncement') {
				this._handlePostTransactionAnnounce(data as { transactionIds: string[] });
			}

			if (event === 'postBlock') {
				this._handlePostBlock(data as EventPostBlockData);
			}
		});

		this._channel.subscribe('app:chain:fork', (eventInfo: EventInfoObject) => {
			const { block } = eventInfo.data as Data;
			this._handleFork(block);
		});
	}

	private _handlePostTransactionAnnounce(data: { transactionIds: string[] }) {
		for (const aTransactionId of data.transactionIds) {
			if (this._state.transactions.transactions[aTransactionId]) {
				this._state.transactions.transactions[aTransactionId].count += 1;
				if (!this._state.transactions.movingAverage) {
					this._state.transactions.movingAverage = this._state.transactions.transactions[
						aTransactionId
					].count;
				} else {
					this._state.transactions.movingAverage -=
						this._state.transactions.movingAverage / movingAverageSampleSize;
					this._state.transactions.movingAverage +=
						this._state.transactions.transactions[aTransactionId].count / movingAverageSampleSize;
				}
			} else {
				this._state.transactions.transactions[aTransactionId] = {
					count: 1,
					timeReceived: Date.now(),
				};
				this._cleanUpTransactionStats();
			}
		}
	}

	private _cleanUpTransactionStats() {
		const expiryTime = 600000;
		for (const transactionID of Object.keys(this._state.transactions)) {
			if (
				Date.now() - this._state.transactions.transactions[transactionID].timeReceived >
				expiryTime
			) {
				this._state.transactions.movingAverage -=
					this._state.transactions.transactions[transactionID].count / movingAverageSampleSize;
				delete this._state.transactions.transactions[transactionID];
			}
		}
	}

	private _handleFork(block: string) {
		this._state.forks.forkEventCount += 1;
		const { header } = codec.decode<RawBlock>(this.schemas.block, Buffer.from(block, 'hex'));
		const blockId = hash(header).toString('hex');
		if (this._state.forks.blockHeaders[blockId]) {
			this._state.forks.blockHeaders[blockId].timeReceived = Date.now();
		} else {
			const decodedHeader = codec.decodeJSON<Record<string, unknown>>(
				this.schemas.blockHeader,
				header,
			);
			this._state.forks.blockHeaders[blockId] = {
				blockHeader: decodedHeader,
				timeReceived: Date.now(),
			};
		}
	}

	private _handlePostBlock(data: EventPostBlockData) {
		const blockBytes = Buffer.from(data.block, 'hex');
		const decodedBlock = codec.decode<RawBlock>(this.schemas.block, blockBytes);
		const decodedBlockHeader = codec.decode<RawBlockHeader>(
			this.schemas.blockHeader,
			decodedBlock.header,
		);
		const blockId = hash(decodedBlock.header);

		if (!this._state.blocks[blockId.toString('hex')]) {
			this._state.blocks[blockId.toString('hex')] = {
				count: 0,
				height: decodedBlockHeader.height,
			};
		}

		this._state.blocks[blockId.toString('hex')].count += 1;

		// Clean up blocks older than current height minus 300 blocks
		for (const id of Object.keys(this._state.blocks)) {
			const blockInfo = this._state.blocks[id];
			if (blockInfo.height < decodedBlockHeader.height - 300) {
				delete this._state.blocks[id];
			}
		}
	}
}
