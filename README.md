## Flashbots via Uniswap
![Swap](swap.png)

### Quick start

Start a ganache goerli fork
```
npm install
source .env
npx ganache-cli \
--fork https://goerli.infura.io/v3/$INFURA_KEY \
--networkId 999
```
Run `3_swap_e2e.js` which deploys uniswap contracts, custom contracts, mints required tokens, approve necessary transfers, adds liquidity and perform trades on the custom uniswap-integrated swap contract `GattacaSwap`:

```shell script
truffle migrate -f 3 --to 3 --network goerlifork 
```
Once deployed, copy the output of the script into your `.env` file for the clients/flashbots to consume. You can inspect successful transactions via
```shell script
truffle debug <txhash> --network goerlifork
```

### Design
One way of dividing this project is the `client`, `server` and `deployment` segments.

#### Server
There are 5 key contracts to keep in mind.
- `GattacaSwap`: custom swapping contract we will interact with to perform custom swaps.
- `Gattaca1`: standard uniswap ERC20 token that can be minted and then swapped via uniswap
- `Gattaca2`: the other ERC20 token in the uniswap pair.
- `UniswapV2Factory`: master contract that we use to store swapping pairs. It has other uses to be explored in future.
- `UniswapV2Router`: controller contract that we add liquidity too. The contract `GattacaSwap` is 'integrated' or 'composed' with. 

These contracts are deployed on goerli and verified on etherscan 

- UniswapV2Factory: https://goerli.etherscan.io/address/0x714765FC755990ebeFFAF508d3B234ee70E2c80C#code
- UniswapV2Router: https://goerli.etherscan.io/address/0xc4929b7088583780E51A9C9495feEE3f828faaC4#code
- GattacaSwap: https://goerli.etherscan.io/address/0x5493F4b345c8efD6D3A9688Ac482624eb2A0c284#code

#### Client
JS
- `vanilla-swap.js`: swaps via standard web3js transaction
- `flashbot-swap.js`: swaps via flashbots js transaction

Python
- `flashbots/python/vanilla_swap.py`: swaps via standard web3py transaction 
- `flashbots/python/flashbot_swap.py`: swaps via flashbots web3py transaction

e.g https://goerli.etherscan.io/tx/0x475442f5f8772fa40b8edbbaf7ceed69b0601a0552b6b290001b8f1f19fbe6be

##Deployment
The `migration` scripts illustrate how these components are stitched together and deployed. Essentially they:
                                            
1. Deploy above contracts
2. Create pairs with factory.                    
2. Faucet tokens and grant approvals for token movement.          
4. Add liquidity for the token pair via Router.  
5. Perform a swap via swap contract.

After you have configured truffle config with your Goerli Infura or Alchemy URL, you can deploy the smart contracts to Goerli testnet and seed some data via the migration scripts.

```shell script
truffle migrate -f 3 --to 3 --network goerli
``` 
You can use the `2_deploy.js` script if you want to deploy contracts individually without transaction/contract calls. Follow the number pattern:
```shell script
truffle migrate -f 2 --to 2 --network goerli
```
The `merger.js` script will flatten and merge the contracts into single solidity files within the `deployment` directory, meaning all dependencies of a core contract are in the same file. This seems the best way to verify the code on etherscan although the flattening appears to affect the INIT_CODE_HASH required inside `UniswapV2Library` so I've attempted multi file uploads with everything in line in a single directory. The `InitHash.sol` contract calculates this hash and has a corresponding migration script `1_calculate_init_hash.js`.

For the Multi file aggregation for etherscan verification I used the the multisol npm package i.e
```shell script 
multisol contracts/Gattaca1.sol 
multisol contracts/Gattaca1.sol
multisol contracts/WETH.sol 
multisol contracts/UniswapV2Factory.sol 
multisol contracts/GattacaSwap.sol 
``` 
### Perform swap

