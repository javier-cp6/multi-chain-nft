require("dotenv").config();

const {
  getRole,
  verify,
  ex,
  printAddress,
  deploySC,
  deploySCNoUp,
} = require("../utils");

// const { getRootFromMT } = require("../utils/merkleTree");

// var MINTER_ROLE = getRole("MINTER_ROLE");
// var BURNER_ROLE = getRole("BURNER_ROLE");

// Publicar NFT en Mumbai
async function deployMumbai() {
  // var relAddMumbai; // relayer mumbai
  // var name = "Chose a name";
  // var symbol = "Chose a symbol";

  // utiliza deploySC
  // utiliza printAddress
  // utiliza ex
  // utiliza ex
  // utiliza verify

  // CuyCollectionNft contract
  const contractName = "CuyCollectionNft";
  const contract = await deploySC(contractName);
  const impAdd = await printAddress(contractName, await contract.getAddress());
  await verify(impAdd, contractName);
}

// Publicar UDSC, Public Sale y Bbites Token en Goerli
async function deployGoerli() {
  var relAddGoerli; // relayer goerli

  // var psC Contrato
  // deploySC;
  // var bbitesToken Contrato
  // deploySC;
  // var usdc Contrato
  // deploySC;

  // var impPS = await printAddress("PublicSale", await psC.getAddress());
  // var impBT = await printAddress("BBitesToken", await bbitesToken.getAddress());

  // set up
  // script para verificacion del contrato
  
  // usdc contract
  const usdc = await deploySCNoUp("USDCoin")
  const impUSDC = await printAddress("USDCoin", await usdc.getAddress());
  await verify(impUSDC, "USDCoin");

  // bbitesToken contract
  const bbitesToken = await deploySC("BBITESToken")
  const impBT = await printAddress("BBITESToken", await bbitesToken.getAddress())
  await verify(impBT, "BBITESToken");

  // publicSale contract
  // const bbAdd = 0;
  // const usdcAdd = 0;
  // const routerAddress = 0;
  // const psContract = await deploySC(
  //   "PublicSale", 
  //   [
  //     bbAdd,
  //     usdcAdd,
  //     routerAddress 
  //   ]
  // )
  // const impPs = await printAddress("PublicSale", await psContract.getAddress())
  // await verify(impPs, "PublicSale");
}

deployMumbai()
// deployGoerli()
  //
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
