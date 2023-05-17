// const { ethers } = require("hardhat")

const networkConfig = {
    80001: {
      name: "mumbai",
      vrfCoordinatorV2: "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed",
      mintFee: ethers.utils.parseEther("0.01"),
      gasLane:
        "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f",
      subscriptionId: "3683",
      callbackGasLimit: "500000", // 500,000
      interval: "30",
      ethUsdPriceFeed: "0x0715A7794a1dc8e42615F059dD6e406A6594651A",
    },
    31337: {
      name: "hardhat",
      mintFee: ethers.utils.parseEther("0.01"),
      gasLane:
        "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
      callbackGasLimit: "500000",
      interval: "30",
    },
  };
  
  const developmentChains = ["hardhat", "localhost"];
  
  module.exports = {
    networkConfig,
    developmentChains,
  };
  