const { BigNumber, ethers } = require('ethers');
const { FlashbotsBundleProvider } = require('@flashbots/ethers-provider-bundle')
require('dotenv').config({ path: `${__dirname}/../../.env` });

const GWEI = BigNumber.from(10).pow(9)
const GAS_PRICE = GWEI.mul(12)

const addresses = {
    token1: process.env.TOKEN1,
    token2: process.env.TOKEN2,
    weth: process.env.WETH,
    factory: process.env.FACTORY,
    router: process.env.ROUTER,
    swap: process.env.SWAP_CONTRACT,
}

const keys = {
    sender: '0xccb5c26e093973b9f753744af6c3e1bb0b4a601ea181d3332ae30a1b91adf842' //process.env.LOCAL_SENDER_KEY
}

async function main() {

    console.log(addresses)

    let provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

    const wallet = new ethers.Wallet(keys.sender, provider)

    const authSigner = new ethers.Wallet.createRandom()

    const flashbotsProvider = await FlashbotsBundleProvider.create(provider, wallet)

    const swapAbi = ['function swapMyTokens(address _tokenIn,address _tokenOut, address _router, uint _amountIn, uint _amountOutMin) external payable']

    let interface = new ethers.utils.Interface(swapAbi);

    const nonce = await provider.getTransactionCount(wallet.address) + 1
    
    // Txn 1
    const data1 = interface.encodeFunctionData('swapMyTokens', [
        addresses.token1,
        addresses.token2,
        addresses.router,
        10,
        0,
    ]);

    const swapTransaction1 = {
        to: addresses.swap,
        gasPrice: GAS_PRICE,
        gasLimit: 500000,
        data: data1,
        nonce: nonce
    }

    // Txn 2
    const data2 = interface.encodeFunctionData('swapMyTokens', [
        addresses.token2,
        addresses.token1, //reversed
        addresses.router,
        10,
        0,
    ]);

    const swapTransaction2 = {
        to: addresses.swap,
        gasPrice: GAS_PRICE,
        gasLimit: 500000,
        data: data2
    }

    // Txn 3
    const data3 = interface.encodeFunctionData('swapMyTokens', [
        addresses.token1,
        addresses.token2,
        addresses.router,
        20,
        0,
    ]);

    const swapTransaction3 = {
        to: addresses.swap,
        gasPrice: GAS_PRICE,
        gasLimit: 500000,
        data: data3
    }

    const signedBundle = await flashbotsProvider.signBundle([
        {
            signer: wallet,
            transaction: swapTransaction1
        },
        {
            signer: wallet,
            transaction: swapTransaction2
        },
        {
            signer: wallet,
            transaction: swapTransaction3
        },
        
    ])


    provider.on('block', async (blockNumber) => {
        const targetBlock = blockNumber + 3

        // Simulate transaction first
        const simulation = await flashbotsProvider.simulate(signedBundle, targetBlock)
        if ('error' in simulation) {
            console.warn(`Simulation Error: ${simulation.error.message}`)
            process.exit(1)
        } else {
            console.log(`Simulation Success: ${JSON.stringify(simulation, null, 2)}`)
        }
        const bundleReceipt = await flashbotsProvider.sendRawBundle(signedBundle, targetBlock)
        console.log(bundleReceipt)
    })
}

main();

//TODO - Fix nonce to high issue