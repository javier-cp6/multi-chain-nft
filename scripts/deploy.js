require("dotenv").config();

const {
  getRole,
  verify,
  verifyNoUp,
  ex,
  printAddress,
  deploySC,
  deploySCNoUp,
  upgradeSC
} = require("../utils");

const { getRootFromMT } = require("../utils/merkleTree");

const MINTER_ROLE = getRole("MINTER_ROLE");
const BURNER_ROLE = getRole("BURNER_ROLE");
const root = getRootFromMT();

// Publicar NFT en Mumbai
async function deployMumbai() {
  const relAddMumbai = "0x2b117C161ad502d5F8267E5BD5F9775c46869B92"; // relayer

  // CuyCollectionNft contract
  const contractName = "CuyCollectionNft";
  const contract = await deploySC(contractName);
  const impAdd = await printAddress(contractName, await contract.getAddress());
  await verify(impAdd, contractName);

  await ex(
    contract,
    "grantRole",
    [MINTER_ROLE, relAddMumbai],
    "Failed to grant role"
  )

  await ex(
    contract,
    "setRoot",
    [root],
    "Failed to set root"
  )
}

// Publicar UDSC, Bbites y  Public Sale Token en Goerli
async function deployGoerli() {
  const relAddGoerli = "0x4946048608E9F99908947c39F779abBDcbacE212"; // relayer

  // USDC contract
  const usdc = await deploySCNoUp("USDCoin")
  await verifyNoUp(usdc, "USDCoin");

  // BBbitesToken contract
  const bbitesToken = await deploySC("BBITESToken")
  const impBT = await printAddress("BBITESToken", await bbitesToken.getAddress())
  await verify(impBT, "BBITESToken");

  await ex(
    bbitesToken,
    "grantRole",
    [MINTER_ROLE, relAddGoerli],
    "Failed to grant role"
  )
}

async function deployGoerliPS() {
  const relAddGoerli = "0x4946048608E9F99908947c39F779abBDcbacE212"

  // PublicSale contract requires uniswap router address 
  const bbAdd = "0x0157fa3e2C2D186b761eEd4871CB2440faCB9DB2";
  const usdcAdd = "0xeB5093BB51C195D942c4E13d78CC80ffb471357B";
  const routerAddress = "0x82BAe957198fd93281DCB774c6bF9e7d4B2289AC";

  const psContract = await deploySC(
    "PublicSale", 
    [
      bbAdd,
      usdcAdd,
      routerAddress 
    ]
  )
  const impPs = await printAddress("PublicSale", await psContract.getAddress())
  await verify(impPs, "PublicSale");
}

async function upgrade() {
  const contractName = "CuyCollectionNft";
  const proxyAddress = "0x541f9FC8C0b54D3e4C2878C4d584E385bD09BEaa";

  const psContract = await upgradeSC(contractName, proxyAddress);
  const newImp = await printAddress(contractName, await psContract.getAddress())
  await verify(newImp, contractName);
}

// deployMumbai()
// deployGoerli()
// deployGoerliPS()
upgrade()
  
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
