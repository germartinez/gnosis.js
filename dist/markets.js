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
 * @param {(number|string|BigNumber)} [opts.limitMargin=0] - Because transactions change prices, there is a chance that the cost limit for the buy, which is set to the cost according to the latest mined block, will prevent the buy transaction from succeeding. This parameter can be used to increase the cost limit by a fixed proportion. For example, specifying `limitMargin: 0.05` will make the cost limit increase by 5%.
 * @param {(number|string|BigNumber)} [opts.cost] - Overrides the cost limit supplied to the market contract which is derived from the latest block state of the market along with the `outcomeTokenCount` and `limitMargin` parameters.
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
            _ref2,
            approvalAmount,
            approvalResetAmount,
            limitMargin,
            cost,
            market,
            collateralToken,
            baseCost,
            baseCostWithFee,
            txInfo,
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
                        _ref2 = opts || {}, approvalAmount = _ref2.approvalAmount, approvalResetAmount = _ref2.approvalResetAmount, limitMargin = _ref2.limitMargin, cost = _ref2.cost;
                        _context.next = 4;
                        return this.contracts.Market.at(marketAddress);

                    case 4:
                        market = _context.sent;
                        _context.t0 = this.contracts.Token;
                        _context.t1 = this.contracts.Event;
                        _context.next = 9;
                        return market.eventContract(opts);

                    case 9:
                        _context.t2 = _context.sent;
                        _context.next = 12;
                        return _context.t1.at.call(_context.t1, _context.t2).collateralToken();

                    case 12:
                        _context.t3 = _context.sent;
                        _context.next = 15;
                        return _context.t0.at.call(_context.t0, _context.t3);

                    case 15:
                        collateralToken = _context.sent;

                        if (!(cost == null)) {
                            _context.next = 27;
                            break;
                        }

                        if (limitMargin == null) {
                            limitMargin = 0;
                        }

                        _context.next = 20;
                        return this.lmsrMarketMaker.calcCost(marketAddress, outcomeTokenIndex, outcomeTokenCount, opts);

                    case 20:
                        baseCost = _context.sent;
                        _context.t4 = baseCost;
                        _context.next = 24;
                        return market.calcMarketFee(baseCost, opts);

                    case 24:
                        _context.t5 = _context.sent;
                        baseCostWithFee = _context.t4.add.call(_context.t4, _context.t5);

                        cost = baseCostWithFee.mul(this.web3.toBigNumber(1).add(limitMargin)).round();

                    case 27:

                        if (approvalResetAmount == null) {
                            approvalResetAmount = cost;
                        }

                        txInfo = [];

                        if (!(approvalAmount == null)) {
                            _context.next = 44;
                            break;
                        }

                        buyer = opts.from || this.defaultAccount;
                        _context.next = 33;
                        return collateralToken.allowance(buyer, marketAddress, opts);

                    case 33:
                        marketAllowance = _context.sent;

                        if (!marketAllowance.lt(cost)) {
                            _context.next = 42;
                            break;
                        }

                        _context.t6 = txInfo;
                        _context.next = 38;
                        return collateralToken.approve.sendTransaction(marketAddress, approvalResetAmount, opts);

                    case 38:
                        _context.t7 = _context.sent;
                        _context.t8 = this.contracts.Token;
                        _context.t9 = {
                            tx: _context.t7,
                            contract: _context.t8,
                            requiredEventName: 'Approval'
                        };

                        _context.t6.push.call(_context.t6, _context.t9);

                    case 42:
                        _context.next = 52;
                        break;

                    case 44:
                        if (!this.web3.toBigNumber(0).lt(approvalAmount)) {
                            _context.next = 52;
                            break;
                        }

                        _context.t10 = txInfo;
                        _context.next = 48;
                        return collateralToken.approve.sendTransaction(marketAddress, approvalAmount, opts);

                    case 48:
                        _context.t11 = _context.sent;
                        _context.t12 = this.contracts.Token;
                        _context.t13 = {
                            tx: _context.t11,
                            contract: _context.t12,
                            requiredEventName: 'Approval'
                        };

                        _context.t10.push.call(_context.t10, _context.t13);

                    case 52:
                        _context.t14 = txInfo;
                        _context.next = 55;
                        return market.buy.sendTransaction(outcomeTokenIndex, outcomeTokenCount, cost, opts);

                    case 55:
                        _context.t15 = _context.sent;
                        _context.t16 = this.contracts.Market;
                        _context.t17 = {
                            tx: _context.t15,
                            contract: _context.t16,
                            requiredEventName: 'OutcomeTokenPurchase'
                        };

                        _context.t14.push.call(_context.t14, _context.t17);

                        _context.next = 61;
                        return _promise2.default.all(txInfo.map(function (_ref3, i) {
                            var tx = _ref3.tx,
                                contract = _ref3.contract;
                            return contract.syncTransaction(tx);
                        }));

                    case 61:
                        _context.t18 = function (res, i) {
                            return (0, _utils.requireEventFromTXResult)(res, txInfo[i].requiredEventName);
                        };

                        txRequiredEvents = _context.sent.map(_context.t18);
                        purchaseEvent = txRequiredEvents[txRequiredEvents.length - 1];
                        return _context.abrupt('return', purchaseEvent.args.outcomeTokenCost.plus(purchaseEvent.args.marketFees));

                    case 65:
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
 * @param {(number|string|BigNumber)} [opts.limitMargin=0] - Because transactions change profits, there is a chance that the profit limit for the sell, which is set to the profit according to the latest mined block, will prevent the sell transaction from succeeding. This parameter can be used to decrease the profit limit by a fixed proportion. For example, specifying `limitMargin: 0.05` will make the profit limit decrease by 5%.
 * @param {(number|string|BigNumber)} [opts.minProfit] - Overrides the minimum profit limit supplied to the market contract which is derived from the latest block state of the market along with the `outcomeTokenCount` and `limitMargin` parameters.
 * @param {(number|string|BigNumber)} [opts.approvalAmount] - Amount of outcome tokens to allow market to handle. If unsupplied or null, allowance will be reset to the `approvalResetAmount` only if necessary. If set to 0, the approval transaction will be skipped.
 * @param {(number|string|BigNumber)} [opts.approvalResetAmount] - Set to this amount when resetting market outcome token allowance. If unsupplied or null, will be the sale amount specified by `outcomeTokenCount`.
 * @returns {BigNumber} How much collateral tokens caller received from sale
 * @alias Gnosis#sellOutcomeTokens
 */
