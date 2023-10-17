var { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
var { expect } = require("chai");
var { ethers } = require("hardhat");

const pUnits = hre.ethers.parseUnits;

// 00 horas del 30 de septiembre del 2023 GMT
const startDate = 1696032000;
const ONE_DAY = 60 * 60 * 24;

describe(
  "Testing the 'purchaseWithUSDC' method\
  in the PublicSale contract on a forked Goerli node",
  function () {

    var usdcTkContract, bbitesTknContract, pubSContract;
    var owner, alice, bob, carl, deysi, estefan;

    async function decreaseBlockTimestamp(timestamp) {
      const blockNumber = await ethers.provider.getBlockNumber();
      const currentBlock = await ethers.provider.getBlock(blockNumber);
      const timeDifference = currentBlock.timestamp - timestamp;

      await ethers.provider.send("evm_increaseTime", [-timeDifference]);
      await ethers.provider.send("evm_mine");
    }

    before(async () => {
      [owner, alice, bob, carl, deysi, estefan] = await ethers.getSigners();

      var bbitesTknAdd = "0x0157fa3e2C2D186b761eEd4871CB2440faCB9DB2";
      var BbitesTknContract = await ethers.getContractFactory("BBITESToken");
      bbitesTknContract = BbitesTknContract.attach(bbitesTknAdd);

      var usdcAdd = "0xeB5093BB51C195D942c4E13d78CC80ffb471357B";
      var UsdcTkContract = await ethers.getContractFactory("USDCoin");
      usdcTkContract = UsdcTkContract.attach(usdcAdd);

      var pubSAdd = "0xEC9DFBcbe0c17032eF9286b58881248f7ba8A5F4";
      var PubSContract = await ethers.getContractFactory("PublicSale");
      pubSContract = PubSContract.attach(pubSAdd);

      // Aapprove permissions to spend tokens
      const accounts = [alice, bob];

      for (let i = 0; i < accounts.length; i++) {
        const account = accounts[i];
        const approveValue = pUnits("200000", 6);

        await usdcTkContract
          .connect(account)
          .approve(pubSAdd, approveValue);
      }

      // Impersonate USDC contract owner
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: ["0x8381Ba2bBf4EAF05363FA2faff16dAe094CA0B95"],
      });

      const usdcOwner = await ethers.getSigner("0x8381Ba2bBf4EAF05363FA2faff16dAe094CA0B95");

      // mint tokens to tester
      await usdcTkContract
        .connect(usdcOwner)
      .mint(alice.address, pUnits("200000", 6));

      await hre.network.provider.request({
        method: "hardhat_stopImpersonatingAccount",
        params: ["0x8381Ba2bBf4EAF05363FA2faff16dAe094CA0B95"],
      });
    });

    it("Verify if an account has enough balance to execute purchaseWithUSDC", async () => {
      const purchaseWithUSDC = pubSContract.connect(bob).purchaseWithUSDC;
      const tokenId = 150;
      const amountIn = pUnits("2000", 6) 

      await expect(
        purchaseWithUSDC(tokenId, amountIn)
      ).to.revertedWith(
        "ERC20: transfer amount exceeds balance"
      );
    });

    it("purchaseWithUSDC swaps USDC for BBites, receives tokens and assigns Nft id", async () => {
      const tokenIds = [150, 300, 500, 600]
      const daysElpased = [10, 20, 30, 100]
      const prices = [1000, tokenIds[1]*20, 10000 + daysElpased[2]*2000, 90000];
      const amountsIn = [1000, tokenIds[1]*20, 10000 + daysElpased[2]*2000, 90000];

      for (let i = 0; i < amountsIn.length; i++) {
        await decreaseBlockTimestamp(startDate + daysElpased[i] * ONE_DAY);

        const tx = await pubSContract
          .connect(alice)
          .purchaseWithUSDC(tokenIds[i], pUnits(amountsIn[i].toString(), 6));

        // Check Bbites token balances
        expect(
          tx
        ).to.changeTokenBalances(
          bbitesTknContract,
          [alice.address, pubSContract.getAddress()], [-prices[i], prices[i]]);

        // Check PurchaseNftWithId event and arguments
        expect(tx)
          .to.emit(pubSContract, "PurchaseNftWithId")
          .withArgs(alice.address, tokenIds[i]);

        // Check owner of the NFT
        const nftOwner = await pubSContract.ownerOf(tokenIds[i]);
        expect(
          nftOwner
        ).to.equal(alice.address);
      }
    });
});

/**
 * Testing
 * 
 * PublicSale contract 
 * 1. Verify if an account has enough balance to execute purchaseWithUSDC
 * 2. purchaseWithUSDC swaps USDC for BBites, receives tokens and assigns Nft id
 */