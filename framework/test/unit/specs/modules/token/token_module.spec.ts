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
import { codec } from '@liskhq/lisk-codec';
import { Transaction, transactionSchema } from '@liskhq/lisk-chain';
import { TokenModule } from '../../../../../src/modules/token';
import { createFakeDefaultAccount, StateStoreMock } from '../../../../utils/node';
import * as fixtures from './transfer_transaction_validate.json';
import { GenesisConfig } from '../../../../../src';

describe('token module', () => {
	let tokenModule: TokenModule;
	let validTransaction: any;
	let decodedTransaction: any;
	let senderAccount: any;
	let recipientAccount: any;
	let stateStore: any;
	let reducerHandler: any;

	const defaultTestCase = fixtures.testCases[0];
	const minRemainingBalance = BigInt(1);
	const genesisConfig: GenesisConfig = {
		baseFees: [
			{
				assetType: 0,
				baseFee: '10000000',
				moduleType: 2,
			},
		],
		bftThreshold: 67,
		blockTime: 10,
		communityIdentifier: 'lisk',
		maxPayloadLength: 15360,
		minFeePerByte: 1,
		rewards: {
			distance: 1,
			milestones: ['milestone'],
			offset: 2,
		},
		minRemainingBalance,
	};

	beforeEach(() => {
		tokenModule = new TokenModule(genesisConfig);
		const buffer = Buffer.from(defaultTestCase.output.transaction, 'base64');
		decodedTransaction = codec.decode<Transaction>(transactionSchema, buffer);
		validTransaction = new Transaction(decodedTransaction);
		senderAccount = createFakeDefaultAccount({
			address: Buffer.from(defaultTestCase.input.account.address, 'base64'),
			token: {
				balance: BigInt('1000000000000000'),
			},
		});
		recipientAccount = createFakeDefaultAccount({
			address: Buffer.from(defaultTestCase.input.account.address, 'base64'),
			token: {
				balance: BigInt('1000000000000000'),
			},
		});
		stateStore = new StateStoreMock([senderAccount, recipientAccount]);
		stateStore.account = {
			...stateStore.account,
			get: jest.fn().mockResolvedValue(senderAccount),
			getOrDefault: jest.fn().mockResolvedValue(senderAccount),
		};
		reducerHandler = {};
	});

	describe('#beforeTransactionApply', () => {
		it('should return no errors', async () => {
			return expect(
				tokenModule.beforeTransactionApply({
					stateStore,
					transaction: validTransaction,
					reducerHandler,
				}),
			).resolves.toBeUndefined();
		});

		it('should return error when baseFee is less than minimum required fee.', async () => {
			tokenModule = new TokenModule({
				...genesisConfig,
				baseFees: [
					{
						assetType: 0,
						baseFee: '1',
						moduleType: 2,
					},
				],
			});
			const expectedMinFee =
				BigInt(genesisConfig.minFeePerByte) * BigInt(validTransaction.getBytes().length);

			return expect(
				tokenModule.beforeTransactionApply({
					stateStore,
					transaction: validTransaction,
					reducerHandler,
				}),
			).rejects.toStrictEqual(
				new Error(
					`Insufficient transaction fee. Minimum required fee is: ${expectedMinFee.toString()}`,
				),
			);
		});
	});
});
