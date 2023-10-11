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
    ev.signature.includes("PurchaseNftWithId")
  );

  var { account, id } = event[0].params;

  // Execute method 'safeMint' on Mumbai network
  var cuyCollectionNftAdd = "0x541f9FC8C0b54D3e4C2878C4d584E385bD09BEaa";
  var tokenAbi = ["function safeMint(address to, uint256 tokenId)"];
  var tokenContract = new ethers.Contract(cuyCollectionNftAdd, tokenAbi, signer);
  var tx = await tokenContract.safeMint(account, id);
  var res = await tx.wait();
  return res;
};