var sellOutcomeTokens = exports.sellOutcomeTokens = function () {
    var _ref6 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3() {
        var _normalizeWeb3Args3,
            _normalizeWeb3Args4,
            _normalizeWeb3Args4$,
            marketAddress,
            outcomeTokenIndex,
            outcomeTokenCount,
            opts,
            _ref7,
            approvalAmount,
            approvalResetAmount,
            limitMargin,
            minProfit,
            market,
            outcomeToken,
            baseProfit,
            baseProfitWithFee,
            txInfo,
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
                        _ref7 = opts || {}, approvalAmount = _ref7.approvalAmount, approvalResetAmount = _ref7.approvalResetAmount, limitMargin = _ref7.limitMargin, minProfit = _ref7.minProfit;
                        _context3.next = 4;
                        return this.contracts.Market.at(marketAddress);

                    case 4:
                        market = _context3.sent;
                        _context3.t0 = this.contracts.Token;
                        _context3.t1 = this.contracts.Event;
                        _context3.next = 9;
                        return market.eventContract(opts);

                    case 9:
                        _context3.t2 = _context3.sent;
                        _context3.t3 = outcomeTokenIndex;
                        _context3.next = 13;
                        return _context3.t1.at.call(_context3.t1, _context3.t2).outcomeTokens(_context3.t3);

                    case 13:
                        _context3.t4 = _context3.sent;
                        _context3.next = 16;
                        return _context3.t0.at.call(_context3.t0, _context3.t4);

                    case 16:
                        outcomeToken = _context3.sent;

                        if (!(minProfit == null)) {
                            _context3.next = 28;
                            break;
                        }

                        if (limitMargin == null) {
                            limitMargin = 0;
                        }

                        _context3.next = 21;
                        return this.lmsrMarketMaker.calcProfit(marketAddress, outcomeTokenIndex, outcomeTokenCount, opts);

                    case 21:
                        baseProfit = _context3.sent;
                        _context3.t5 = baseProfit;
                        _context3.next = 25;
                        return market.calcMarketFee(baseProfit, opts);

                    case 25:
                        _context3.t6 = _context3.sent;
                        baseProfitWithFee = _context3.t5.sub.call(_context3.t5, _context3.t6);

                        minProfit = baseProfitWithFee.mul(this.web3.toBigNumber(1).sub(limitMargin)).round();

                    case 28:

                        if (approvalResetAmount == null) {
                            approvalResetAmount = outcomeTokenCount;
                        }

                        txInfo = [];

                        if (!(approvalAmount == null)) {
                            _context3.next = 45;
                            break;
                        }

                        seller = opts.from || this.defaultAccount;
                        _context3.next = 34;
                        return outcomeToken.allowance(seller, marketAddress, opts);

                    case 34:
                        marketAllowance = _context3.sent;

                        if (!marketAllowance.lt(outcomeTokenCount)) {
                            _context3.next = 43;
                            break;
                        }

                        _context3.t7 = txInfo;
                        _context3.next = 39;
                        return outcomeToken.approve.sendTransaction(marketAddress, approvalResetAmount, opts);

                    case 39:
                        _context3.t8 = _context3.sent;
                        _context3.t9 = this.contracts.Token;
                        _context3.t10 = {
                            tx: _context3.t8,
                            contract: _context3.t9,
                            requiredEventName: 'Approval'
                        };

                        _context3.t7.push.call(_context3.t7, _context3.t10);

                    case 43:
                        _context3.next = 53;
                        break;

                    case 45:
                        if (!this.web3.toBigNumber(0).lt(approvalAmount)) {
                            _context3.next = 53;
                            break;
                        }

                        _context3.t11 = txInfo;
                        _context3.next = 49;
                        return outcomeToken.approve.sendTransaction(marketAddress, approvalAmount, opts);

                    case 49:
                        _context3.t12 = _context3.sent;
                        _context3.t13 = this.contracts.Token;
                        _context3.t14 = {
                            tx: _context3.t12,
                            contract: _context3.t13,
                            requiredEventName: 'Approval'
                        };

                        _context3.t11.push.call(_context3.t11, _context3.t14);

                    case 53:
                        _context3.t15 = txInfo;
                        _context3.next = 56;
                        return market.sell.sendTransaction(outcomeTokenIndex, outcomeTokenCount, minProfit, opts);

                    case 56:
                        _context3.t16 = _context3.sent;
                        _context3.t17 = this.contracts.Market;
                        _context3.t18 = {
                            tx: _context3.t16,
                            contract: _context3.t17,
                            requiredEventName: 'OutcomeTokenSale'
                        };

                        _context3.t15.push.call(_context3.t15, _context3.t18);

                        _context3.next = 62;
                        return _promise2.default.all(txInfo.map(function (_ref8, i) {
                            var tx = _ref8.tx,
                                contract = _ref8.contract;
                            return contract.syncTransaction(tx);
                        }));

                    case 62:
                        _context3.t19 = function (res, i) {
                            return (0, _utils.requireEventFromTXResult)(res, txInfo[i].requiredEventName);
                        };

                        txRequiredEvents = _context3.sent.map(_context3.t19);
                        saleEvent = txRequiredEvents[txRequiredEvents.length - 1];
                        return _context3.abrupt('return', saleEvent.args.outcomeTokenProfit.minus(saleEvent.args.marketFees));

                    case 66:
                    case 'end':
                        return _context3.stop();
                }
            }
        }, _callee3, this);
    }));

    return function sellOutcomeTokens() {
        return _ref6.apply(this, arguments);
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
    var _ref5 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(_ref4) {
        var using = _ref4.using;
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
        return _ref5.apply(this, arguments);
    };
}();

sellOutcomeTokens.estimateGas = function () {
    var _ref10 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4(_ref9) {
        var using = _ref9.using;
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
        return _ref10.apply(this, arguments);
    };
}();
//# sourceMappingURL=markets.js.map