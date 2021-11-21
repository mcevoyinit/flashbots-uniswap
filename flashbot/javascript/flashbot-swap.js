const { BigNumber, providers, ethers } = require('ethers');
const { FlashbotsBundleProvider, FlashbotsBundleResolution} = require('@flashbots/ethers-provider-bundle')
require('dotenv').config({ path: `${__dirname}/../../.env` });

const GWEI = BigNumber.from(10).pow(9)
const PRIORITY_FEE = GWEI.mul(3)
const LEGACY_GAS_PRICE = GWEI.mul(120)
const BLOCKS_IN_THE_FUTURE = 5

const addresses = {
    TOKEN1 : process.env.TOKEN1,
    TOKEN2 : process.env.TOKEN2,
    WETH: process.env.WETH,
    factory: process.env.FACTORY,
    router: process.env.ROUTER,
    swap: process.env.SWAP_CONTRACT,
    recipient: process.env.RECIPIENT
}
const keys = {
    sender: process.env.SENDER_KEY,
    flashbots_relay: process.env.FLASHBOTS_KEY,
    infura_key: process.env.INFURA_KEY
}

const provider = new providers.InfuraProvider(5, keys.infura_key)
const FLASHBOTS_EP = 'https://relay-goerli.flashbots.net/'

async function main() {
  const authSigner = new ethers.Wallet.createRandom()
  const wallet = new ethers.Wallet(keys.sender, provider)
  const flashbotsProvider = await FlashbotsBundleProvider.create(provider, authSigner, FLASHBOTS_EP)

  const transaction = {
    to: wallet.address,
    gasPrice: LEGACY_GAS_PRICE,
    gasLimit: 500000,
    data: '0x'
  }

  provider.on('block', async (blockNumber) => {
    const block = await provider.getBlock(blockNumber)
    let ABI = [
        "function swapMyTokens(address _tokenIn,address _tokenOut, address _router, uint _amountIn, uint _amountOutMin) external payable"
    ];

      let interface = new ethers.utils.Interface(ABI);
      const data = interface.encodeFunctionData("swapMyTokens", [
        addresses.TOKEN1,
        addresses.TOKEN2,
        addresses.router,
        10,
        0
      ]);

    let eip1559Transaction
    if (block.baseFeePerGas == null) {
      console.warn('This chain is not EIP-1559 enabled, defaulting to two legacy transactions for demo')
      eip1559Transaction = { ...legacyTransaction }
      // We set a nonce in transaction above to limit validity to a single landed bundle. Delete that nonce for tx#2, and allow bundle provider to calculate it
      delete eip1559Transaction.nonce
    } else {
      const maxBaseFeeInFutureBlock = FlashbotsBundleProvider.getMaxBaseFeeInFutureBlock(block.baseFeePerGas, BLOCKS_IN_THE_FUTURE)
      eip1559Transaction = {
        to: addresses.swap,
        type: 2,
        maxFeePerGas: PRIORITY_FEE.add(maxBaseFeeInFutureBlock),
        maxPriorityFeePerGas: PRIORITY_FEE,
        gasLimit: 1000000,
        data: data,
        chainId: 5
      }
    }

    const signedTransactions = await flashbotsProvider.signBundle([
      {
        signer: wallet,
        transaction: transaction
      },
      {
        signer: wallet,
        transaction: eip1559Transaction
      },
      {
        signer: wallet,
        transaction: eip1559Transaction
      },
      {
        signer: wallet,
        transaction: eip1559Transaction
      }
    ])
    const targetBlock = blockNumber + BLOCKS_IN_THE_FUTURE
    const simulation = await flashbotsProvider.simulate(signedTransactions, targetBlock)
    if ('error' in simulation) {
      console.warn(`Simulation Error: ${simulation.error.message}`)
      process.exit(1)
    } else {
      console.log(`Simulation Success: ${JSON.stringify(simulation, null, 2)}`)
    }
    const bundleSubmission = await flashbotsProvider.sendRawBundle(signedTransactions, targetBlock)
    console.log('bundle submitted, waiting')
    if ('error' in bundleSubmission) {
      throw new Error(bundleSubmission.error.message)
    }
    const waitResponse = await bundleSubmission.wait()
    console.log(`Wait Response: ${FlashbotsBundleResolution[waitResponse]}`)
    if (waitResponse === FlashbotsBundleResolution.BundleIncluded || waitResponse === FlashbotsBundleResolution.AccountNonceTooHigh) {
      process.exit(0)
    } else {
      console.log({
        bundleStats: await flashbotsProvider.getBundleStats(simulation.bundleHash, targetBlock),
        userStats: await flashbotsProvider.getUserStats()
      })
    }
  })
}

main();