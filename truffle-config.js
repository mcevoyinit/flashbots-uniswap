require('babel-register');
require('babel-polyfill');
var HDWalletProvider = require("@truffle/hdwallet-provider");

module.exports = {
  networks: {
    goerlifork: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "5",
      gas: 5712388,
      gasPrice: 2000000000
    },
    goerli: {
      provider: () => {
        return new HDWalletProvider('way balance hurry extend upon erosion typical apology boil urban junior rain', 'https://goerli.infura.io/v3/d1586c8c345647b2b4bb55bb66c738f9')
      },
      network_id: '5',
      gas: 5712388,
      gasPrice: 20000000000
    },
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "999" // Match any network id
    },
  },
  contracts_directory: './contracts/',
  contracts_build_directory: './contracts/artifacts/',
  compilers: {
    solc: {
      version: "0.5.16",
      optimizer: {
        enabled: true,
        runs: 200
      },
      evmVersion: "petersburg"
    }
  }
}