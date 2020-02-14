![Logo](../docs/assets/banner_elements.png)

# Lisk Elements

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](http://www.apache.org/licenses/LICENSE-2.0)

## What is Lisk Elements

Lisk Elements is a collection of libraries, each of them implementing some form of blockchain application functionality such as cryptography, transactions, p2p, etc. Each library is designed to be compatible with the [Lisk Protocol](https://lisk.io/documentation/lisk-protocol).

Lisk Elements supports the modular architecture of the Lisk SDK, where libraries can be created or modified to suit individual blockchain application requirements.

## Packages

| Package                                                |                              Version                               | Description                                                                                              |
| ------------------------------------------------------ | :----------------------------------------------------------------: | -------------------------------------------------------------------------------------------------------- |
| [lisk-elements](lisk-elements)                         |         ![npm](https://img.shields.io/npm/v/lisk-elements)         | Package contains everything                                                                              |
| [@liskhq/lisk-client](lisk-client)                     |      ![npm](https://img.shields.io/npm/v/@liskhq/lisk-client)      | A default set of Elements for use by clients of the Lisk network                                         |
| [@liskhq/lisk-api-client](lisk-api-client)             |    ![npm](https://img.shields.io/npm/v/@liskhq/lisk-api-client)    | An API client for the Lisk network                                                                       |
| [@liskhq/lisk-constants](lisk-constants)               |    ![npm](https://img.shields.io/npm/v/@liskhq/lisk-constants)     | General constants for use with Lisk-related software                                                     |
| [@liskhq/lisk-cryptography](lisk-cryptography)         |   ![npm](https://img.shields.io/npm/v/@liskhq/lisk-cryptography)   | General cryptographic functions for use with Lisk-related software                                       |
| [@liskhq/lisk-passphrase](lisk-passphrase)             |    ![npm](https://img.shields.io/npm/v/@liskhq/lisk-passphrase)    | Mnemonic passphrase helpers for use with Lisk-related software                                           |
| [@liskhq/lisk-transactions](lisk-transactions)         |   ![npm](https://img.shields.io/npm/v/@liskhq/lisk-transactions)   | Everything related to transactions according to the Lisk protocol                                        |
| [@liskhq/lisk-transaction-pool](lisk-transaction-pool) | ![npm](https://img.shields.io/npm/v/@liskhq/lisk-transaction-pool) | Transaction pool implementation for the Lisk network                                                     |
| [@liskhq/lisk-p2p](lisk-p2p)                           |       ![npm](https://img.shields.io/npm/v/@liskhq/lisk-p2p)        | _unstructured_ P2P library for the Lisk protocol                                                         |
| [@liskhq/lisk-validator](lisk-validator)               |    ![npm](https://img.shields.io/npm/v/@liskhq/lisk-validator)     | Custom validations utilities related to Lisk protocol                                                    |
| [@liskhq/lisk-dpos](lisk-dpos)                         |       ![npm](https://img.shields.io/npm/v/@liskhq/lisk-dpos)       | DPoS consensus algorithm implementation according to the Lisk protocol                                   |
| [@liskhq/lisk-bft](lisk-bft)                           |       ![npm](https://img.shields.io/npm/v/@liskhq/lisk-bft)        | Byzantine fault tolerance implementation according to the Lisk protocol                                  |
| [@liskhq/lisk-chain](lisk-chain)                       |      ![npm](https://img.shields.io/npm/v/@liskhq/lisk-chain)       | Implements blocks and state management that are used for block processing according to the Lisk protocol |

## Installation

If you want to install all elements as dependency of your project you can install it via.

```sh
$ npm install --save lisk-elements
```

Or you can install individual packages what you need e.g.

```sh
$ npm install --save @liskhq/lisk-transactions
$ npm install --save @liskhq/lisk-cryptography
```

## Usage

Access functionality via the relevant namespace. For example, the following will create and (locally) sign a transfer (type 0) transaction, and then broadcast it to the Lisk Testnet.

```js
const { APIClient, transaction } = require('lisk-elements');

const transferTransaction = lisk.transaction.transfer({
	amount: '123000000',
	recipientId: '12668885769632475474L',
	passphrase:
		'robust swift grocery peasant forget share enable convince deputy road keep cheap',
});

const client = APIClient.createTestnetAPIClient();

client.transactions
	.broadcast(transferTransaction)
	.then(console.info)
	.catch(console.error);
```

Full documentation can be found on the [Lisk documentation site][].

### Running Tests

To run tests for all packages in lisk-elements, run the following command in the root folder:

```
npm test
```

To run tests for a specific package, run the same command in the relevant package directory.

Example:

```
cd packages/lisk-cryptography
npm test
```

## Get Involved

| Reason                          | How                                                                                            |
| ------------------------------- | ---------------------------------------------------------------------------------------------- |
| Want to chat with our community | [Reach them on Discord](https://discord.gg/lisk)                                               |
| Found a bug                     | [Open a new issue](https://github.com/LiskHQ/lisk/issues/new)                                  |
| Found a security issue          | [See our bounty program](https://blog.lisk.io/announcing-lisk-bug-bounty-program-5895bdd46ed4) |
| Want to share your research     | [Propose your research](https://research.lisk.io)                                              |
| Want to develop with us         | [Create a fork](https://github.com/LiskHQ/lisk/fork)                                           |

## License

Copyright 2016-2019 Lisk Foundation

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

---

Copyright © 2016-2019 Lisk Foundation

Copyright © 2015 Crypti

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
