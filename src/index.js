import { Contract, ethers } from "ethers";

import usdcTknAbi from "../artifacts/contracts/USDCoin.sol/USDCoin.json";
import bbitesTokenAbi from "../artifacts/contracts/BBitesToken.sol/BBITESToken.json";
import publicSaleAbi from "../artifacts/contracts/PublicSale.sol/PublicSale.json";
import nftTknAbi from "../artifacts/contracts/CuyCollectionNft.sol/CuyCollectionNft.json";

// SUGERENCIA: vuelve a armar el MerkleTree en frontend
// Utiliza la libreria buffer
import buffer from "buffer/";
import walletAndIds from "../wallets/walletList";
import { MerkleTree } from "merkletreejs";

var Buffer = buffer.Buffer;
var merkleTree;

function hashToken(tokenId, account) {
  return Buffer.from(
    ethers
      .solidityPackedKeccak256(["uint256", "address"], [tokenId, account])
      .slice(2),
    "hex"
  );
}
function buildMerkleTree() {
  var hashedToken = walletAndIds.map(({ id, address }) => {
    return hashToken(id, address);
  });;
  merkleTree = new MerkleTree(hashedToken, ethers.keccak256, {
    sortPairs: true,
  });
}

var provider, signer, account;
var usdcTkContract, bbitesTknContract, pubSContract, nftContract;
var usdcAddress, bbitesTknAdd, pubSContractAdd, nftAddress;

function initSCsGoerli() {
  provider = new ethers.BrowserProvider(window.ethereum);

  usdcAddress = "0xeB5093BB51C195D942c4E13d78CC80ffb471357B";
  bbitesTknAdd = "0x0157fa3e2C2D186b761eEd4871CB2440faCB9DB2";
  pubSContractAdd = "0xEC9DFBcbe0c17032eF9286b58881248f7ba8A5F4";

  usdcTkContract = new Contract(usdcAddress, usdcTknAbi.abi, provider);
  bbitesTknContract = new Contract(bbitesTknAdd, bbitesTokenAbi.abi, provider);
  pubSContract = new Contract(pubSContractAdd, publicSaleAbi.abi, provider);
}

function initSCsMumbai() {
  provider = new ethers.BrowserProvider(window.ethereum);

  nftAddress = "0x541f9FC8C0b54D3e4C2878C4d584E385bD09BEaa";

  nftContract = new Contract(nftAddress, nftTknAbi.abi, provider);
}

