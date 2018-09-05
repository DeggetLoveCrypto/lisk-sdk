/*
 * LiskHQ/lisk-commander
 * Copyright © 2017–2018 Lisk Foundation
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
import { expect, test } from '@oclif/test';
import * as config from '../../../src/utils/config';
import * as print from '../../../src/utils/print';
import * as api from '../../../src/utils/api';
import * as inputUtils from '../../../src/utils/input/utils';

describe('signature:broadcast', () => {
	const defaultSignatureString =
		'{"transactionId":"abcd1234","publicKey":"abcd1234","signature":"abcd1234"}';
	const defaultSignature = JSON.parse(defaultSignatureString);
	const defaultAPIResponse = {
		data: {
			message: 'sent',
		},
	};

	const printMethodStub = sandbox.stub();
	const apiClientStub = {
		signatures: {
			broadcast: sandbox.stub().resolves(defaultAPIResponse),
		},
	};

	const setupTest = () =>
		test
			.stub(print, 'default', sandbox.stub().returns(printMethodStub))
			.stub(config, 'getConfig', sandbox.stub().returns({}))
			.stub(api, 'default', sandbox.stub().returns(apiClientStub))
			.stub(
				inputUtils,
				'getRawStdIn',
				sandbox.stub().resolves(defaultSignatureString),
			)
			.stdout();

	describe('signature:broadcast', () => {
		setupTest()
			.stub(inputUtils, 'getRawStdIn', sandbox.stub().resolves([]))
			.command(['signature:broadcast'])
			.catch(error =>
				expect(error.message).to.contain('No signature was provided.'),
			)
			.it('should throw an error when no signature was provided');
	});

	describe('signature:broadcast signature', () => {
		setupTest()
			.command(['signature:broadcast', '{invalid: json, format: bad}'])
			.catch(error =>
				expect(error.message).to.contain(
					'Could not parse signature JSON. Did you use the `--json` option?',
				),
			)
			.it('should throw an error when invalid signature was provided');

		setupTest()
			.command(['signature:broadcast', defaultSignatureString])
			.it('should broadcast the signature', () => {
				expect(apiClientStub.signatures.broadcast).to.be.calledWithExactly(
					defaultSignature,
				);
				return expect(printMethodStub).to.be.calledWithExactly(
					defaultAPIResponse.data,
				);
			});
	});

	describe('echo signature | signature:broadcast', () => {
		setupTest()
			.stub(
				inputUtils,
				'getRawStdIn',
				sandbox.stub().resolves(['{invalid: json, format: bad}']),
			)
			.command(['signature:broadcast'])
			.catch(error =>
				expect(error.message).to.contain(
					'Could not parse signature JSON. Did you use the `--json` option?',
				),
			)
			.it('should throw an error when invalid signature was provided');

		setupTest()
			.stub(
				inputUtils,
				'getRawStdIn',
				sandbox.stub().resolves([defaultSignatureString]),
			)
			.command(['signature:broadcast'])
			.it('should broadcast the signature', () => {
				expect(apiClientStub.signatures.broadcast).to.be.calledWithExactly(
					defaultSignature,
				);
				return expect(printMethodStub).to.be.calledWithExactly(
					defaultAPIResponse.data,
				);
			});
	});
});
