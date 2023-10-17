var { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
var { expect } = require("chai");
var { ethers } = require("hardhat");
var { time } = require("@nomicfoundation/hardhat-network-helpers");

const keccak256 = require("keccak256");
const { MerkleTree } = require("merkletreejs");

const { 
  getRole, 
  deploySC, 
  deploySCNoUp, 
  ex, 
  pEth,
} = require("../utils");

const pUnits = hre.ethers.parseUnits;

const MINTER_ROLE = getRole("MINTER_ROLE");
const BURNER_ROLE = getRole("BURNER_ROLE");

// 00 horas del 30 de septiembre del 2023 GMT
const startDate = 1696032000;
const ONE_DAY = 60 * 60 * 24;

describe("Testing", function () {
  var usdcTkContract, bbitesTknContract, pubSContract, nftContract;
  var owner, alice, bob, carl, deysi, estefan, relAddMumbai, relAddGoerli;
  var merkleTree, root, proofs;

  async function deployMumbai() {
    // CuyCollectionNft contract
    nftContract = await deploySC("CuyCollectionNft");
    
    // set up mint role
    await ex(
      nftContract,
      "grantRole",
      [MINTER_ROLE, relAddMumbai.address],
      "Failed to grant role"
    );

    await ex(
      nftContract,
      "setRoot",
      [root],
      "Failed to set root"
    );
  }

  async function deployGoerli() {
    // USDC contract
    usdcTkContract = await deploySCNoUp("USDCoin")
  
    // BBbitesToken contract
    bbitesTknContract = await deploySC("BBITESToken")
  
    await ex(
      bbitesTknContract,
      "grantRole",
      [MINTER_ROLE, relAddGoerli.address],
      "Failed to grant role"
    );
  }
  
  async function deployGoerliPS() {
    pubSContract = await deploySC(
      "PublicSale", 
      [
        await bbitesTknContract.getAddress(),
        await usdcTkContract.getAddress(),
      ]
    )
  }

  function hashToken(tokenId, account) {
    return Buffer.from(
      ethers
        .solidityPackedKeccak256(["uint256", "address"], [tokenId, account])
        .slice(2),
      "hex"
    );
  }

  before(async () => {
    [owner, alice, bob, carl, deysi, estefan, relAddMumbai, relAddGoerli] = await ethers.getSigners();

    // Build Merkle Tree
    const merkleTreeList = [
      hashToken(1000, alice.address),
      hashToken(1001, bob.address),
      hashToken(1002, carl.address),
      hashToken(1003, deysi.address),
      hashToken(1004, estefan.address),
    ];
    
    merkleTree = new MerkleTree(merkleTreeList, keccak256, {
      sortPairs: true,
    });
    
    root = merkleTree.getHexRoot();

    proofs = merkleTree.getHexProof(merkleTreeList[0]);
  });

  describe("CuyCollectionNft contract", () => {
    before(async () => {
      await deployMumbai();
    });

    it("safeMint method protected by MINTER_ROLE", async () => {
      const safeMint = nftContract.connect(alice).safeMint;
      await expect(
        safeMint(alice.address, 0)
      ).to.revertedWith(
        `AccessControl: account ${alice.address.toLowerCase()} is missing role ${MINTER_ROLE}`
      );
    });

    it("safeMintWhiteList method is protected by white list", async () => {
      const safeMintWhiteList = nftContract.connect(bob).safeMintWhiteList;
      const tokenId = 1000;

      await expect(
        safeMintWhiteList(bob.address, tokenId, proofs)
      ).to.revertedWith(`Not authorized to mint token.`);
    });
    
    it("safeMintWhiteList mints an NFT to its respective address in white list", async () => {
      const safeMintWhiteList = nftContract.connect(alice).safeMintWhiteList;
      const tokenId = 1000;

      await safeMintWhiteList(alice.address, tokenId, proofs);

      const nftOwnerOf = await nftContract.ownerOf(tokenId);
      expect(
        nftOwnerOf
      ).to.equal(alice.address);
    });

    it("BuyBack method is only executed by NFT owner", async () => {
      const buyBack = nftContract.connect(bob).buyBack;
      const tokenId = 1000;

      await expect(
        buyBack(tokenId)
      ).to.revertedWith("Not token owner or approved");
    });

    it("BuyBack method removes token ownership", async () => {
      const buyBack = nftContract.connect(alice).buyBack;
      const tokenId = 1000;

      await buyBack(tokenId);

      const nftOwnerOf = nftContract.ownerOf(tokenId);
      await expect(
        nftOwnerOf
      ).to.revertedWith("ERC721: invalid token ID");
    });
  });

  describe("PublicSale contract", () => {
    async function decreaseBlockTimestamp(timestamp) {
      const blockNumber = await ethers.provider.getBlockNumber();
      const currentBlock = await ethers.provider.getBlock(blockNumber);
      const timeDifference = currentBlock.timestamp - timestamp;

      await ethers.provider.send("evm_increaseTime", [-timeDifference]);
      await ethers.provider.send("evm_mine");
    }

    before(async () => {
      await deployGoerli();
      await deployGoerliPS();

      // approve permissions to spend tokens
      const contracts = [usdcTkContract, bbitesTknContract];
      const contractDecimals = [6, 18];
      const accounts = [alice, bob];

      for (let i = 0; i < contracts.length; i++) {
        for (let j = 0; j < accounts.length; j++) {
          const contract = contracts[i];
          const account = accounts[j];
          const approveValue = pUnits("200000", contractDecimals[i]);

          await contract
            .connect(account)
            .approve(pubSContract.getAddress(), approveValue);
        }
      };
  
      // mint tokens to tester
      await bbitesTknContract
        .connect(owner)
        .mint(alice.address, pUnits("200000", 18));
    });

    it("Verify if an account has enough balance to execute purchaseWithTokens", async () => {
      const purchaseWithTokens = pubSContract.connect(bob).purchaseWithTokens;
      const tokenId = 0;

      await expect(
        purchaseWithTokens(tokenId)
      ).to.revertedWith(
        "ERC20: transfer amount exceeds balance"
      );
    });

    it("purchaseWithTokens receives BBites tokens and assigns Nft id", async () => {
      const tokenIds = [10, 200, 500, 600]
      const daysElpased = [10, 20, 30, 100]
      const prices = [1000, tokenIds[1]*20, 10000 + daysElpased[2]*2000, 90000];

      for (let i = 0; i < prices.length; i++) {
        await decreaseBlockTimestamp(startDate + daysElpased[i] * ONE_DAY);
        
        const purchaseWithTokens = pubSContract.connect(alice).purchaseWithTokens;
        const tx = await purchaseWithTokens(tokenIds[i]);
        const res = await tx.wait();

        // Check Bbites token balances
        expect(
          tx
        ).to.changeTokenBalances(
          bbitesTknContract,
          [alice.address, pubSContract.getAddress()], [-prices[i], prices[i]]);

        // Check PurchaseNftWithId event and arguments
        expect(
          tx
        ).to.emit(pubSContract, "PurchaseNftWithId")

        const events = res.logs?.filter((e) => (e.fragment.name == "PurchaseNftWithId"));
        expect(
          events[0].args[1]
        ).to.be.equal(tokenIds[i]);

        // Check owner of the NFT
        const nftOwner = await pubSContract.ownerOf(tokenIds[i]);
        expect(
          nftOwner
        ).to.equal(alice.address);
      }
    });

    it("purchaseWithEtherAndId receives Ether and assigns Nft id", async () => {
      const priceNft = pEth("0.01");
      const tokenId = 900;

      const purchaseWithEtherAndId = pubSContract.connect(alice).purchaseWithEtherAndId;
      const tx = await purchaseWithEtherAndId(tokenId, { value: priceNft });
      const res = await tx.wait();

      // Check balances
      expect(
        tx
      ).to.changeEtherBalances([alice.address, pubSContract.getAddress()], [-priceNft, priceNft]);

      // Check event PurchaseNftWithId and arguments
      expect(
        tx
      ).to.emit(pubSContract, "PurchaseNftWithId")

      expect(
        res.logs[0].args[1]
      ).to.be.equal(tokenId);

      // Check owner of the NFT
      const nftOwner = await pubSContract.ownerOf(tokenId);
      expect(
        nftOwner
      ).to.equal(alice.address);
    });

    it("depositEthForARandomNft receives Ether and assigns Nft id", async () => {
      const priceNft = pEth("0.01");

      const depositEthForARandomNft = pubSContract.connect(alice).depositEthForARandomNft;
      const tx = await depositEthForARandomNft({ value: priceNft });
      const res = await tx.wait();

      // Check balances
      expect(
        tx
      ).to.changeEtherBalances([alice.address, pubSContract.getAddress()], [-priceNft, priceNft]);

      // Check event PurchaseNftWithId and arguments
      expect(tx)
        .to.emit(pubSContract, "PurchaseNftWithId")

      const tokenId = res.logs[0].args[1];
      expect(
        tokenId
      ).to.be.within(700, 900)

      // Check owner of the NFT
      const nftOwner = await pubSContract.ownerOf(tokenId);
      expect(
        nftOwner
      ).to.equal(alice.address);
    });
  });
});

/**
 * Testing
 * 
 * CuyCollectionNft contract
 * 1. safeMint method protected by MINTER_ROLE
 * 2. safeMintWhiteList method is protected by white list
 * 3. safeMintWhiteList mints an NFT to its respective address in white list
 * 4. BuyBack method is only executed by NFT owner
 * 5. BuyBack method removes token ownership
 * 
 * PublicSale contract
 * 1. Verify if an account has enough balance to execute purchaseWithTokens
 * 2. purchaseWithTokens method receives BBites tokens and assigns Nft id
 * 3. purchaseWithEtherAndId method receives Ether and assigns Nft id
 * 4. depositEthForARandomNft method receives Ether and assigns Nft id
 */