function setUpListeners() {
  // Connect to Metamask
  var bttn = document.getElementById("connect");
  var walletIdEl = document.getElementById("walletId");

  bttn.addEventListener("click", async function () {
    if (window.ethereum) {
      [account] = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Billetera metamask", account);
      provider = new ethers.BrowserProvider(window.ethereum);
      signer = await provider.getSigner(account);

      walletIdEl.innerHTML = `${provider._network.name} ${account}`;
    }
  });

  // USDC Balance - balanceOf
  var usdcUpdateBttn = document.getElementById("usdcUpdate");

  usdcUpdateBttn.addEventListener("click", async function () {
    var balanceEl = document.getElementById("usdcBalance");

    try {
      var balance = await usdcTkContract.balanceOf(account);
      balanceEl.innerHTML = ethers.formatUnits(balance, 6);
      
    } catch (error) {
      console.log(error);
    }
  });

  // Bbites token Balance - balanceOf
  var bbitesTknUpdateBttn = document.getElementById("bbitesTknUpdate");

  bbitesTknUpdateBttn.addEventListener("click", async function () {
    var balanceEl = document.getElementById("bbitesTknBalance");

    try {
      var balance = await bbitesTknContract.balanceOf(account);
      balanceEl.innerHTML = ethers.formatUnits(balance, 18);

    } catch (error) {
      console.log(error);
    }
  });

  // BBTKN allowance
  var bbitesTknAllowanceBbtn = document.getElementById("bbitesTknAllowanceBbtn");

  bbitesTknAllowanceBbtn.addEventListener("click", async function () {
    var allowanceEl = document.getElementById("bbitesTknAllowance");

    try {
      var allowance = await bbitesTknContract.allowance(account, pubSContractAdd);
      allowanceEl.innerHTML = ethers.formatUnits(allowance, 18);
      
    } catch (error) {
      console.log(error);
    }
  });

  // USDC allowance
  var usdcAllowanceBbtn = document.getElementById("usdcAllowanceBbtn");

  usdcAllowanceBbtn.addEventListener("click", async function () {
    var allowanceEl = document.getElementById("usdcAllowance");

    try {
      var allowance = await usdcTkContract.allowance(account, pubSContractAdd);
      allowanceEl.innerHTML = ethers.formatUnits(allowance, 6);

    } catch (error) {
      console.log(error)
    }
  });

  // APPROVE BBTKN
  // bbitesTknContract.approve
  var approveBBTknBttn = document.getElementById("approveButtonBBTkn");

  approveBBTknBttn.addEventListener("click", async function () {
    var inputApproveBBTkn = document.getElementById("approveInput");
    var errorEl = document.getElementById("approveError");
    errorEl.innerHTML = "";

    try {
      var tx = await bbitesTknContract
        .connect(signer)
        .approve(pubSContractAdd, inputApproveBBTkn.value);

      var res = await tx.wait();
      console.log(res.hash);

    } catch (error) {
      errorEl.innerHTML = error.reason;
      console.log(error.reason);
    }
    inputApproveBBTkn.value = "";
  });

  // APPROVE USDC
  // usdcTkContract.approve
  var approveUSDCBttn = document.getElementById("approveButtonUSDC");

  approveUSDCBttn.addEventListener("click", async function () {
    var inputApproveUSDC = document.getElementById("approveInputUSDC");
    var errorEl = document.getElementById("approveErrorUSDC");
    errorEl.innerHTML = "";

    try {
      var tx = await usdcTkContract
        .connect(signer)
        .approve(pubSContractAdd, inputApproveUSDC.value);

      var res = await tx.wait();
      console.log(res.hash);

    } catch (error) {
      errorEl.innerHTML = error.reason;
      console.log(error.reason);
    }
    inputApproveUSDC.value = "";
  });

  
  // purchaseWithTokens
  var purchaseBttn = document.getElementById("purchaseButton");

  purchaseBttn.addEventListener("click", async function () {
    var inputNftId = document.getElementById("purchaseInput");
    var errorEl = document.getElementById("purchaseError");
    errorEl.innerHTML = "";

    try {
      var tx = await pubSContract
        .connect(signer)
        .purchaseWithTokens(inputNftId.value);

      var res = await tx.wait();
      console.log(res.hash);

    } catch (error) {
      errorEl.innerHTML = error.reason;
      console.log(error.reason);
    }
    inputNftId.value = "";
  });

  // purchaseWithUSDC
  var purchaseUSDCBttn = document.getElementById("purchaseButtonUSDC");

  purchaseUSDCBttn.addEventListener("click", async function () {
    var inputNftId = document.getElementById("purchaseInputUSDC");
    var inputAmountUSDC = document.getElementById("amountInUSDCInput");
    var errorEl = document.getElementById("purchaseErrorUSDC");
    errorEl.innerHTML = "";

    try {
      var tx = await pubSContract
        .connect(signer)
        .purchaseWithUSDC(inputNftId.value, inputAmountUSDC.value);

      var res = await tx.wait();
      console.log(res.hash);

    } catch (error) {
      errorEl.innerHTML = error.reason;
      console.log(error.reason);
    }
    inputNftId.value = "";
    inputAmountUSDC.value = "";
  });

  // purchaseWithEtherAndId
  var purchaseEtherBttn = document.getElementById("purchaseButtonEtherId");

  purchaseEtherBttn.addEventListener("click", async function () {
    var inputNftId = document.getElementById("purchaseInputEtherId");
    var errorEl = document.getElementById("purchaseEtherIdError");
    errorEl.innerHTML = "";

    try {
      var tx = await pubSContract
        .connect(signer)
        .purchaseWithEtherAndId(inputNftId.value, { value: ethers.parseEther("0.01") });

      var res = await tx.wait();
      console.log(res.hash);

    } catch (error) {
      errorEl.innerHTML = error.reason;
      console.log(error.reason);
    }
    inputNftId.value = "";
  });

  // send Ether
  var sendEtherBttn = document.getElementById("sendEtherButton");

  sendEtherBttn.addEventListener("click", async function () {
    var errorEl = document.getElementById("sendEtherError");
    errorEl.innerHTML = "";

    try {
      var tx = await pubSContract
        .connect(signer)
        .depositEthForARandomNft({ value: ethers.parseEther("0.01") });

      var res = await tx.wait();
      console.log(res.hash);

    } catch (error) {
      errorEl.innerHTML = error.reason;
      console.log(error.reason);
    }
  });
  
  // getPriceForId
  var getPriceNftByIdBttn = document.getElementById("getPriceNftByIdBttn");

  getPriceNftByIdBttn.addEventListener("click", async function () {
    var inputNftId = document.getElementById("priceNftIdInput");
    var nftPriceEl = document.getElementById("priceNftByIdText");
    var errorEl = document.getElementById("getPriceNftError");
    nftPriceEl.innerHTML = "";
    errorEl.innerHTML = "";

    try {
      var nftPrice = await pubSContract.getPriceForId(inputNftId.value);
      nftPriceEl.innerHTML = ethers.formatUnits(nftPrice, 18);
      
    } catch (error) {
      errorEl.innerHTML = error.reason;
    }
    inputNftId.value = "";
  });

  // getProofs
  var getProofsBttn = document.getElementById("getProofsButtonId");
  
  getProofsBttn.addEventListener("click", async () => {
    var id = document.getElementById("inputIdProofId");
    var address = document.getElementById("inputAccountProofId");
    var proofs = merkleTree.getHexProof(hashToken(id.value, address.value));
    navigator.clipboard.writeText(JSON.stringify(proofs));

    id.value = "";
    address.value = "";
  });

  // safeMintWhiteList
  var safeMintWhiteListBttn = document.getElementById("safeMintWhiteListBttnId");
  // usar ethers.hexlify porque es un array de bytes
  // var proofs = document.getElementById("whiteListToInputProofsId").value;
  // proofs = JSON.parse(proofs).map(ethers.hexlify);

  safeMintWhiteListBttn.addEventListener("click", async function () {
    var inputTo = document.getElementById("whiteListToInputId");
    var inputNftId = document.getElementById("whiteListToInputTokenId");
    var inputProofs = document.getElementById("whiteListToInputProofsId");
    var proofs = JSON.parse(inputProofs.value).map(ethers.hexlify);
    var errorEl = document.getElementById("whiteListErrorId");
    errorEl.innerHTML = "";

    try {
      var tx = await nftContract
        .connect(signer)
        .safeMintWhiteList(inputTo.value, inputNftId.value, proofs);

      var res = await tx.wait();
      console.log(res.hash);
      
    } catch (error) {
      errorEl.innerHTML = error.reason;
      console.log(error.reason);
    }
    inputTo.value = "";
    inputNftId.value = "";
    inputProofs.value = "";
  });

  // buyBack
  var buyBackBttn = document.getElementById("buyBackBttn");

  buyBackBttn.addEventListener("click", async function () {
    var inputNftId = document.getElementById("buyBackInputId");
    var errorEl = document.getElementById("buyBackErrorId");
    errorEl.innerHTML = "";

    try {
      var tx = await nftContract
        .connect(signer)
        .buyBack(inputNftId.value);

      var res = await tx.wait();
      console.log(res.hash);
      
    } catch (error) {
      errorEl.innerHTML = error.reason;
      console.log(error.reason);
    }
    inputNftId.value = "";
  });
}


