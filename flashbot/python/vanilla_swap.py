from web3 import Web3
import os
import json
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())
account_1 = os.getenv('META_MASK_ACCOUNT_1')
account_2 = os.getenv('META_MASK_ACCOUNT_2')
token_1 = os.getenv('TOKEN1')
token_2 = os.getenv('TOKEN2')
router = os.getenv('ROUTER')
swapAddress = os.getenv('SWAP_CONTRACT')
recipientAddress = os.getenv('RECIPIENT')
sender_key = os.getenv('SENDER_KEY')
infuraKey = os.getenv('INFURA_KEY')

infura_url = ('https://goerli.infura.io/v3/'+ infuraKey +'')
web3 = Web3(Web3.HTTPProvider(infura_url))

nonce = web3.eth.getTransactionCount(account_1)
balance = web3.eth.getBalance(account_1)

print(balance)

# Encode swapMyTokens function call ABI
abi = json.loads('[{"inputs":[{"internalType":"address","name":"_uniswap_factory_address","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"constant":true,"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_tokenIn","type":"address"},{"internalType":"address","name":"_tokenOut","type":"address"},{"internalType":"address","name":"_router","type":"address"},{"internalType":"uint256","name":"_amountIn","type":"uint256"},{"internalType":"uint256","name":"_amountOutMin","type":"uint256"}],"name":"swapMyTokens","outputs":[],"payable":true,"stateMutability":"payable","type":"function"}]')
swapContract = web3.eth.contract(address=swapAddress, abi=abi)
encodedTxn = swapContract.encodeABI(fn_name='swapMyTokens', args=[
    token_1, token_2, router, 10, 0])
encoded_bytes_data = Web3.toBytes(hexstr=encodedTxn)
print('Swap ABI Encoded')

tx1 = {
    'to': swapAddress,
    'value': web3.toWei(0.03, 'ether'),
    'nonce': nonce,
    'gas': 2000000,
    'gasPrice': web3.toWei('1', 'gwei'),
    "data": encoded_bytes_data,
}

signed_tx = web3.eth.account.signTransaction(tx1, sender_key)

tx_hash = web3.eth.sendRawTransaction(signed_tx.rawTransaction)

print(web3.toHex(tx_hash))

# Example txn on Goerli: 0xe5b8e605464747e0e15cdd56967f9fc12f5b00063305ff66d7e89cea22f1bbf3
