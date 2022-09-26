/* eslint-disable no-undef */
require("hardhat-deploy");
require("@nomiclabs/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");
require("./tasks/compile.cts");

const degen = {
  live: true,
  url: "https://follower.super-degen-chain.lattice.xyz",
  accounts: ["0x26e86e45f6fc45ec6e2ecd128cec80fa1d1505e5507dcd2ae58c3130a7a97b48"],
  chainId: 4242,
};

// this is when connecting to a localhost hh instance, it doesn't actually configure the hh network. for this setup stuff in the 'hardhat' key.
const localhost = {
  url: "http://localhost:8545/",
  accounts: [
    "0x044C7963E9A89D4F8B64AB23E02E97B2E00DD57FCB60F316AC69B77135003AEF",
    "0x523170AAE57904F24FFE1F61B7E4FF9E9A0CE7557987C2FC034EACB1C267B4AE",
    "0x67195c963ff445314e667112ab22f4a7404bad7f9746564eb409b9bb8c6aed32",
  ],
  chainId: 31337,
};

const anvil = {
  url: "http://localhost:8545/",
  accounts: ["0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"],
  chainId: 31337,
};

const op = {
  live: true,
  url: "https://l2.op-bedrock.lattice.xyz",
  accounts: ["0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"],
  chainId: 901,
};

const hardhat = {
  initialDate: "1993-11-19",
  mining: {
    auto: false,
    interval: 1000,
  },
  gasPrice: 0,
  initialBaseFeePerGas: 0,
  blockGasLimit: 100_000_000,
  accounts: [
    // from/deployer is default the first address in accounts
    {
      privateKey: "0x044C7963E9A89D4F8B64AB23E02E97B2E00DD57FCB60F316AC69B77135003AEF",
      balance: "100000000000000000000",
    },
    // user1 in tests
    {
      privateKey: "0x523170AAE57904F24FFE1F61B7E4FF9E9A0CE7557987C2FC034EACB1C267B4AE",
      balance: "100000000000000000000",
    },
    // user2 in tests
    {
      privateKey: "0x67195c963ff445314e667112ab22f4a7404bad7f9746564eb409b9bb8c6aed32",
      balance: "100000000000000000000",
    },
  ],
};

module.exports = {
  defaultNetwork: "hardhat",
  namedAccounts: {
    deployer: 0, // first skey derived from the hd wallet
  },
  networks: {
    degen,
    localhost,
    hardhat,
    op,
    anvil,
  },
  paths: {
    sources: "./src",
    tests: "./hardhat-tests",
  },
  solidity: {
    version: "0.8.13",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};
