'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.sellOutcomeTokens = exports.buyOutcomeTokens = exports.createMarket = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _from = require('babel-runtime/core-js/array/from');

var _from2 = _interopRequireDefault(_from);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _pick2 = require('lodash/pick');

var _pick3 = _interopRequireDefault(_pick2);

/**
 * Buys outcome tokens. If you have ether and plan on transacting with a market on an event which
 * uses EtherToken as collateral, be sure to convert the ether into EtherToken by sending ether to
 * the deposit() method of the contract. For other ERC20 collateral tokens, follow the token's
 * acquisition process defined by the token's contract.
 *
 * Note: this method is asynchronous and will return a Promise
 *
 * @param {(Contract|string)} opts.market - The market to buy tokens from
 * @param {(number|string|BigNumber)} opts.outcomeTokenIndex - The index of the outcome
 * @param {(number|string|BigNumber)} opts.outcomeTokenCount - Number of outcome tokens to buy
 * @param {(number|string|BigNumber)} [opts.approvalAmount] - Amount of collateral to allow market to spend. If unsupplied or null, allowance will be reset to the `approvalResetAmount` only if necessary. If set to 0, the approval transaction will be skipped.
 * @param {(number|string|BigNumber)} [opts.approvalResetAmount] - Set to this amount when resetting market collateral allowance. If unsupplied or null, will be the cost of this transaction.
 * @returns {BigNumber} How much collateral tokens caller paid
 * @alias Gnosis#buyOutcomeTokens
 */
var buyOutcomeTokens = exports.buyOutcomeTokens = function () {
    var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
        var _normalizeWeb3Args,
            _normalizeWeb3Args2,
            _normalizeWeb3Args2$,
            marketAddress,
            outcomeTokenIndex,
            outcomeTokenCount,
            opts,
            txOpts,
            _ref2,
            approvalAmount,
            approvalResetAmount,
            market,
            collateralToken,
            baseCost,
            cost,
            txPromises,
            txRequiredEventNames,
            buyer,
            marketAllowance,
            txRequiredEvents,
            purchaseEvent,
            _args = arguments;

        return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        _normalizeWeb3Args = (0, _utils.normalizeWeb3Args)((0, _from2.default)(_args), {
                            methodName: 'buyOutcomeTokens',
                            functionInputs: [{ name: 'market', type: 'address' }, { name: 'outcomeTokenIndex', type: 'uint8' }, { name: 'outcomeTokenCount', type: 'uint256' }]
                        }), _normalizeWeb3Args2 = (0, _slicedToArray3.default)(_normalizeWeb3Args, 2), _normalizeWeb3Args2$ = (0, _slicedToArray3.default)(_normalizeWeb3Args2[0], 3), marketAddress = _normalizeWeb3Args2$[0], outcomeTokenIndex = _normalizeWeb3Args2$[1], outcomeTokenCount = _normalizeWeb3Args2$[2], opts = _normalizeWeb3Args2[1];
                        txOpts = (0, _pick3.default)(opts, ['from', 'to', 'value', 'gas', 'gasPrice']);
                        _ref2 = opts || {}, approvalAmount = _ref2.approvalAmount, approvalResetAmount = _ref2.approvalResetAmount;
                        _context.next = 5;
                        return this.contracts.Market.at(marketAddress);

                    case 5:
                        market = _context.sent;
                        _context.t0 = this.contracts.Token;
                        _context.t1 = this.contracts.Event;
                        _context.next = 10;
                        return market.eventContract(txOpts);

                    case 10:
                        _context.t2 = _context.sent;
                        _context.next = 13;
                        return _context.t1.at.call(_context.t1, _context.t2).collateralToken();

                    case 13:
                        _context.t3 = _context.sent;
                        _context.next = 16;
                        return _context.t0.at.call(_context.t0, _context.t3);

                    case 16:
                        collateralToken = _context.sent;
                        _context.next = 19;
                        return this.lmsrMarketMaker.calcCost(marketAddress, outcomeTokenIndex, outcomeTokenCount, txOpts);

                    case 19:
                        baseCost = _context.sent;
                        _context.t4 = baseCost;
                        _context.next = 23;
                        return market.calcMarketFee(baseCost, txOpts);

                    case 23:
                        _context.t5 = _context.sent;
                        cost = _context.t4.add.call(_context.t4, _context.t5);


                        if (approvalResetAmount == null) {
                            approvalResetAmount = cost;
                        }

                        txPromises = [];
                        txRequiredEventNames = [];

                        if (!(approvalAmount == null)) {
                            _context.next = 36;
                            break;
                        }

                        buyer = txOpts.from || this.defaultAccount;
                        _context.next = 32;
                        return collateralToken.allowance(buyer, marketAddress, txOpts);

                    case 32:
                        marketAllowance = _context.sent;


                        if (marketAllowance.lt(cost)) {
                            txPromises.push(collateralToken.approve(marketAddress, approvalResetAmount, txOpts));
                            txRequiredEventNames.push('Approval');
                        }
                        _context.next = 37;
                        break;

                    case 36:
                        if (this.web3.toBigNumber(0).lt(approvalAmount)) {
                            txPromises.push(collateralToken.approve(marketAddress, approvalAmount, txOpts));
                            txRequiredEventNames.push('Approval');
                        }

                    case 37:
                        txPromises.push(market.buy(outcomeTokenIndex, outcomeTokenCount, cost, txOpts));
                        txRequiredEventNames.push('OutcomeTokenPurchase');

                        _context.next = 41;
                        return _promise2.default.all(txPromises);

                    case 41:
                        _context.t6 = function (res, i) {
                            return (0, _utils.requireEventFromTXResult)(res, txRequiredEventNames[i]);
                        };

                        txRequiredEvents = _context.sent.map(_context.t6);
                        purchaseEvent = txRequiredEvents[txRequiredEvents.length - 1];
                        return _context.abrupt('return', purchaseEvent.args.outcomeTokenCost.plus(purchaseEvent.args.marketFees));

                    case 45:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));

    return function buyOutcomeTokens() {
        return _ref.apply(this, arguments);
    };
}();

