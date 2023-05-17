const { network } = require("hardhat");
const { verify } = require("../utils/verify");
const { developmentChains } = require("../helper-hardhat-config");

module.exports = async ({ deployments, getNamedAccounts }) => {
  const { deploy, log } = await deployments;
  const { deployer } = await getNamedAccounts();

  log("------------------------------");

  const args = [];
  const nftMarketplace = await deploy("NftMarketplace", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmation || 1,
  });

  log("--------------Deploying NftMarketplace---------------");

  // verify the deployment
  if (
    !developmentChains.includes(network.name) &&
    process.env.POLYGONSCAN_API_KEY
  ) {
    log("Verifying...");
    await verify(nftMarketplace.address, args);
  }
  log("--------------Verified NftMarketplace---------------");
};
module.exports.tags = ["all", "nftmarketplace"];
