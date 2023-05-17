const { network } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = await deployments;
  const { deployer } = await getNamedAccounts();

  const args = [];

  const basicNft = await deploy("BasicNft", {
    from: deployer,
    log: true,
    args: args,
    waitConfirmation: network.config.blockConfirmation || 1,
  });

  log("--------------Deploying BaicNft-------------------");

  if (
    !developmentChains.includes(network.name) &&
    process.env.POLYGONSCAN_API_KEY
  ) {
    await verify(basicNft.address, args);
  }
  log("--------------Verified BaicNft-------------------");
};
module.exports.tags = ["all", "basicNft", "main"];
