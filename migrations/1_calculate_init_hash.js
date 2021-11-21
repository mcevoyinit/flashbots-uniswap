const InitHash = artifacts.require('InitHash.sol');

module.exports = async function (deployer, _network, addresses) {
  await deployer.deploy(InitHash);
  const initHash = await InitHash.deployed();
  const hash = await initHash.getInitHash();
  console.log("Init Code Hash: "+hash)
};