const Factory = artifacts.require('UniswapV2Factory.sol');
const UniswapV2Pair = artifacts.require('UniswapV2Pair.sol');
const Gattaca1 = artifacts.require('Gattaca1.sol');
const Gattaca2 = artifacts.require('Gattaca2.sol');
const GattacaSwap = artifacts.require('GattacaSwap.sol');
const Router = artifacts.require('UniswapV2Router02.sol');
const WETH = artifacts.require('WETH.sol');
const DOTENV = require('dotenv').config({ path: `${__dirname}/../.env` });

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

        console.log("Commencing deployment to :", _network);
        console.log("Account 1: ", account1)
        console.log("Account 2: ", account2)
        await deployer.deploy(Gattaca1);
        await deployer.deploy(Gattaca2);
        await deployer.deploy(WETH);
        const token1 = await Gattaca1.deployed();
        const token2 = await Gattaca2.deployed();
        const weth = await WETH.deployed();
        await token1.faucet(account1, 1000000000000)
        await token2.faucet(account1, 1000000000000)
        await token1.faucet(account2, 1000000000000)
        await token2.faucet(account2, 1000000000000)

        const feeAddress = addresses[0];
        await deployer.deploy(Factory, feeAddress);
        const factory = await Factory.deployed();
        console.log("Factory deployed with fee address", feeAddress)

        await deployer.deploy(Router, factory.address, weth.address);
        const router = await Router.deployed()

        await deployer.deploy(GattacaSwap, factory.address);
        const gattaca = await GattacaSwap.deployed()
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