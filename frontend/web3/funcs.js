import Web3 from "web3";
import Web3Conection from "./ABI/MyContract.json";
import RubleTokenABI from "./ABI/RubleToken.json";
import GoldTokenABI from "./ABI/GoldToken.json";
import SilverTokenABI from "./ABI/SilverToken.json";
import PlatinumTokenABI from "./ABI/PlatinumToken.json";
import PalladiumTokenABI from "./ABI/PalladiumToken.json";

const SEPOLIA_TESTNET_RPC =
  "https://sepolia.infura.io/v3/357642b18bd846d9b38050faf18dd586";

const Contract = require("web3-eth-contract");

Contract.setProvider(SEPOLIA_TESTNET_RPC);

const Contract_Address = "0xB62b47FAE246D0eBe79FE876a4006C4ECAe6544a";

const loadWeb3 = async () => {
  if (window.ethereum) {
    window.web3 = new Web3(ethereum);
    try {
      // Request account access if needed
      await ethereum.enable();
      // Acccounts now exposed
      web3.eth.sendTransaction({ method: "eth_requestAccounts" });
    } catch (error) {
      // User denied account access...
    }
  }
  // Legacy dapp browsers...
  else if (window.web3) {
    window.web3 = new Web3(web3.currentProvider);
    // Acccounts always exposed
    web3.eth.sendTransaction({
      /* ... */
    });
  }
  // Non-dapp browsers...
  else {
    console.log(
      "Non-Ethereum browser detected. You should consider trying MetaMask!"
    );
  }
};

export const loadData = async () => {
  await loadWeb3();

  const MyContract = new Contract(Web3Conection, Contract_Address);

  const addressAccount = await window.web3.eth.getCoinbase();

  const rubleContract = new Contract(
    RubleTokenABI,
    (await MyContract.methods.tokens().call()).ruble
  );

  const goldContract = new Contract(
    GoldTokenABI,
    (await MyContract.methods.tokens().call()).gold
  );

  const silverContract = new Contract(
    SilverTokenABI,
    (await MyContract.methods.tokens().call()).silver
  );

  const platinumContract = new Contract(
    PlatinumTokenABI,
    (await MyContract.methods.tokens().call()).platinum
  );

  const palladiumContract = new Contract(
    PalladiumTokenABI,
    (await MyContract.methods.tokens().call()).palladium
  );

  return {
    MyContract,
    addressAccount,
    Contract_Address,
    rubleContract,
    goldContract,
    silverContract,
    platinumContract,
    palladiumContract,
  };
};
