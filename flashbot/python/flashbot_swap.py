from eth_account.signers.local import LocalAccount
from web3.middleware import construct_sign_and_send_raw_middleware
from flashbots import flashbot
from flashbots import FlashbotProvider
from flashbots.types import SignTx
from eth_account import Account
from web3 import Web3, HTTPProvider, exceptions
from dotenv import load_dotenv, find_dotenv
import os
import requests
import math
import json

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

# signifies your identify to the flashbots network
ETH_ACCOUNT: LocalAccount = Account.from_key(sender_key)

print("Connecting to RPC")
url = "https://goerli.infura.io/v3/d1586c8c345647b2b4bb55bb66c738f9"
w3 = Web3(HTTPProvider(url))

authSigner: LocalAccount = Account.from_key((
    '0x2000000000000000000000000000000000000000000000000000000000000000'
))
w3.middleware_onion.add(construct_sign_and_send_raw_middleware(ETH_ACCOUNT))

flashbotsProvider = FlashbotProvider(
    w3,
    authSigner,
    'https://relay-goerli.flashbots.net/',
)

flashbot(
    w3, #this doesn't allow flashbotProvider
    ETH_ACCOUNT
)

print('Flashbot connected to goerli relay')


def get_gas_price():
    gas_api = "https://ethgasstation.info/json/ethgasAPI.json"
    response = requests.get(gas_api).json()

    gas_multiplier = 3
    gas_price_gwei = math.floor(response["fastest"] / 10 * gas_multiplier)
    gas_price = w3.toWei(gas_price_gwei, "gwei")
    return gas_price


# Encode swapMyTokens function call ABI
abi = json.loads('[{"inputs":[{"internalType":"address","name":"_uniswap_factory_address","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"constant":true,"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_tokenIn","type":"address"},{"internalType":"address","name":"_tokenOut","type":"address"},{"internalType":"address","name":"_router","type":"address"},{"internalType":"uint256","name":"_amountIn","type":"uint256"},{"internalType":"uint256","name":"_amountOutMin","type":"uint256"}],"name":"swapMyTokens","outputs":[],"payable":true,"stateMutability":"payable","type":"function"}]')
swapContract = w3.eth.contract(address=swapAddress, abi=abi)
encoded1 = swapContract.encodeABI(fn_name='swapMyTokens', args=[
                                  token_1, token_2, router, 10, 0])
encoded2 = swapContract.encodeABI(fn_name='swapMyTokens', args=[
                                  token_2, token_1, router, 10, 0])  # reveresed
encoded_bytes_data1 = Web3.toBytes(hexstr=encoded1)
encoded_bytes_data2 = Web3.toBytes(hexstr=encoded2)
print('Swap ABI Encoded')

# create a transaction
nonce = w3.eth.getTransactionCount(ETH_ACCOUNT.address) 
bribe = 10000000 #web3.toWei("0.01", "ether")
signed_tx: SignTx = {
    "to": ETH_ACCOUNT.address,
    "value": bribe,
    "nonce": nonce + 1,
    "gasPrice": 0,
    "gas": 25000,
}

signed_transaction1 = ETH_ACCOUNT.sign_transaction(signed_tx)

bundle = [
    {
        "signer": ETH_ACCOUNT,
        "transaction": {
            "from": ETH_ACCOUNT.address,
            "to": swapAddress,
            "value": w3.toWei("1.0", "gwei"),
            "nonce": nonce + 1,
            "gas": 100000,
            "gasPrice": get_gas_price(),
            "data": encoded_bytes_data1,
        },
    },
    {
        "signer": ETH_ACCOUNT,
        "transaction": {
            "from": ETH_ACCOUNT.address,
            "to": swapAddress,
            "value": w3.toWei("1.0", "gwei"),
            "nonce": nonce + 1,
            "gas": 100000,
            "gasPrice": get_gas_price(),
            "data": encoded_bytes_data2,
        },
    },
    # bribe
    {
        "signed_transaction": signed_transaction1.rawTransaction
    }
]

blockNumber = w3.eth.blockNumber + 3;
n = 10
for i in range(n):
    result = w3.flashbots.send_bundle(bundle, target_block_number=blockNumber + 3) #TODO incompatable API
    #result = flashbotsProvider.make_request(w3, bundle)
    #flashbotsProvider.sendRawBundle(bundle,blockNumber + i);

print(f"bundle broadcasted at block {blockNumber}")

# wait for the transaction to get mined
while True:
    try:
        w3.eth.waitForTransactionReceipt(
            signed_transaction1.hash, timeout=1, poll_latency=0.1)
        break

    except exceptions.TimeExhausted:
        if w3.eth.blockNumber >= (blockNumber + 3):
            print("ERROR: transaction was not mined")
            exit(1)

print(f"transaction confirmed at block {w3.eth.block_number}")