run the script to perform the flash bot transaction
```shell script
node flashbot/javascript/flashbot-swap.js
```
- You will see 2 transactions bundled together. 
These are 3 calls to the `GattacaUniswap` contract calling the `swapMyTokens` function that interacts with the deployed Uniswap.
- Here is a etherscan transaction example: https://goerli.etherscan.io/tx/0xf63e38a3bc7dca9802cac392bac02b67462776893a4e6caddcbed8e968652c0e
- Here's what should see when the transactions are bundled and persisted successfully.  
```shell script
Simulation Success: {
  "bundleHash": "0x780e2443b2c558e3b6221a67239797b02fb6a3118ea6a090c934a816e99723af",
  "coinbaseDiff": {
    "type": "BigNumber",
    "hex": "0x019cd76ac429c8"
  },
  "results": [
    {
      "coinbaseDiff": "251999999853000",
      "ethSentToCoinbase": "0",
      "fromAddress": "0xFca86973ef1eE5C024bd341bb55eA28c4bF70026",
      "gasFees": "251999999853000",
      "gasPrice": "11999999993",
      "gasUsed": 21000,
      "toAddress": "0xFca86973ef1eE5C024bd341bb55eA28c4bF70026",
      "txHash": "0x144a145cfca6bec9dea7cf3f96e93a180e1ba89a79f5ed50bdad30ae53bbcb32",
      "value": "0x"
    },
    {
      "coinbaseDiff": "67308000000000",
      "ethSentToCoinbase": "0",
      "fromAddress": "0xFca86973ef1eE5C024bd341bb55eA28c4bF70026",
      "gasFees": "67308000000000",
      "gasPrice": "3000000000",
      "gasUsed": 22436,
      "toAddress": "0xFca86973ef1eE5C024bd341bb55eA28c4bF70026",
      "txHash": "0x3ebe5e36c33315c7f348b7b33dd5549264f77c2261ce62be088b8bcf43c1c154",
      "value": "0x"
    },
    {
      "coinbaseDiff": "67308000000000",
      "ethSentToCoinbase": "0",
      "fromAddress": "0xFca86973ef1eE5C024bd341bb55eA28c4bF70026",
      "gasFees": "67308000000000",
      "gasPrice": "3000000000",
      "gasUsed": 22436,
      "toAddress": "0xFca86973ef1eE5C024bd341bb55eA28c4bF70026",
      "txHash": "0x2378e91d254ac9eec4a3a5bed46d2bdc7681ea487a016a30150a9874faf680bf",
      "value": "0x"
    },
    {
      "coinbaseDiff": "67308000000000",
      "ethSentToCoinbase": "0",
      "fromAddress": "0xFca86973ef1eE5C024bd341bb55eA28c4bF70026",
      "gasFees": "67308000000000",
      "gasPrice": "3000000000",
      "gasUsed": 22436,
      "toAddress": "0xFca86973ef1eE5C024bd341bb55eA28c4bF70026",
      "txHash": "0xdfcaa5835f31c080ef6e570844d9a0a86a20aaeacb818a7b81dc45cb464b6992",
      "value": "0x"
    }
  ],
  "totalGasUsed": 88308
}
bundle submitted, waiting
Wait Response: BundleIncluded
```

### Dependencies
Python
```
python3 -m pip install python-dotenv
python3 -m pip install pathlib  
```


### TODO
- [] e2e programmatic integration tests for client through server (in-memory?). 
- [] calculate, deploy and test init-code-hash when files and merged and flattened.
- [] add gas estimation and calculation infra
- [] script to retrieve pairs from existing swaps/lists and offer.
- [] swap gui for above
- [] add assertions and do abi driven programming
- [] add uniswap exchange to deployment
- [] rebase into uniswap fork
- [] fix `bytes calldata data` compile warning
- [] local and programmatic etherscan contract verification
- [] composed contract unit tests and alternative integration methods.
- [] run flashbot relay infra locally and test e2e with ganache 
- [] expand use case beyond simple swap e.g arbitrage, exchanges, bots.
- [] classify error types, automate error handling

