const { ethers } = require("ethers");
const {
  DefenderRelaySigner,
  DefenderRelayProvider,
} = require("@openzeppelin/defender-relay-client/lib/ethers");

exports.handler = async function (data) {
  const payload = data.request.body.events;

  const provider = new DefenderRelayProvider(data);
  const signer = new DefenderRelaySigner(data, provider, { speed: "fast" });

  // Filter events
  var onlyEvents = payload[0].matchReasons.filter((e) => e.type === "event");
  if (onlyEvents.length === 0) return;

  var event = onlyEvents.filter((ev) =>
    ev.signature.includes("Burn")
  );

  var { account, id } = event[0].params;

  // Execute method 'mint' on Goerli network
  var bbTokenAdd = "0x0157fa3e2C2D186b761eEd4871CB2440faCB9DB2";
  var tokenAbi = ["function mint(address to, uint256 amount)"];
  var tokenContract = new ethers.Contract(bbTokenAdd, tokenAbi, signer);
  const amount = ethers.parseEther("10000");
  var tx = await tokenContract.mint(account, amount);
  var res = await tx.wait();

  return res;
};
