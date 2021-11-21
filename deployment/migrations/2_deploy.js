const Factory = artifacts.require('UniswapV2Factory.sol');
const UniswapV2Pair = artifacts.require('UniswapV2Pair.sol');
const Gattaca1 = artifacts.require('Gattaca1.sol');
const Gattaca2 = artifacts.require('Gattaca2.sol');
const GattacaSwap = artifacts.require('GattacaSwap.sol');
const Router = artifacts.require('UniswapV2Router02.sol');
const WETH = artifacts.require('WETH.sol');

module.exports = async function (deployer, _network, addresses) {
    try {
        console.log("Commencing deployment to :", _network);
        await deployer.deploy(Gattaca1);
        await deployer.deploy(Gattaca2);
        await deployer.deploy(WETH);
        const token1 = await Gattaca1.deployed();
        const token2 = await Gattaca2.deployed();
        const weth = await WETH.deployed();

        const feeAddress = addresses[0];
        await deployer.deploy(Factory, feeAddress);
        const factory = await Factory.deployed();

        await deployer.deploy(Router, factory.address, weth.address);
        const router = await Router.deployed()

        await deployer.deploy(GattacaSwap, factory.address);
        const gattaca = await GattacaSwap.deployed();
        console.log("Gattaca1 address:", token1.address);
        console.log("Gattaca2 address:", token2.address);
        console.log("WETH address: ", weth.address);
        console.log("Uniswap Factory address: ", factory.address);
        console.log("Uniswap Router Address: "+router.address)
        console.log("Gattaca Swap address: ", gattaca.address);
    } catch (e) {
        console.log(e);
    }
};