/*
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
import { MAX_TRANSACTION_AMOUNT } from '../src/constants';
import { TransferTransaction } from '../src/8_transfer_transaction';
import { Account } from '../src/types';
import { defaultAccount, StateStoreMock } from './utils/state_store_mock';
import * as fixture from '../fixtures/transaction_network_id_and_change_order/transfer_transaction_validate.json';
import * as secondSignatureReg from '../fixtures/transaction_multisignature_registration/multisignature_registration_2nd_sig_equivalent_transaction.json';
import { BaseTransaction } from '../src';

describe('Transfer transaction class', () => {
	const validTransferTransaction = fixture.testCases[0].output;
	const validTransferInput = fixture.testCases[0].input;
	const validTransferAccount = fixture.testCases[0].input.account;
	let validTransferTestTransaction: TransferTransaction;
	let sender: Account;
	let recipient: Account;
	let store: StateStoreMock;

	beforeEach(() => {
		validTransferTestTransaction = new TransferTransaction(
			validTransferTransaction,
		);
		sender = {
			...defaultAccount,
			balance: BigInt('10000000000'),
			address: validTransferTestTransaction.senderId,
		};
		sender.nonce = BigInt(validTransferAccount.nonce);

		recipient = {
			...defaultAccount,
			balance: BigInt('10000000000'),
			address: validTransferTestTransaction.asset.recipientId,
		};
		recipient.nonce = BigInt(validTransferAccount.nonce);

		store = new StateStoreMock([sender, recipient]);

		jest.spyOn(store.account, 'get');
		jest.spyOn(store.account, 'getOrDefault');
		jest.spyOn(store.account, 'set');
	});

	describe('#constructor', () => {
		it('should create instance of TransferTransaction', () => {
			expect(validTransferTestTransaction).toBeInstanceOf(TransferTransaction);
		});

		it('should set transfer asset data', () => {
			expect(validTransferTestTransaction.asset.data).toEqual(
				validTransferTestTransaction.asset.data,
			);
		});

		it('should set transfer asset amount', () => {
			expect(validTransferTestTransaction.asset.amount.toString()).toEqual(
				validTransferTransaction.asset.amount,
			);
		});

		it('should set transfer asset recipientId', () => {
			expect(validTransferTestTransaction.asset.recipientId).toEqual(
				validTransferTransaction.asset.recipientId,
			);
		});
	});

	describe('#applyAsset', () => {
		it('should return no errors', () => {
			const errors = (validTransferTestTransaction as any).applyAsset(store);

			expect(Object.keys(errors)).toHaveLength(0);
		});

		it('should call state store', async () => {
			await (validTransferTestTransaction as any).applyAsset(store);
			expect(store.account.get).toHaveBeenCalledWith(
				validTransferTestTransaction.senderId,
			);
			expect(store.account.set).toHaveBeenCalledWith(
				sender.address,
				expect.objectContaining({
					address: sender.address,
					publicKey: sender.publicKey,
				}),
			);
			expect(store.account.getOrDefault).toHaveBeenCalledWith(
				validTransferTestTransaction.asset.recipientId,
			);
			expect(store.account.set).toHaveBeenCalledWith(
				recipient.address,
				expect.objectContaining({
					address: recipient.address,
					publicKey: recipient.publicKey,
				}),
			);
		});

		it('should return error when recipient balance is over maximum amount', async () => {
			store.account.set(recipient.address, {
				...recipient,
				balance: BigInt(MAX_TRANSACTION_AMOUNT),
			});
			const errors = await (validTransferTestTransaction as any).applyAsset(
				store,
			);
			expect(errors[0].message).toEqual('Invalid amount');
		});

		it('should return error when recipient balance is below minimum remaining balance', async () => {
			store.account.set(recipient.address, {
				...recipient,
				balance:
					-validTransferTestTransaction.asset.amount +
					BaseTransaction.MIN_REMAINING_BALANCE -
					BigInt(1),
			});
			const errors = await (validTransferTestTransaction as any).applyAsset(
				store,
			);
			expect(errors[0].message).toContain(
				'Account does not have enough minimum remaining LSK',
			);
		});
	});

	describe('#undoAsset', () => {
		it('should call state store', async () => {
			await (validTransferTestTransaction as any).undoAsset(store);
			expect(store.account.get).toHaveBeenCalledWith(
				validTransferTestTransaction.senderId,
			);

			expect(store.account.set).toHaveBeenCalledWith(
				sender.address,
				expect.objectContaining({
					address: sender.address,
					publicKey: sender.publicKey,
				}),
			);
			expect(store.account.getOrDefault).toHaveBeenCalledWith(
				validTransferTestTransaction.asset.recipientId,
			);
			expect(store.account.set).toHaveBeenCalledWith(
				recipient.address,
				expect.objectContaining({
					address: recipient.address,
					publicKey: recipient.publicKey,
				}),
			);
		});

		it('should return error when sender balance is over maximum amount', async () => {
			store.account.set(sender.address, {
				...sender,
				balance: BigInt(MAX_TRANSACTION_AMOUNT),
			});
			const errors = await (validTransferTestTransaction as any).undoAsset(
				store,
			);
			expect(errors[0].message).toEqual('Invalid amount');
		});
	});

	// TODO: Update after updating protocol-specs
	describe.skip('#signAll', () => {
		const { transaction, account, networkIdentifier } = validTransferInput;
		let validTransferInstance: BaseTransaction;
		beforeEach(() => {
			validTransferInstance = new TransferTransaction(transaction);
		});

		it('should have one signature for single key pair account', () => {
			validTransferInstance.sign(
				networkIdentifier,
				account.passphrase,
				undefined,
				undefined,
			);
			expect(validTransferInstance.signatures[0]).toBe(
				validTransferTransaction.signatures[0],
			);
		});

		it('should have two signatures for a multisignature account used as 2nd passphrase account', () => {
			const { members } = secondSignatureReg.testCases.input;
			const { output: secondSignatureAccount } = secondSignatureReg.testCases;

			validTransferInstance.sign(
				networkIdentifier,
				undefined,
				[members.mandatoryOne.passphrase, members.mandatoryTwo.passphrase],
				{
					...secondSignatureAccount.asset,
				},
			);

			expect(validTransferInstance.signatures).toHaveLength(2);
			expect(validTransferInstance.signatures).toStrictEqual([
				'80d364c0fa5f3a53587986d96316404313b1831408c35ead1eac02d264919708034f8b61198cad29c966d0336c5526acfc37215b7ee17152aebd85f6963dec0c',
				'be8498bf26315480bb9d242b784b3d3a7fcd67fd74aede35e359a478a5932ea40287f85bc3e6b8dbaac2642162b11ae4341bd510048bf58f742d3db1d4f0a50d',
			]);
		});
	});
});
