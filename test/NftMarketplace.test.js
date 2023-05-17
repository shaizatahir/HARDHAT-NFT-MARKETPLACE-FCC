const { assert, expect } = require("chai");
const { developmentChains } = require("../helper-hardhat-config");
const { ethers, network, deployments } = require("hardhat");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Nft Marketplace unit test", () => {
      let deployer,
        user,
        nftMarketplaceContract,
        nftMarketplace,
        basicNftContract,
        basicNft;
      const PRICE = ethers.utils.parseEther("0.1");
      const TOKEN_ID = 0;
      beforeEach(async () => {
        accounts = await ethers.getSigners(); // could also do with getNamedAccounts
        deployer = accounts[0];
        user = accounts[1];
        await deployments.fixture(["all"]);
        nftMarketplaceContract = await ethers.getContract("NftMarketplace");
        nftMarketplace = nftMarketplaceContract.connect(deployer);
        basicNftContract = await ethers.getContract("BasicNft");
        basicNft = basicNftContract.connect(deployer);
        await basicNft.mint();
        await basicNft.approve(nftMarketplaceContract.address, TOKEN_ID);
      });

      describe("Listitem", () => {
        it("emits an event after listing an item", async () => {
          expect(
            nftMarketplaceContract.listItem(basicNft.address, TOKEN_ID, PRICE)
          ).to.emit("ItemListed");
        });
        it("reverts when price less than zero", async () => {
          expect(
            nftMarketplaceContract.listItem(basicNft.address, TOKEN_ID, 0)
          ).to.be.revertedWith("NftMarketplace__PriceMustBeAboveZero");
        });
        it("exclusively items that haven't been listed", async () => {
          await nftMarketplaceContract.listItem(
            basicNft.address,
            TOKEN_ID,
            PRICE
          );
          await expect(
            nftMarketplaceContract.listItem(basicNft.address, TOKEN_ID, PRICE)
          ).to.be.revertedWith("NftMarketplace__AlreadyListed");
        });
        it("exclusively allows owners to list", async () => {
          nftMarketplace = nftMarketplaceContract.connect(user);
          await basicNft.approve(user.address, TOKEN_ID);
          await expect(
            nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          ).to.be.revertedWith("NftMarketplace__NotOwner");
        });
        it("needs approvals to list item", async () => {
          await basicNft.approve(ethers.constants.AddressZero, TOKEN_ID);
          expect(
            nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          ).to.be.revertedWith("NftMarketplace__NotApprovedForMarketplace");
        });
        it("Updates listing with seller and price", async () => {
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
          const listing = await nftMarketplace.getListing(
            basicNft.address,
            TOKEN_ID
          );
          assert(listing.price.toString() == PRICE.toString());
          assert(listing.seller == deployer.address);
        });
        it("reverts if the price be 0", async () => {
          const ZERO_PRICE = ethers.utils.parseEther("0");
          await expect(
            nftMarketplace.listItem(basicNft.address, TOKEN_ID, ZERO_PRICE)
          ).to.be.revertedWith("NftMarketplace__PriceMustBeAboveZero");
        });
      });

      describe("cancelling", () => {
        it("reverts if there is no listing", async () => {
          await expect(
            nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
          ).to.be.revertedWith("NftMarketplace__NotListed");
        });
        it("reverts if anyone but the owner tries to call", async () => {
          nftMarketplace = await nftMarketplaceContract.connect(user);
          await basicNft.approve(user.address, TOKEN_ID);
          await expect(
            nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
          ).to.be.revertedWith("NftMarketplace__NotOwner");
        });
        it("emits event and removes listing", async () => {
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
          expect(
            await nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
          ).to.emit("ItemCanceled");

          const listing = await nftMarketplace.getListing(
            basicNft.address,
            TOKEN_ID
          );
          assert.equal(listing.price.toString(), "0");
        });
      });
      describe("buyItem", () => {
        it("reverts if item isnt listed", async () => {
          await expect(
            nftMarketplace.buyItem(basicNft.address, TOKEN_ID)
          ).to.be.revertedWith("NftMarketplace__NotListed");
        });
        it("reverts if the price isnt met", async () => {
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
          expect(
            nftMarketplace.buyItem(basicNft.address, TOKEN_ID)
          ).to.be.revertedWith("NftMarketplace__PriceNotMet");
        });
        it("transfers the nft to the buyer and updates internal proceeds record", async () => {
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
          nftMarketplace = nftMarketplaceContract.connect(user);
          expect(
            nftMarketplace.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
          ).to.emit("ItemBought");
          const newOwner = await basicNft.ownerOf(TOKEN_ID);
          assert(newOwner.toString() == user.address);
          const deployerProceeds = await nftMarketplace.getProceeds(
            deployer.address
          );
          assert(deployerProceeds.toString() == PRICE.toString());
        });
      });
      describe("updateListing", () => {
        it("must be owner and listed", async () => {
          await expect(
            nftMarketplace.updateListing(basicNft.address, TOKEN_ID, PRICE)
          ).to.be.revertedWith("NftMarketplace__NotListed");
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
          nftMarketplace = nftMarketplaceContract.connect(user);
          await expect(
            nftMarketplace.updateListing(basicNft.address, TOKEN_ID, PRICE)
          ).to.be.revertedWith("NftMarketplace__NotOwner");
        });
        it("reverts if new price is 0", async () => {
          const newPrice = ethers.utils.parseEther("0");
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
          await expect(
            nftMarketplace.updateListing(basicNft.address, TOKEN_ID, newPrice)
          ).to.be.revertedWith("NftMarketplace__PriceMustBeAboveZero");
        });
        it("updates the price of the item", async () => {
          const updatedPrice = ethers.utils.parseEther("0.2");
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
          await expect(
            nftMarketplace.updateListing(
              basicNft.address,
              TOKEN_ID,
              updatedPrice
            )
          ).to.emit("ItemListed");
          const listing = await nftMarketplace.getListing(
            basicNft.address,
            TOKEN_ID
          );
          assert(listing.price.toString() == updatedPrice.toString());
        });
      });
      describe("withdrawProceeds", () => {
        it("doesn't allow 0 proceed withdrawls", async function () {
          await expect(nftMarketplace.withdrawProceeds()).to.be.revertedWith(
            "NftMarketplace__NoProceeds"
          );
          it("withdraws proceeds", async function () {
            await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
            nftMarketplace = nftMarketplaceContract.connect(user);
            await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
              value: PRICE,
            });
            nftMarketplace = nftMarketplaceContract.connect(deployer);

            const deployerProceedsBefore = await nftMarketplace.getProceeds(
              deployer.address
            );
            const deployerBalanceBefore = await deployer.getBalance();
            const txResponse = await nftMarketplace.withdrawProceeds();
            const transactionReceipt = await txResponse.wait(1);
            const { gasUsed, effectiveGasPrice } = transactionReceipt;
            const gasCost = gasUsed.mul(effectiveGasPrice);
            const deployerBalanceAfter = await deployer.getBalance();

            assert(
              deployerBalanceAfter.add(gasCost).toString() ==
                deployerProceedsBefore.add(deployerBalanceBefore).toString()
            );
          });
        });
      });
    });