/**
 * Sells outcome tokens. If transacting with a market which deals with EtherToken as collateral,
 * will need additional step of sending a withdraw(uint amount) transaction to the EtherToken
 * contract if raw ether is desired.
 *
 * Note: this method is asynchronous and will return a Promise
 *
 * @param {(Contract|string)} opts.market - The market to sell tokens to
 * @param {(number|string|BigNumber)} opts.outcomeTokenIndex - The index of the outcome
 * @param {(number|string|BigNumber)} opts.outcomeTokenCount - Number of outcome tokens to sell
 * @param {(number|string|BigNumber)} [opts.approvalAmount] - Amount of outcome tokens to allow market to handle. If unsupplied or null, allowance will be reset to the `approvalResetAmount` only if necessary. If set to 0, the approval transaction will be skipped.
 * @param {(number|string|BigNumber)} [opts.approvalResetAmount] - Set to this amount when resetting market outcome token allowance. If unsupplied or null, will be the sale amount specified by `outcomeTokenCount`.
 * @returns {BigNumber} How much collateral tokens caller received from sale
 * @alias Gnosis#sellOutcomeTokens
 */
var sellOutcomeTokens = exports.sellOutcomeTokens = function () {
    var _ref5 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3() {
        var _normalizeWeb3Args3,
            _normalizeWeb3Args4,
            _normalizeWeb3Args4$,
            marketAddress,
            outcomeTokenIndex,
            outcomeTokenCount,
            opts,
            txOpts,
            _ref6,
            approvalAmount,
            approvalResetAmount,
            market,
            outcomeToken,
            baseProfit,
            minProfit,
            txPromises,
            txRequiredEventNames,
            seller,
            marketAllowance,
            txRequiredEvents,
            saleEvent,
            _args3 = arguments;

        return _regenerator2.default.wrap(function _callee3$(_context3) {
            while (1) {
                switch (_context3.prev = _context3.next) {
                    case 0:
                        _normalizeWeb3Args3 = (0, _utils.normalizeWeb3Args)((0, _from2.default)(_args3), {
                            methodName: 'sellOutcomeTokens',
                            functionInputs: [{ name: 'market', type: 'address' }, { name: 'outcomeTokenIndex', type: 'uint8' }, { name: 'outcomeTokenCount', type: 'uint256' }]
                        }), _normalizeWeb3Args4 = (0, _slicedToArray3.default)(_normalizeWeb3Args3, 2), _normalizeWeb3Args4$ = (0, _slicedToArray3.default)(_normalizeWeb3Args4[0], 3), marketAddress = _normalizeWeb3Args4$[0], outcomeTokenIndex = _normalizeWeb3Args4$[1], outcomeTokenCount = _normalizeWeb3Args4$[2], opts = _normalizeWeb3Args4[1];
                        txOpts = (0, _pick3.default)(opts, ['from', 'to', 'value', 'gas', 'gasPrice']);
                        _ref6 = opts || {}, approvalAmount = _ref6.approvalAmount, approvalResetAmount = _ref6.approvalResetAmount;
                        _context3.next = 5;
                        return this.contracts.Market.at(marketAddress);

                    case 5:
                        market = _context3.sent;
                        _context3.t0 = this.contracts.Token;
                        _context3.t1 = this.contracts.Event;
                        _context3.next = 10;
                        return market.eventContract(txOpts);

                    case 10:
                        _context3.t2 = _context3.sent;
                        _context3.t3 = outcomeTokenIndex;
                        _context3.next = 14;
                        return _context3.t1.at.call(_context3.t1, _context3.t2).outcomeTokens(_context3.t3);

                    case 14:
                        _context3.t4 = _context3.sent;
                        _context3.next = 17;
                        return _context3.t0.at.call(_context3.t0, _context3.t4);

                    case 17:
                        outcomeToken = _context3.sent;
                        _context3.next = 20;
                        return this.lmsrMarketMaker.calcProfit(marketAddress, outcomeTokenIndex, outcomeTokenCount, txOpts);

                    case 20:
                        baseProfit = _context3.sent;
                        _context3.t5 = baseProfit;
                        _context3.next = 24;
                        return market.calcMarketFee(baseProfit, txOpts);

                    case 24:
                        _context3.t6 = _context3.sent;
                        minProfit = _context3.t5.sub.call(_context3.t5, _context3.t6);


                        if (approvalResetAmount == null) {
                            approvalResetAmount = outcomeTokenCount;
                        }

                        txPromises = [];
                        txRequiredEventNames = [];

                        if (!(approvalAmount == null)) {
                            _context3.next = 37;
                            break;
                        }

                        seller = txOpts.from || this.defaultAccount;
                        _context3.next = 33;
                        return outcomeToken.allowance(seller, marketAddress, txOpts);

                    case 33:
                        marketAllowance = _context3.sent;


                        if (marketAllowance.lt(outcomeTokenCount)) {
                            txPromises.push(outcomeToken.approve(marketAddress, approvalResetAmount, txOpts));
                            txRequiredEventNames.push('Approval');
                        }
                        _context3.next = 38;
                        break;

                    case 37:
                        if (this.web3.toBigNumber(0).lt(approvalAmount)) {
                            txPromises.push(outcomeToken.approve(marketAddress, approvalAmount, txOpts));
                            txRequiredEventNames.push('Approval');
                        }

                    case 38:
                        txPromises.push(market.sell(outcomeTokenIndex, outcomeTokenCount, minProfit, txOpts));
                        txRequiredEventNames.push('OutcomeTokenSale');

                        _context3.next = 42;
                        return _promise2.default.all(txPromises);

                    case 42:
                        _context3.t7 = function (res, i) {
                            return (0, _utils.requireEventFromTXResult)(res, txRequiredEventNames[i]);
                        };

                        txRequiredEvents = _context3.sent.map(_context3.t7);
                        saleEvent = txRequiredEvents[txRequiredEvents.length - 1];
                        return _context3.abrupt('return', saleEvent.args.outcomeTokenProfit.minus(saleEvent.args.marketFees));

                    case 46:
                    case 'end':
                        return _context3.stop();
                }
            }
        }, _callee3, this);
    }));

    return function sellOutcomeTokens() {
        return _ref5.apply(this, arguments);
    };
}();

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Creates a market.
 *
 * Note: this method is asynchronous and will return a Promise
 *
 * @function
 * @param {(Contract|string)} opts.event - The forwarded oracle contract or its address
 * @param {(Contract|string)} opts.marketMaker - The collateral token contract or its address
 * @param {(number|string|BigNumber)} opts.fee - The fee factor. Specifying 1,000,000 corresponds to 100%, 50,000 corresponds to 5%, etc.
 * @param {(Contract|string)} [opts.marketFactory={@link Gnosis#standardMarketFactory}] - The factory contract
 * @returns {Contract} The created market contract instance. If marketFactory is [StandardMarketFactory](https://gnosis.github.io/gnosis-contracts/docs/StandardMarketFactory/), this should be a [StandardMarket](https://gnosis.github.io/gnosis-contracts/docs/StandardMarket/)
 * @alias Gnosis#createMarket
 */
var createMarket = exports.createMarket = (0, _utils.wrapWeb3Function)(function (self, opts) {
    return {
        callerContract: opts.marketFactory || self.standardMarketFactory,
        callerABI: self.contracts.StandardMarketFactory.abi,
        methodName: 'createMarket',
        eventName: 'StandardMarketCreation',
        eventArgName: 'market',
        resultContract: self.contracts.Market,
        argAliases: {
            event: 'eventContract'
        }
    };
});

buyOutcomeTokens.estimateGas = function () {
    var _ref4 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(_ref3) {
        var using = _ref3.using;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        if (!(using === 'stats')) {
                            _context2.next = 2;
                            break;
                        }

                        return _context2.abrupt('return', this.contracts.Token.gasStats.approve.averageGasUsed + this.contracts.Market.gasStats.buy.averageGasUsed);

                    case 2:
                        throw new Error('unsupported gas estimation source ' + using);

                    case 3:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, _callee2, this);
    }));

    return function (_x) {
        return _ref4.apply(this, arguments);
    };
}();

sellOutcomeTokens.estimateGas = function () {
    var _ref8 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4(_ref7) {
        var using = _ref7.using;
        return _regenerator2.default.wrap(function _callee4$(_context4) {
            while (1) {
                switch (_context4.prev = _context4.next) {
                    case 0:
                        if (!(using === 'stats')) {
                            _context4.next = 2;
                            break;
                        }

                        return _context4.abrupt('return', this.contracts.Token.gasStats.approve.averageGasUsed + this.contracts.Market.gasStats.sell.averageGasUsed);

                    case 2:
                        throw new Error('unsupported gas estimation source ' + using);

                    case 3:
                    case 'end':
                        return _context4.stop();
                }
            }
        }, _callee4, this);
    }));

    return function (_x2) {
        return _ref8.apply(this, arguments);
    };
}();
//# sourceMappingURL=markets.js.map