function setUpEventsContracts() {
  // pubSContract - "PurchaseNftWithId"
  var pubSList = document.getElementById("pubSList");

  pubSContract.on("PurchaseNftWithId", (account, id, event) => {
    var purchaseEvent = document.createElement("div");
    purchaseEvent.innerHTML = `PurchaseNftWithId - Account: ${account}, id: ${id}`;

    pubSList.appendChild(purchaseEvent);
  })

 // bbitesCListener - "Transfer"
  var bbitesListEl = document.getElementById("bbitesTList");

  bbitesTknContract.on("Transfer", (from, to, amount, event) => {
    var transferEvent = document.createElement("div");
    transferEvent.innerHTML = `Transfer - from: ${from}, to: ${to}, amount: ${amount}`;

    bbitesListEl.appendChild(transferEvent);
  })

  // nftCListener - "Transfer"
  var nftList = document.getElementById("nftList");

  nftContract.on("Transfer", (from, to, tokenId, event) => {
    var nftTransferEvent = document.createElement("div");
    nftTransferEvent.innerHTML = `Transfer - from: ${from}, to: ${to}, id: ${tokenId}`;

    nftList.appendChild(nftTransferEvent);
  })

  // nftCListener - "Burn"
  var burnList = document.getElementById("burnList");
  
  nftContract.on("Burn", (account, id, event) => {
    var burnEvent = document.createElement("div");
    burnEvent.innerHTML = `Burn - account: ${account}, id: ${id}`;

    burnList.appendChild(burnEvent);
  })
}


async function setUp() {
  window.ethereum.on("chainChanged", (chainId) => {
    window.location.reload();
  });

  initSCsGoerli();

  initSCsMumbai();

  setUpListeners();

  setUpEventsContracts();

  buildMerkleTree();
}

setUp()
  .then()
  .catch((e) => console.log(e));
