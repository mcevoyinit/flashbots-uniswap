const Factory = artifacts.require('UniswapV2Factory.sol');
const UniswapV2Pair = artifacts.require('UniswapV2Pair.sol');
const Gattaca1 = artifacts.require('Gattaca1.sol');
const Gattaca2 = artifacts.require('Gattaca2.sol');
const GattacaSwap = artifacts.require('GattacaSwap.sol');
const Router = artifacts.require('UniswapV2Router02.sol');
const WETH = artifacts.require('WETH.sol');
const dotenv = require('dotenv').config({ path: `${__dirname}/../.env` });

module.exports = async function (deployer, _network, addresses) {

    try {
        let account1;
        let account2;
         if(_network == 'goerli') {
            account1 = process.env.META_MASK_ACCOUNT_1
            account2 = process.env.META_MASK_ACCOUNT_2
        } else {
            const accounts = await web3.eth.getAccounts();
            account1 = accounts[0]
            account2 = accounts[1]
        }
        await deployer.deploy(Factory, addresses[0]);
        const factory = await Factory.deployed();
        console.log("Factory deployed with fee address", addresses[0])
        console.log("Account 1: ", account1)
        console.log("Account 2: ", account2)

        await deployer.deploy(Gattaca1);
        await deployer.deploy(Gattaca2);
        const token1 = await Gattaca1.deployed();
        const token2 = await Gattaca2.deployed();
        await token1.faucet(account1, 1000000000000)
        await token2.faucet(account1, 1000000000000)
        await token1.faucet(account2, 1000000000000)
        await token2.faucet(account2, 1000000000000)

        await deployer.deploy(WETH);
        const weth = await WETH.deployed();

        const pairAddress = await factory.createPair(token1.address, token2.address);
        console.log("Swap Pair created")

        await deployer.deploy(Router, factory.address, weth.address);
        const router = await Router.deployed()
        console.log("Router deployed")

        const approval1 = await token1.approve(router.address, 10000000)
        const approval2 = await token2.approve(router.address, 10000000)
        await token1.faucet(router.address, 1000000000000)
        await token2.faucet(router.address, 1000000000000)
        console.log("Transactions approved!")

        console.log("Adding liquidity")
        await router.addLiquidity(
            token1.address,
            token2.address,
            10000000,
            10000000,
            10000000,
            10000000,
            account1,
            Math.floor(Date.now() / 1000) + 60 * 10
        );

        console.log("Deploying GattacaSwap and Performing Approvals")

        await deployer.deploy(GattacaSwap, factory.address);
        const gattaca = await GattacaSwap.deployed()

        await token1.faucet(gattaca.address, 10000000)
        await token2.faucet(gattaca.address, 10000000)

        const approval5 = await token1.approve(router.address, 100)//web3.utils.toWei('500'))
        const approval6 = await token2.approve(router.address, 100)//web3.utils.toWei('500'))

        console.log("Performing Gattaca Swaps")
        const swap1 = await gattaca.swapMyTokens(token1.address, token2.address, router.address, 100, 0)
        console.log("Forward swap completed")
        const swap2 = await gattaca.swapMyTokens(token2.address, token1.address, router.address, 100, 0)
        console.log("Backward swap completed")
        const swap3 = await router.swapExactTokensForTokens(100,0,[token1.address, token2.address], account1,Math.floor(Date.now() / 1000) + 60 * 10)
        const swap4 = await router.swapExactTokensForTokens(100,0,[token2.address, token1.address], account1,Math.floor(Date.now() / 1000) + 60 * 10)
        console.log("Direct swaps completed")

        console.log("Gattaca1 address:", token1.address);
        console.log("Gattaca2 address:", token2.address);
        console.log("WETH address: ", weth.address);
        console.log("Uniswap Factory address: ", factory.address);
        console.log("Uniswap Router Address: "+router.address)
        console.log("Gattaca Swap address: ", gattaca.address);

        console.log("Copy the formatted addresses into your .env file so your clients can consume them")
        console.log("------------------------------------")
        console.log("TOKEN1=",token1.address)
        console.log("TOKEN2=",token2.address)
        console.log("WETH=",weth.address)
        console.log("FACTORY=",factory.address)
        console.log("ROUTER=",router.address)
        console.log("SWAP_CONTRACT=",gattaca.address)
        console.log("------------------------------------")
    } catch (e) {
        console.log(e);
    }
};