## Extra
A successful deployment should look like this. Once deployed you can copy the output into a `.env` file and run the scripts. If you are deploying to goerli, you'll need to add you info into the bottom part of the `.env` file
```shell script
Starting migrations...
======================
> Network name:    'goerli'
> Network id:      5
> Block gas limit: 29970705 (0x1c95111)


3_swap_e2e.js
=============

   Replacing 'UniswapV2Factory'
   ----------------------------
   > transaction hash:    0xa11d16a6230434bc6308aeecf8b327b4ba23a7ad611519c55210fc0d592ea842
   > Blocks: 1            Seconds: 16
   > contract address:    0x714765FC755990ebeFFAF508d3B234ee70E2c80C
   > block number:        5886338
   > block timestamp:     1637470651
   > account:             0x4f7011ad861125Bb7757665fbB63F1218b055Add
   > balance:             4.243647675960409336
   > gas used:            4129994 (0x3f04ca)
   > gas price:           20 gwei
   > value sent:          0 ETH
   > total cost:          0.08259988 ETH

Factory deployed with fee address 0x4f7011ad861125Bb7757665fbB63F1218b055Add
Account 1:  0x4f7011ad861125Bb7757665fbB63F1218b055Add
Account 2:  0xFca86973ef1eE5C024bd341bb55eA28c4bF70026

   Replacing 'Gattaca1'
   --------------------
   > transaction hash:    0x629c8111d07a7eee23d5f6146f12f1277df350de91afb4fb92a452c8f62657c2
   > Blocks: 1            Seconds: 12
   > contract address:    0x0116cA041E56c996Cd48A6C55E22f258ffD270DF
   > block number:        5886339
   > block timestamp:     1637470666
   > account:             0x4f7011ad861125Bb7757665fbB63F1218b055Add
   > balance:             4.222281815960409336
   > gas used:            1068293 (0x104d05)
   > gas price:           20 gwei
   > value sent:          0 ETH
   > total cost:          0.02136586 ETH


   Replacing 'Gattaca2'
   --------------------
   > transaction hash:    0xae798aa40cb2805f2fe138646479135228271b8129abd6c976927c5a1f3b2d49
   > Blocks: 0            Seconds: 8
   > contract address:    0x6887967A80B27ad56CC983681Cdf79290ef03E1B
   > block number:        5886340
   > block timestamp:     1637470681
   > account:             0x4f7011ad861125Bb7757665fbB63F1218b055Add
   > balance:             4.200915955960409336
   > gas used:            1068293 (0x104d05)
   > gas price:           20 gwei
   > value sent:          0 ETH
   > total cost:          0.02136586 ETH


   Replacing 'WETH'
   ----------------
   > transaction hash:    0x0c12255a40e180459710f80bf27820464a2c0acc226ad1cbef30e7ac8a78537a
   > Blocks: 1            Seconds: 12
   > contract address:    0x1b6C04e5d8c395940872a649fe88c2624e49Bb01
   > block number:        5886346
   > block timestamp:     1637470771
   > account:             0x4f7011ad861125Bb7757665fbB63F1218b055Add
   > balance:             4.179721955960409336
   > gas used:            888792 (0xd8fd8)
   > gas price:           20 gwei
   > value sent:          0 ETH
   > total cost:          0.01777584 ETH

Swap Pair created

   Replacing 'UniswapV2Router02'
   -----------------------------
   > transaction hash:    0xc301339cd3b5ce6daa7213d5deca5628d8f5b376c6e8a7d455cac7a135150900
   > Blocks: 0            Seconds: 9
   > contract address:    0xc4929b7088583780E51A9C9495feEE3f828faaC4
   > block number:        5886348
   > block timestamp:     1637470801
   > account:             0x4f7011ad861125Bb7757665fbB63F1218b055Add
   > balance:             4.028076255960409336
   > gas used:            4369972 (0x42ae34)
   > gas price:           20 gwei
   > value sent:          0 ETH
   > total cost:          0.08739944 ETH

Router deployed
Transactions approved!
Adding liquidity
Deploying GattacaSwap and Performing Approvals

   Replacing 'GattacaSwap'
   -----------------------
   > transaction hash:    0xb8a83de0dc793f6358b08cfccde509b58d8cef870ffa30799a027119894880ac
   > Blocks: 1            Seconds: 12
   > contract address:    0x5493F4b345c8efD6D3A9688Ac482624eb2A0c284
   > block number:        5886355
   > block timestamp:     1637470906
   > account:             0x4f7011ad861125Bb7757665fbB63F1218b055Add
   > balance:             4.011830615960409336
   > gas used:            392187 (0x5fbfb)
   > gas price:           20 gwei
   > value sent:          0 ETH
   > total cost:          0.00784374 ETH

Performing Gattaca Swaps
Forward swap completed
Backward swap completed
Direct swaps completed
Gattaca1 address: 0x0116cA041E56c996Cd48A6C55E22f258ffD270DF
Gattaca2 address: 0x6887967A80B27ad56CC983681Cdf79290ef03E1B
WETH address:  0x1b6C04e5d8c395940872a649fe88c2624e49Bb01
Uniswap Factory address:  0x714765FC755990ebeFFAF508d3B234ee70E2c80C
Uniswap Router Address: 0xc4929b7088583780E51A9C9495feEE3f828faaC4
Gattaca Swap address:  0x5493F4b345c8efD6D3A9688Ac482624eb2A0c284
Copy the formatted addresses into your .env file so your clients can consume them
----------------------------------------------------------
TOKEN1= 0x0116cA041E56c996Cd48A6C55E22f258ffD270DF
TOKEN2= 0x6887967A80B27ad56CC983681Cdf79290ef03E1B
WETH= 0x1b6C04e5d8c395940872a649fe88c2624e49Bb01
FACTORY= 0x714765FC755990ebeFFAF508d3B234ee70E2c80C
ROUTER= 0xc4929b7088583780E51A9C9495feEE3f828faaC4
SWAP_CONTRACT= 0x5493F4b345c8efD6D3A9688Ac482624eb2A0c284
----------------------------------------------------------
   > Saving artifacts
   -------------------------------------
   > Total cost:          0.23835062 ETH


Summary
=======
> Total deployments:   6
> Final cost:          0.23835062 ETH
```
