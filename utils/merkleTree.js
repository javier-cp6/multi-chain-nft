const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const { ethers } = require("hardhat");
const walletAndIds = require("../wallets/walletList");

var merkleTree, root;
function hashToken(tokenId, account) {
  return Buffer.from(
    ethers
      .solidityPackedKeccak256(["uint256", "address"], [tokenId, account])
      .slice(2),
    "hex"
  );
}

function getRootFromMT() {
  const hashedToken = walletAndIds.map(({ id, address }) => {
    return hashToken(id, address);
  });
  
  merkleTree = new MerkleTree(hashedToken, keccak256, {
    sortPairs: true,
  });

  root = merkleTree.getHexRoot();

  console.log(root);
  return root;
}

var hashedToken, proofs;
function buildProofs() {
  var tokenId = 1000;
  var account = "0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db";
  hashedToken = hashToken(tokenId, account);
  proofs = merkleTree.getHexProof(hashedToken);
  console.log(proofs);

  // off-chain verification
  console.log("Belongs to merkle tree:", merkleTree.verify(proofs, hashedToken, root));
}

// deploy contract and verify proof
async function main() {
  var merkleTreeContract = await ethers.deployContract("CuyCollectionNft");
  await merkleTreeContract.setRoot(root);

  const acceptedProof = await merkleTreeContract.verifyMerkleProof(
    hashedToken,
    proofs
  );
  console.log(`Belongs to merkle tree: ${acceptedProof}`);

  // mint token with safeMintWhiteList
  var tokenId = 1000;
  var account = "0xC840F562D9F69b46b4227003E01525CB99344B72";
  await merkleTreeContract.safeMintWhiteList(account, tokenId, proofs);
}

getRootFromMT();
buildProofs();
// main();

module.exports = { getRootFromMT };
