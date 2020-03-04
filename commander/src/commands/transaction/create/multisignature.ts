/*
 * LiskHQ/lisk-commander
 * Copyright © 2019 Lisk Foundation
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
 *
 */
import {
	registerMultisignature,
	utils as transactionUtils,
} from '@liskhq/lisk-transactions';
import {
	isValidFee,
	isValidNonce,
	validatePublicKeys,
} from '@liskhq/lisk-validator';
import { flags as flagParser } from '@oclif/command';

import BaseCommand from '../../../base';
import { ValidationError } from '../../../utils/error';
import { flags as commonFlags } from '../../../utils/flags';
import { validateLifetime, validateMinimum } from '../../../utils/helpers';
import {
	getInputsFromSources,
	InputFromSourceOutput,
} from '../../../utils/input';
import { getNetworkIdentifierWithInput } from '../../../utils/network_identifier';

interface Args {
	readonly nonce: string;
	readonly fee: string;
	readonly keysgroup: string;
	readonly lifetime: string;
	readonly minimum: string;
}

const processInputs = (
	nonce: string,
	fee: string,
	networkIdentifier: string,
	lifetime: number,
	minimum: number,
	keysgroup: ReadonlyArray<string>,
) => ({ passphrase }: InputFromSourceOutput) =>
	registerMultisignature({
		networkIdentifier,
		nonce,
		fee,
		passphrase,
		keysgroup,
		lifetime,
		minimum,
	});

export default class MultisignatureCommand extends BaseCommand {
	static args = [
		{
			name: 'nonce',
			required: true,
			description: 'Nonce of the transaction.',
		},
		{
			name: 'fee',
			required: true,
			description: 'Transaction fee in LSK.',
		},
		{
			name: 'lifetime',
			required: true,
			description:
				'Number of hours the transaction should remain in the transaction pool before becoming invalid.',
		},
		{
			name: 'minimum',
			required: true,
			description:
				'Minimum number of signatures required for a transaction from the account to be valid.',
		},
		{
			name: 'keysgroup',
			required: true,
			description:
				'Public keys to verify signatures against for the multisignature group.',
		},
	];

	static description = `
	Creates a transaction which will register the account as a multisignature account if broadcast to the network, using the following arguments:
		1. Number of hours the transaction should remain in the transaction pool before becoming invalid.
		2. Minimum number of signatures required for a transaction from the account to be valid.
		3. Public keys to verify signatures against for the multisignature group.
	`;

	static examples = [
		'transaction:create:multisignature 1 100 24 2 215b667a32a5cd51a94c9c2046c11fffb08c65748febec099451e3b164452bca,922fbfdd596fa78269bbcadc67ec2a1cc15fc929a19c462169568d7a3df1a1aa',
	];

	static flags = {
		...BaseCommand.flags,
		networkIdentifier: flagParser.string(commonFlags.networkIdentifier),
		passphrase: flagParser.string(commonFlags.passphrase),
		'no-signature': flagParser.boolean(commonFlags.noSignature),
	};

	async run(): Promise<void> {
		const {
			args,
			flags: {
				networkIdentifier: networkIdentifierSource,
				passphrase: passphraseSource,
				'no-signature': noSignature,
			},
		} = this.parse(MultisignatureCommand);

		const {
			nonce,
			fee,
			lifetime,
			minimum,
			keysgroup: keysgroupStr,
		}: Args = args;
		const keysgroup = keysgroupStr.split(',');

		if (!isValidNonce(nonce)) {
			throw new ValidationError('Enter a valid nonce in number string format.');
		}

		if (Number.isNaN(Number(fee))) {
			throw new ValidationError('Enter a valid fee in number string format.');
		}

		const normalizedFee = transactionUtils.convertLSKToBeddows(fee);

		if (!isValidFee(normalizedFee)) {
			throw new ValidationError('Enter a valid fee in number string format.');
		}

		validatePublicKeys(keysgroup);

		validateLifetime(lifetime);
		validateMinimum(minimum);

		const transactionLifetime = parseInt(lifetime, 10);
		const transactionMinimumConfirmations = parseInt(minimum, 10);
		const networkIdentifier = getNetworkIdentifierWithInput(
			networkIdentifierSource,
			this.userConfig.api.network,
		);
		const processFunction = processInputs(
			nonce,
			normalizedFee,
			networkIdentifier,
			transactionLifetime,
			transactionMinimumConfirmations,
			keysgroup,
		);

		if (noSignature) {
			const noSignatureResult = processFunction({
				passphrase: undefined,
			});
			this.print(noSignatureResult);

			return;
		}

		const inputs = await getInputsFromSources({
			passphrase: {
				source: passphraseSource,
				repeatPrompt: true,
			},
		});
		const result = processFunction(inputs);
		this.print(result);
	}
}
