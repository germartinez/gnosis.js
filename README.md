# Gnosis.js Library

[![Logo](https://raw.githubusercontent.com/gnosis/gnosis.js/master/assets/logo.png)](https://gnosis.pm/)

[![Build Status](https://travis-ci.org/gnosis/gnosis.js.svg?branch=master)](https://travis-ci.org/gnosis/gnosis.js)

[![Slack Status](https://slack.gnosis.pm/badge.svg)](https://slack.gnosis.pm)

## Really quick start

1. Get [Ganache-cli](https://github.com/trufflesuite/ganache-cli)
   ```
   npm install -g ganache-cli
   ```
2. Run this:
   ```
   ganache-cli -d -i 437894314312
   ```
3. Clone [Gnosis contracts](https://github.com/gnosis/gnosis-contracts), cd in there, and migrate the contracts onto the Ganache-cli instance with:
   ```
   cd path/to/gnosis-contracts
   npm install
   npm run migrate
   ```
4. Download [`gnosis.js`](https://raw.githubusercontent.com/gnosis/gnosis.js/master/dist/gnosis.js) and put it in an HTML file:
   ```
   <script src=gnosis.js></script>
   ```
5. Follow some tutorials:
   * [API Overview](https://gnosis.github.io/gnosis.js/tutorial-api-overview.html)
   * [Events, Oracles, and Markets](https://gnosis.github.io/gnosis.js/tutorial-events-oracles-and-markets.html)


## Installation

Run `npm install` to install dependencies.

Needs a Web3 provider to work. For testing, try Ganache-cli.

## Development

Before you begin, you will want to have the contracts deployed on the chain you plan to use. You can deploy contracts through the RPC interface on localhost:8545 with

```
npm run migrate
```

The build process using Truffle will insert the chain locations in a `networks` key on the contract build artifacts.

### Building

You can run `npm run nodebuild` to build the library for Node.js use.

You can also run `npm run webbuild` to build the library targeting the web. Note that this will compile in all network information present in the build artifacts, including temporary network information generated by Ganache-cli during migrations. You may use `npm run netreset` beforehand to remove unofficial network info and reset to official deployed locations if desired.

### Running the dev server

Run `npm run dev` to run the dev server and serve the examples. The library source will be continuously recompiled. Examples will be available on http://localhost:8080. Don't forget to refresh the page after you change the source.

### Running the tests

Run `npm test` to run test suite. This should run without the need of an RPC provider running on localhost:8545. If you already have such a provider running and wish to run the test suite without automatically spinning up Ganache-cli and causing a chain migration, use `npm run test-manual`.

You may also provide mocha options through the `MOCHA_OPTS` environment variable, e.g. `MOCHA_OPTS='-g estimate' npm test`.

## Documentation

API documentation and tutorials can be found hosted online at https://gnosis.github.io/gnosis.js/

### Running the docs

Run `npm run doc` to build and open a local build of the documentation in your browser.

### Web3 options

The methods on the API can be provided with `from`, `to`, `value`, `gas`, and `gasPrice` options which get passed down to the `web3.js` layer.

### Gas estimations

Many of the methods on the gnosis API also have an asynchronous `estimateGas` property which you can use, while allowing you to specify the gas estimation source. For example:

```javascript
// using the estimateGas RPC
await gnosis.createCentralizedOracle.estimateGas(ipfsHash, { using: 'rpc' }))

// using stats derived from gnosis-contracts
await gnosis.createCentralizedOracle.estimateGas({ using: 'stats' }))
```

The gas stats derived from `gnosis-contracts` and used by the `estimateGas` functions when using stats are also added to the contract abstractions in the following property:

```javascript
// examples of objects with gas stats for each function derived from gnosis-contracts test suite
gnosis.contracts.CentralizedOracle.gasStats
gnosis.contracts.ScalarEvent.gasStats
```
