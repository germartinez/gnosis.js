import assert from 'assert'
import _ from 'lodash'
import Gnosis from '../src/index'
import TestRPC from 'ethereumjs-testrpc'

const options = process.env.GNOSIS_OPTIONS ? JSON.parse(process.env.GNOSIS_OPTIONS) : null

const { requireEventFromTXResult, sendTransactionAndGetResult, Decimal } = Gnosis
const ONE = Math.pow(2, 64)

function isClose(a, b, relTol=2e-9, absTol=1e-18) {
    return Decimal(a.valueOf()).sub(b).abs().lte(
        Decimal.max(
            Decimal.max(
                Decimal.abs(a.valueOf()),
                Decimal.abs(b.valueOf())
            ).mul(relTol),
            absTol))
}

function assertIsClose(a, b) {
    assert(isClose(a, b), `${a} !~ ${b} by ${Decimal(a.valueOf()).sub(b).abs().div(Decimal.max(
                Decimal.abs(a.valueOf()),
                Decimal.abs(b.valueOf())
            ))}`)
}

async function requireRejection(q, msg) {
    try {
        await q
    } catch(e) {
        return e
    }
    throw new Error(msg || 'promise did not reject')
}

describe('Gnosis', function () {
    this.timeout(120000)
    let description = {
        title: 'Will Bitcoin Hardfork before 2018',
        description: 'Hello world',
        resolutionDate: new Date().toISOString(),
        outcomes: ['Yes', 'No']
    }

    it('exists', () => {
        assert(Gnosis)
    })

    it('initializes with defaults', async () => {
        let gnosis = await Gnosis.create()
        assert(gnosis)
    })

    it('initializes with options', async () => {
        let gnosis = await Gnosis.create({
            ethereum: 'http://localhost:8545',
            ipfs: '',
            gnosisdb: 'https:/db.gnosis.pm',
            defaultAccount: '0x61315aec47febe497554a2a0f3a3e7ef287d052f',
        })
        assert(gnosis)
        assert.equal(gnosis.defaultAccount, '0x61315aec47febe497554a2a0f3a3e7ef287d052f')
    })

    it('initializes with a provider', async () => {
        let gnosis = await Gnosis.create({
            ethereum: TestRPC.provider(),
        })
        assert(gnosis)
    })

    it('initializes with a provider that has a mangled name', async () => {
        class Mangled extends TestRPC.provider().constructor {}

        const provider = new Mangled()
        assert(provider.constructor.name === 'Mangled')

        let gnosis = await Gnosis.create({
            ethereum: provider,
        })
        assert(gnosis)
    })

    it('initializes with contracts containing gas stats', async () => {
        let gnosis = await Gnosis.create()
        assert(gnosis.contracts)
        assert(gnosis.contracts.CentralizedOracle.gasStats)
        assert(Object.keys(gnosis.contracts.CentralizedOracle.gasStats)
            .every((k) => gnosis.contracts.CentralizedOracle.abi
                .find(({ type, name }) => type === 'function' && name === k)))
        assert(gnosis.standardMarketFactory.gasStats)
    })

    it('custom options to be passed to provider stuff', async () => {
        let gnosis = await Gnosis.create(options)

        const txParamObjects = []
        const _sendAsync = gnosis.web3.currentProvider.sendAsync
        gnosis.web3.currentProvider.sendAsync = function() {
            const rpcMessage = arguments[0]
            if(rpcMessage.method === 'eth_sendTransaction') {
                txParamObjects.push(rpcMessage.params[0])
            }
            return _sendAsync.apply(this, arguments)
        }

        let ipfsHash = await gnosis.publishEventDescription(description)

        let centralizedOracleFactory = await gnosis.contracts.CentralizedOracleFactory.deployed()
        let oracle = await gnosis.createCentralizedOracle(ipfsHash)
        let event = await gnosis.createCategoricalEvent({
            collateralToken: gnosis.etherToken,
            oracle: oracle,
            outcomeCount: 2,
        })
        let market = await gnosis.createMarket({
            event,
            marketMaker: gnosis.lmsrMarketMaker,
            fee: 5000,
        })
        assert.equal(txParamObjects[txParamObjects.length - 1].event, undefined)

        requireEventFromTXResult(await gnosis.etherToken.deposit({ value: 2e18 }), 'Deposit')

        requireEventFromTXResult(await gnosis.etherToken.approve(market.address, 1e18), 'Approval')
        requireEventFromTXResult(await market.fund(1e18), 'MarketFunding')

        const numOutcomeTokens = await gnosis.buyOutcomeTokens({
            market,
            outcomeTokenIndex: 0,
            outcomeTokenCount: 1e18,
            custom: 'foo',
            customApproveOverloaded: 'bar',
            customBuyOverloaded: 'baz',
            approveTxOpts: {
                customApproveOverloaded: 'overbarred'
            },
            buyTxOpts: {
                customBuyOverloaded: 'overbazzed'
            },
        })

        let approveTxParamObj = txParamObjects[txParamObjects.length - 2]
        const buyTxParamObj = txParamObjects[txParamObjects.length - 1]

        assert.equal(approveTxParamObj.custom, 'foo')
        assert.equal(approveTxParamObj.approveTxOpts, undefined)
        assert.equal(approveTxParamObj.buyTxOpts, undefined)
        assert.equal(approveTxParamObj.customApproveOverloaded, 'overbarred')
        assert.equal(buyTxParamObj.custom, 'foo')
        assert.equal(buyTxParamObj.approveTxOpts, undefined)
        assert.equal(buyTxParamObj.buyTxOpts, undefined)
        assert.equal(buyTxParamObj.customBuyOverloaded, 'overbazzed')

        await gnosis.sellOutcomeTokens({
            market,
            outcomeTokenIndex: 0,
            outcomeTokenCount: numOutcomeTokens,
            custom2: 'foo',
            custom2ApproveOverloaded: 'bar',
            custom2BuyOverloaded: 'baz',
            approveTxOpts: {
                custom2ApproveOverloaded: 'overbarred'
            },
            sellTxOpts: {
                custom2BuyOverloaded: 'overbazzed'
            },
        })

        approveTxParamObj = txParamObjects[txParamObjects.length - 2]
        const sellTxParamObj = txParamObjects[txParamObjects.length - 1]

        assert.equal(approveTxParamObj.custom2, 'foo')
        assert.equal(approveTxParamObj.approveTxOpts, undefined)
        assert.equal(approveTxParamObj.sellTxOpts, undefined)
        assert.equal(approveTxParamObj.custom2ApproveOverloaded, 'overbarred')
        assert.equal(sellTxParamObj.custom2, 'foo')
        assert.equal(sellTxParamObj.approveTxOpts, undefined)
        assert.equal(sellTxParamObj.sellTxOpts, undefined)
        assert.equal(sellTxParamObj.custom2BuyOverloaded, 'overbazzed')
    })

    describe('#oracles', () => {
        let gnosis, ipfsHash

        beforeEach(async () => {
            gnosis = await Gnosis.create(options)
            ipfsHash = await gnosis.publishEventDescription(description)
        })

        it('creates centralized oracles', async () => {
            let oracle = await gnosis.createCentralizedOracle(ipfsHash)
            assert(oracle)
        })

        it('estimates gas usage for centralized oracle creation', async () => {
            let centralizedOracleFactory = await gnosis.contracts.CentralizedOracleFactory.deployed()
            let actualUsingRPC = await centralizedOracleFactory.createCentralizedOracle.estimateGas(ipfsHash)
            let actualUsingStats = centralizedOracleFactory.gasStats.createCentralizedOracle.averageGasUsed

            assert.equal(actualUsingRPC, await gnosis.createCentralizedOracle.estimateGas(ipfsHash, { using: 'rpc' }))
            assert.equal(actualUsingStats, await gnosis.createCentralizedOracle.estimateGas({ using: 'stats' }))
        })

        it('errors with sensible message when creating centralized oracle incorrectly', async () => {
            let error = await requireRejection(gnosis.createCentralizedOracle('???'))
            assert.equal(error.toString(), 'Error: expected ipfsHash ??? to have length 46')
        })

        it('creates ultimate oracles', async () => {
            let cenOracle = await gnosis.createCentralizedOracle(ipfsHash)
            let ultOracle = await gnosis.createUltimateOracle({
                forwardedOracle: cenOracle,
                collateralToken: gnosis.etherToken,
                spreadMultiplier: 2,
                challengePeriod: 3600,
                challengeAmount: 1000,
                frontRunnerPeriod: 60
            })
            assert(ultOracle)
        })

        it('estimates gas usage for ultimate oracle creation', async () => {
            let cenOracle = await gnosis.createCentralizedOracle(ipfsHash)

            let ultimateOracleFactory = await gnosis.contracts.UltimateOracleFactory.deployed()
            let ultOracleArgs = {
                forwardedOracle: cenOracle,
                collateralToken: gnosis.etherToken,
                spreadMultiplier: 2,
                challengePeriod: 3600,
                challengeAmount: 1000,
                frontRunnerPeriod: 60
            }

            let actualUsingRPC = await ultimateOracleFactory.createUltimateOracle.estimateGas(
                ultOracleArgs.forwardedOracle.address,
                ultOracleArgs.collateralToken.address,
                ultOracleArgs.spreadMultiplier,
                ultOracleArgs.challengePeriod,
                ultOracleArgs.challengeAmount,
                ultOracleArgs.frontRunnerPeriod
            )
            let actualUsingStats = ultimateOracleFactory.gasStats.createUltimateOracle.averageGasUsed

            assert.equal(actualUsingRPC, await gnosis.createUltimateOracle.estimateGas(Object.assign({ using: 'rpc' }, ultOracleArgs)))
            assert.equal(actualUsingStats, await gnosis.createUltimateOracle.estimateGas({ using: 'stats' }))
        })

        it('publishes event descriptions and loads them', async () => {
            let newDescription = {
                title: 'Will Bitcoin Hardfork before 2018',
                description: 'Hello world',
                resolutionDate: description.resolutionDate,
                outcomes: [
                  'Yes',
                  'No'
                ]
            }
            let newIpfsHash = await gnosis.publishEventDescription(newDescription)
            assert(newIpfsHash)
            let loadedDescription = await gnosis.loadEventDescription(newIpfsHash)
            assert.deepEqual(loadedDescription, description)
        })

        it('errors on attempting to publish invalid event descriptions', async () => {
            const scalarDesc = {
                title: 'How many licks to the center of a Tootsie Pop?',
                description: 'Is this a trademark violation?',
                resolutionDate: description.resolutionDate,
                decimals: 1,
                unit: 'licks',
            }

            for(const badDesc of [
                null,
                {},
                Object.assign({}, description, { title: '' }),
                Object.assign({}, description, { description: '' }),
                Object.assign({}, description, { resolutionDate: 'funky day' }),
                { title: 'foo', description: 'bar', resolutionDate: description.resolutionDate },
                Object.assign({}, description, { outcomes: [] }),
                Object.assign({}, description, { outcomes: ['only choice'] }),
                Object.assign({}, description, { outcomes: ['one', 2] }),
                Object.assign({}, description, { outcomes: ['one', ''] }),
                Object.assign({}, description, { outcomes: ['one', 'repeat', 'repeat'] }),
                Object.assign({}, scalarDesc, { decimals: -1 })
            ]) {
                await requireRejection(gnosis.publishEventDescription(badDesc),
                    `able to publish description for ${JSON.stringify(badDesc, null, 2)}`)
            }
        })
    })

    describe('#events', () => {
        let gnosis, ipfsHash, oracle

        beforeEach(async () => {
            gnosis = await Gnosis.create(options)
            ipfsHash = await gnosis.publishEventDescription(description)
            oracle = await gnosis.createCentralizedOracle(ipfsHash)
        })

        it('creates and resolves categorical events', async () => {
            let event = await gnosis.createCategoricalEvent({
                collateralToken: gnosis.etherToken,
                oracle: oracle,
                outcomeCount: 2
            })
            assert(event)
            assert(!await oracle.isOutcomeSet())
            assert(!await event.isOutcomeSet())

            await gnosis.resolveEvent({
                event,
                outcome: 1,
            })

            assert(await oracle.isOutcomeSet())
            assert(await event.isOutcomeSet())
        })

        it('creates and resolves scalar events', async () => {
            let event = await gnosis.createScalarEvent({
                collateralToken: gnosis.etherToken,
                oracle: oracle,
                lowerBound: -1000,
                upperBound: 1000
            })
            assert(event)
            assert(!await oracle.isOutcomeSet())
            assert(!await event.isOutcomeSet())

            await gnosis.resolveEvent({
                event,
                outcome: -55,
            })

            assert(await oracle.isOutcomeSet())
            assert(await event.isOutcomeSet())
        })

        it('estimates gas usage for categorical event creation', async () => {
            let eventFactory = await gnosis.contracts.EventFactory.deployed()
            let eventArgs = {
                collateralToken: gnosis.etherToken,
                oracle: oracle,
                outcomeCount: 2
            }

            let actualUsingRPC = await eventFactory.createCategoricalEvent.estimateGas(
                eventArgs.collateralToken.address,
                eventArgs.oracle.address,
                eventArgs.outcomeCount
            )
            let actualUsingStats = eventFactory.gasStats.createCategoricalEvent.averageGasUsed

            assert.equal(actualUsingRPC, await gnosis.createCategoricalEvent.estimateGas(Object.assign({ using: 'rpc' }, eventArgs)))
            assert.equal(actualUsingStats, await gnosis.createCategoricalEvent.estimateGas({ using: 'stats' }))
        })

        it('estimates gas usage for event resolution', async () => {
            let event = await gnosis.createCategoricalEvent({
                collateralToken: gnosis.etherToken,
                oracle: oracle,
                outcomeCount: 2
            })
            assert(await gnosis.resolveEvent.estimateGas({ event, using: 'stats' }) > 0)
        })
    })

    describe('#markets', () => {
        let gnosis, oracle, event, ipfsHash

        beforeEach(async () => {
            gnosis = await Gnosis.create(options)
            ipfsHash = await gnosis.publishEventDescription(description)
            oracle = await gnosis.createCentralizedOracle(ipfsHash)
            event = await gnosis.createCategoricalEvent({
                collateralToken: gnosis.etherToken,
                oracle: oracle,
                outcomeCount: 2
            })
        })

        it('creates markets', async () => {
            let market = await gnosis.createMarket({
                event: event,
                marketMaker: gnosis.lmsrMarketMaker,
                fee: 100,
            })
            assert(market)
        })
    })

    describe('.lmsr', () => {
        let gnosis, oracle, event, ipfsHash, market, netOutcomeTokensSold, funding, feeFactor, participants

        beforeEach(async () => {
            netOutcomeTokensSold = [0, 0]
            feeFactor = 5000 // 0.5%

            gnosis = await Gnosis.create(options)
            participants = gnosis.web3.eth.accounts.slice(0, 4)
            ipfsHash = await gnosis.publishEventDescription(description)
            oracle = await gnosis.createCentralizedOracle(ipfsHash)
            event = await gnosis.createCategoricalEvent({
                collateralToken: gnosis.etherToken,
                oracle: oracle,
                outcomeCount: netOutcomeTokensSold.length
            })
            market = await gnosis.createMarket({
                event: event,
                marketMaker: gnosis.lmsrMarketMaker,
                fee: feeFactor, // 0%
            })

            funding = 1e18
            requireEventFromTXResult(await gnosis.etherToken.deposit({ value: funding }), 'Deposit')
            requireEventFromTXResult(await gnosis.etherToken.approve(market.address, funding), 'Approval')
            requireEventFromTXResult(await market.fund(funding), 'MarketFunding')
        })

        it('can do buying and selling calculations and transactions', async () => {
            let outcomeTokenIndex = 0
            let outcomeTokenCount = 1e18

            // Buying shares, long version

            let localCalculatedCost = Gnosis.calcLMSRCost({
                netOutcomeTokensSold,
                funding,
                outcomeTokenIndex,
                outcomeTokenCount,
                feeFactor,
            })

            let chainCalculatedCost = await gnosis.lmsrMarketMaker.calcCost(market.address, outcomeTokenIndex, outcomeTokenCount)
            chainCalculatedCost = chainCalculatedCost.add(await market.calcMarketFee(chainCalculatedCost))
            assert(isClose(localCalculatedCost.valueOf(), chainCalculatedCost.valueOf()))
            assert(localCalculatedCost.gte(chainCalculatedCost.valueOf()))

            requireEventFromTXResult(await gnosis.etherToken.deposit({ value: localCalculatedCost.valueOf() }), 'Deposit')
            requireEventFromTXResult(await gnosis.etherToken.approve(market.address, localCalculatedCost.valueOf()), 'Approval')
            let purchaseEvent = requireEventFromTXResult(
                await market.buy(outcomeTokenIndex, outcomeTokenCount, localCalculatedCost.valueOf()),
                'OutcomeTokenPurchase'
            )
            let actualCost = purchaseEvent.args.outcomeTokenCost.plus(purchaseEvent.args.marketFees)
            assert(isClose(localCalculatedCost.valueOf(), actualCost.valueOf()))
            assert(localCalculatedCost.gte(actualCost.valueOf()))

            // Checking inverse calculation

            let calculatedOutcomeTokenCount = Gnosis.calcLMSROutcomeTokenCount({
                netOutcomeTokensSold,
                funding,
                outcomeTokenIndex,
                cost: localCalculatedCost.valueOf(),
                feeFactor,
            })

            assert(isClose(outcomeTokenCount.valueOf(), calculatedOutcomeTokenCount.valueOf()))

            netOutcomeTokensSold[outcomeTokenIndex] += outcomeTokenCount

            // Buying shares, short version

            outcomeTokenCount = 2.5e17

            localCalculatedCost = Gnosis.calcLMSRCost({
                netOutcomeTokensSold,
                funding,
                outcomeTokenIndex,
                outcomeTokenCount,
                feeFactor,
            })

            requireEventFromTXResult(await gnosis.etherToken.deposit({ value: localCalculatedCost.valueOf() }), 'Deposit')
            actualCost = await gnosis.buyOutcomeTokens({
                market, outcomeTokenIndex, outcomeTokenCount
            })

            assert(isClose(localCalculatedCost.valueOf(), actualCost.valueOf()))
            assert(localCalculatedCost.gte(actualCost.valueOf()))

            netOutcomeTokensSold[outcomeTokenIndex] += outcomeTokenCount

            // Selling shares, long version

            let numOutcomeTokensToSell = 5e17

            let localCalculatedProfit = Gnosis.calcLMSRProfit({
                netOutcomeTokensSold,
                funding,
                outcomeTokenIndex,
                outcomeTokenCount: numOutcomeTokensToSell,
                feeFactor,
            })

            let chainCalculatedProfit = await gnosis.lmsrMarketMaker.calcProfit(market.address, outcomeTokenIndex, numOutcomeTokensToSell)
            chainCalculatedProfit = chainCalculatedProfit.sub(await market.calcMarketFee(chainCalculatedProfit))
            assertIsClose(localCalculatedProfit.valueOf(), chainCalculatedProfit.valueOf())
            assert(localCalculatedProfit.lte(chainCalculatedProfit.valueOf()))

            let outcomeToken = await gnosis.contracts.Token.at(await gnosis.contracts.Event.at(await market.eventContract()).outcomeTokens(outcomeTokenIndex))
            requireEventFromTXResult(await outcomeToken.approve(market.address, numOutcomeTokensToSell), 'Approval')
            let saleEvent = requireEventFromTXResult(
                await market.sell(outcomeTokenIndex, numOutcomeTokensToSell, localCalculatedProfit.valueOf()),
                'OutcomeTokenSale'
            )
            let actualProfit = saleEvent.args.outcomeTokenProfit.minus(saleEvent.args.marketFees)
            assert(isClose(localCalculatedProfit.valueOf(), actualProfit.valueOf()))
            assert(localCalculatedProfit.lte(actualProfit.valueOf()))

            netOutcomeTokensSold[outcomeTokenIndex] -= numOutcomeTokensToSell

            // Selling shares, short version

            numOutcomeTokensToSell = 2.5e17

            localCalculatedProfit = Gnosis.calcLMSRProfit({
                netOutcomeTokensSold,
                funding,
                outcomeTokenIndex,
                outcomeTokenCount: numOutcomeTokensToSell,
                feeFactor,
            })

            actualProfit = await gnosis.sellOutcomeTokens({
                market, outcomeTokenIndex,
                outcomeTokenCount: numOutcomeTokensToSell,
            })
            assert(isClose(localCalculatedProfit.valueOf(), actualProfit.valueOf()))
            assert(localCalculatedProfit.lte(actualProfit.valueOf()))

            netOutcomeTokensSold[outcomeTokenIndex] -= numOutcomeTokensToSell

            // Setting the outcome and redeeming winnings

            await gnosis.resolveEvent({
                event,
                outcome: outcomeTokenIndex,
            })

            let balanceBefore = await gnosis.etherToken.balanceOf(gnosis.defaultAccount)

            let winnings = await sendTransactionAndGetResult({
                callerContract: event,
                methodName: 'redeemWinnings',
                methodArgs: [],
                eventName: 'WinningsRedemption',
                eventArgName: 'winnings',
            })

            let balanceAfter = await gnosis.etherToken.balanceOf(gnosis.defaultAccount)

            assert.equal(winnings.valueOf(), netOutcomeTokensSold[outcomeTokenIndex])
            assert.equal(balanceAfter.sub(balanceBefore).valueOf(), winnings.valueOf())
        })

        it('can override cost and minProfit for buying and selling', async () => {
            let outcomeTokenIndex = 0
            let outcomeTokenCount = 1e18

            let localCalculatedCost = Gnosis.calcLMSRCost({
                netOutcomeTokensSold,
                funding,
                outcomeTokenIndex,
                outcomeTokenCount,
                feeFactor,
            })

            requireEventFromTXResult(await gnosis.etherToken.deposit({ value: localCalculatedCost.valueOf() }), 'Deposit')
            await requireRejection(gnosis.buyOutcomeTokens({
                market, outcomeTokenIndex, outcomeTokenCount, cost: localCalculatedCost.div(10).valueOf()
            }))

            let localCalculatedProfit = Gnosis.calcLMSRProfit({
                netOutcomeTokensSold,
                funding,
                outcomeTokenIndex,
                outcomeTokenCount,
                feeFactor,
            })

            await requireRejection(gnosis.sellOutcomeTokens({
                market, outcomeTokenIndex, outcomeTokenCount, minProfit: localCalculatedProfit.mul(10).valueOf()
            }))
        })

        it('can do buying and selling with custom approve amounts', async () => {
            const approvalAmount = 2e18
            const outcomeTokenIndex = 0
            const outcomeTokenCount = 1e18

            const outcomeToken = await gnosis.contracts.Token.at(
                await gnosis.contracts.Event.at(
                    await market.eventContract()
                ).outcomeTokens(outcomeTokenIndex)
            )

            requireEventFromTXResult(await gnosis.etherToken.deposit({ value: approvalAmount }), 'Deposit')

            const balanceBefore = await gnosis.etherToken.balanceOf(gnosis.defaultAccount)
            const allowanceBefore = await gnosis.etherToken.allowance(gnosis.defaultAccount, market.address)

            const actualCost = await gnosis.buyOutcomeTokens({
                market, outcomeTokenIndex, outcomeTokenCount, approvalAmount
            })

            const balanceAfter = await gnosis.etherToken.balanceOf(gnosis.defaultAccount)
            const allowanceAfter = await gnosis.etherToken.allowance(gnosis.defaultAccount, market.address)

            assert.equal(balanceBefore.sub(balanceAfter).valueOf(), actualCost.valueOf())
            assert.equal(allowanceAfter.sub(allowanceBefore).valueOf(), actualCost.sub(approvalAmount).neg().valueOf())

            const actualCost2 = await gnosis.buyOutcomeTokens({
                market, outcomeTokenIndex, outcomeTokenCount
            })

            const balanceAfter2 = await gnosis.etherToken.balanceOf(gnosis.defaultAccount)
            const allowanceAfter2 = await gnosis.etherToken.allowance(gnosis.defaultAccount, market.address)

            assert.equal(balanceAfter.sub(balanceAfter2).valueOf(), actualCost2.valueOf())
            assert.equal(allowanceAfter.sub(allowanceAfter2).valueOf(), actualCost2.valueOf())

            const amountToSell = 3e17

            const outcomeBalanceBefore = await outcomeToken.balanceOf(gnosis.defaultAccount)

            await gnosis.sellOutcomeTokens({
                market, outcomeTokenIndex, outcomeTokenCount: amountToSell, approvalAmount: outcomeTokenCount
            })

            const outcomeBalanceAfter = await outcomeToken.balanceOf(gnosis.defaultAccount)
            const outcomeAllowanceAfter = await outcomeToken.allowance(gnosis.defaultAccount, market.address)

            assert.equal(outcomeBalanceBefore.sub(outcomeBalanceAfter).valueOf(), amountToSell)
            assert.equal(outcomeAllowanceAfter.valueOf(), outcomeTokenCount - amountToSell)

            await gnosis.sellOutcomeTokens({
                market, outcomeTokenIndex, outcomeTokenCount: amountToSell
            })

            const outcomeBalanceAfter2 = await outcomeToken.balanceOf(gnosis.defaultAccount)
            const outcomeAllowanceAfter2 = await outcomeToken.allowance(gnosis.defaultAccount, market.address)

            assert.equal(outcomeBalanceAfter.sub(outcomeBalanceAfter2).valueOf(), amountToSell)
            assert.equal(outcomeAllowanceAfter2.valueOf(), outcomeTokenCount - 2 * amountToSell)
        })

        it('can do buying and selling while resetting to a custom amount', async () => {
            const approvalResetAmount = 2e18
            const outcomeTokenIndex = 0
            const outcomeTokenCount = 1e17

            const outcomeToken = await gnosis.contracts.Token.at(
                await gnosis.contracts.Event.at(
                    await market.eventContract()
                ).outcomeTokens(outcomeTokenIndex)
            )

            requireEventFromTXResult(await gnosis.etherToken.deposit({ value: approvalResetAmount }), 'Deposit')

            const balanceBefore = await gnosis.etherToken.balanceOf(gnosis.defaultAccount)
            const allowanceBefore = await gnosis.etherToken.allowance(gnosis.defaultAccount, market.address)

            const actualCost = await gnosis.buyOutcomeTokens({
                market, outcomeTokenIndex, outcomeTokenCount, approvalResetAmount
            })

            let balanceAfter = await gnosis.etherToken.balanceOf(gnosis.defaultAccount)
            let allowanceAfter = await gnosis.etherToken.allowance(gnosis.defaultAccount, market.address)

            assert.equal(balanceBefore.sub(balanceAfter).valueOf(), actualCost.valueOf())
            assert.equal(allowanceAfter.sub(allowanceBefore).valueOf(), actualCost.sub(approvalResetAmount).neg().valueOf())

            let actualCost2 = await gnosis.buyOutcomeTokens({
                market, outcomeTokenIndex, outcomeTokenCount, approvalResetAmount
            })

            let balanceAfter2, allowanceAfter2
            while(allowanceAfter.gte(actualCost2)) {
                balanceAfter2 = await gnosis.etherToken.balanceOf(gnosis.defaultAccount)
                allowanceAfter2 = await gnosis.etherToken.allowance(gnosis.defaultAccount, market.address)

                assert.equal(balanceAfter.sub(balanceAfter2).valueOf(), actualCost2.valueOf())
                assert.equal(allowanceAfter.sub(allowanceAfter2).valueOf(), actualCost2.valueOf())

                balanceAfter = balanceAfter2
                allowanceAfter = allowanceAfter2
                actualCost2 = await gnosis.buyOutcomeTokens({
                    market, outcomeTokenIndex, outcomeTokenCount, approvalResetAmount
                })
            }

            balanceAfter2 = await gnosis.etherToken.balanceOf(gnosis.defaultAccount)
            allowanceAfter2 = await gnosis.etherToken.allowance(gnosis.defaultAccount, market.address)

            assert.equal(balanceAfter.sub(balanceAfter2).valueOf(), actualCost2.valueOf())
            assert.equal(allowanceAfter2.sub(approvalResetAmount).neg().valueOf(), actualCost2.valueOf())

            const amountToSell = 3e17

            const outcomeBalanceBefore = await outcomeToken.balanceOf(gnosis.defaultAccount)
            const outcomeAllowanceBefore = await outcomeToken.allowance(gnosis.defaultAccount, market.address)

            const profit = await gnosis.sellOutcomeTokens({
                market, outcomeTokenIndex, outcomeTokenCount: amountToSell, approvalResetAmount
            })

            const outcomeBalanceAfter = await outcomeToken.balanceOf(gnosis.defaultAccount)
            const outcomeAllowanceAfter = await outcomeToken.allowance(gnosis.defaultAccount, market.address)

            assert.equal(outcomeBalanceBefore.sub(outcomeBalanceAfter).valueOf(), amountToSell)
            assert.equal(outcomeAllowanceAfter.valueOf(), approvalResetAmount - amountToSell)

            const profit2 = await gnosis.sellOutcomeTokens({
                market, outcomeTokenIndex, outcomeTokenCount: amountToSell, approvalResetAmount
            })

            const outcomeBalanceAfter2 = await outcomeToken.balanceOf(gnosis.defaultAccount)
            const outcomeAllowanceAfter2 = await outcomeToken.allowance(gnosis.defaultAccount, market.address)

            assert.equal(outcomeBalanceAfter.sub(outcomeBalanceAfter2).valueOf(), amountToSell)
            assert.equal(outcomeAllowanceAfter2.valueOf(), approvalResetAmount - 2 * amountToSell)
        })

        it('can buy and sell with a limit margin', async () => {
            const outcomeTokenIndex = 0
            const outcomeTokenCount = 4e16
            const amountToStart = 1e18
            const limitMargin = 0.05;

            (await Promise.all(participants.map(
                (p) => gnosis.etherToken.deposit({ value: amountToStart, from: p })
            ))).forEach((res) => requireEventFromTXResult(res, 'Deposit'));

            (await Promise.all(participants.map(
                (p) => gnosis.etherToken.balanceOf(p)
            ))).forEach((b) => assert(b.gte(amountToStart)));

            (await Promise.all(participants.map(
                (p) => gnosis.buyOutcomeTokens({
                    market, outcomeTokenIndex, outcomeTokenCount,
                    limitMargin,
                    from: p,
                })
            )));

            (await Promise.all(participants.map(
                (p) => gnosis.sellOutcomeTokens({
                    market, outcomeTokenIndex, outcomeTokenCount,
                    limitMargin,
                    from: p,
                })
            )))
        })

        it('accepts strings for outcome token index', async () => {
            let outcomeTokenIndex = 0
            let outcomeTokenCount = 1000000000

            let calculatedCost1 = Gnosis.calcLMSRCost({
                netOutcomeTokensSold,
                funding,
                outcomeTokenIndex,
                outcomeTokenCount,
            })

            let calculatedCost2 = Gnosis.calcLMSRCost({
                netOutcomeTokensSold,
                funding,
                outcomeTokenIndex: outcomeTokenIndex.toString(),
                outcomeTokenCount,
            })

            assert.equal(calculatedCost1.valueOf(), calculatedCost2.valueOf())
        })

        it('calculates marginal price function', async () => {
            let outcomeTokenIndex = 0
            let outcomeTokenCount = 1e18

            let chainCalculatedCost = await gnosis.lmsrMarketMaker.calcCost(market.address, outcomeTokenIndex, outcomeTokenCount)
            chainCalculatedCost = chainCalculatedCost.add(await market.calcMarketFee(chainCalculatedCost))
            requireEventFromTXResult(await gnosis.etherToken.deposit({ value: chainCalculatedCost }), 'Deposit')
            requireEventFromTXResult(await gnosis.etherToken.approve(market.address, chainCalculatedCost), 'Approval')
            requireEventFromTXResult(await market.buy(outcomeTokenIndex, outcomeTokenCount, chainCalculatedCost), 'OutcomeTokenPurchase')

            let newNetOutcomeTokensSold = netOutcomeTokensSold.slice()
            newNetOutcomeTokensSold[outcomeTokenIndex] = outcomeTokenCount

            let localCalculatedMarginalPrice = Gnosis.calcLMSRMarginalPrice({
                netOutcomeTokensSold: newNetOutcomeTokensSold,
                funding,
                outcomeTokenIndex
            })
            let chainCalculatedMarginalPrice = await gnosis.lmsrMarketMaker.calcMarginalPrice(market.address, outcomeTokenIndex)
            chainCalculatedMarginalPrice = Decimal(chainCalculatedMarginalPrice.valueOf())

            assert(isClose(localCalculatedMarginalPrice.valueOf(), chainCalculatedMarginalPrice.div(ONE).valueOf()))
        })

        it('does not mutate arguments when performing calculations', () => {
            let netOutcomeTokensSoldCopy = _.clone(netOutcomeTokensSold)
            let outcomeTokenIndex = 0
            let cost = 1e18

            let lmsrOptions = { netOutcomeTokensSold, outcomeTokenIndex, cost, funding }
            let lmsrOptionsCopy = _.clone(lmsrOptions)

            assert.deepStrictEqual(netOutcomeTokensSoldCopy, netOutcomeTokensSold)
            assert.deepStrictEqual(lmsrOptionsCopy, lmsrOptions)

            const probability = Gnosis.calcLMSRMarginalPrice(lmsrOptions)

            assert.deepStrictEqual(netOutcomeTokensSoldCopy, netOutcomeTokensSold)
            assert.deepStrictEqual(lmsrOptionsCopy, lmsrOptions)
            assert(probability)

            const maximumWin = Gnosis.calcLMSROutcomeTokenCount(lmsrOptions)

            assert.deepStrictEqual(netOutcomeTokensSoldCopy, netOutcomeTokensSold)
            assert.deepStrictEqual(lmsrOptionsCopy, lmsrOptions)
            assert(maximumWin)
        })

        it('estimates buying and selling gas costs', async () => {
            let outcomeTokenIndex = 0
            let outcomeTokenCount = 1e18

            assert(await gnosis.buyOutcomeTokens.estimateGas({
                market, outcomeTokenIndex, outcomeTokenCount,
                using: 'stats'
            }) > 0)

            assert(await gnosis.sellOutcomeTokens.estimateGas({
                market, outcomeTokenIndex, outcomeTokenCount,
                using: 'stats'
            }) > 0)
        })

    })
})
