const { merge } = require('sol-merger');
fs = require('fs');

// TODO figure out post merge init code hash variation problem - README.md
async function main() {
    // Get the merged code as a string
    const mergedCode0 = await merge("contracts/WETH.sol");
    const mergedCode1 = await merge("contracts/Gattaca1.sol");
    const mergedCode2 = await merge("contracts/Gattaca2.sol");
    const mergedCode3 = await merge("contracts/GattacaSwap.sol");
    const mergedCode4 = await merge("contracts/UniswapV2Factory.sol");
    const mergedCode5 = await merge("contracts/UniswapV2Router02.sol");
    fs.writeFileSync('deployment/flattened/WETH.sol', mergedCode0, function (err) {})
    fs.writeFileSync('deployment/flattened/Gattaca1.sol', mergedCode1, function (err) {})
    fs.writeFileSync('deployment/flattened/Gattaca2.sol', mergedCode2, function (err) {})
    fs.writeFileSync('deployment/flattened/GattacaSwap.sol', mergedCode3, function (err) {})
    fs.writeFileSync('deployment/flattened/UniswapV2Factory.sol', mergedCode4, function (err) {})
    fs.writeFileSync('deployment/flattened/UniswapV2Router.sol', mergedCode5, function (err) {})
    console.log("Merge complete")
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });