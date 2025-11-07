require("ts-node/register");
require("@fhevm/hardhat-plugin");
require("@nomicfoundation/hardhat-chai-matchers");
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-verify");
require("@typechain/hardhat");
require("hardhat-deploy");
require("hardhat-gas-reporter");
require("solidity-coverage");

// require("./tasks/accounts");
// require("./tasks/EncryptedSurvey");

// Run 'npx hardhat vars setup' to see the list of variables that need to be set

const { vars } = require("hardhat/config");

const MNEMONIC = vars.get("MNEMONIC", "test test test test test test test test test test test junk");
const PRIVATE_KEY = vars.get("PRIVATE_KEY", "");
const INFURA_API_KEY = vars.get("INFURA_API_KEY", "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz");

const sepoliaAccounts =
  PRIVATE_KEY && PRIVATE_KEY.trim().length > 0
    ? [PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`]
    : {
        mnemonic: MNEMONIC,
        path: "m/44'/60'/0'/0/",
        count: 10,
      };

const config = {
  defaultNetwork: "hardhat",
  namedAccounts: {
    deployer: 0,
  },
  etherscan: {
    apiKey: {
      sepolia: vars.get("ETHERSCAN_API_KEY", ""),
    },
  },
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS ? true : false,
    excludeContracts: [],
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic: MNEMONIC,
      },
      chainId: 31337,
    },
    anvil: {
      accounts: {
        mnemonic: MNEMONIC,
        path: "m/44'/60'/0'/0/",
        count: 10,
      },
      chainId: 31337,
      url: "http://localhost:8545",
    },
    sepolia: {
      accounts: sepoliaAccounts,
      chainId: 11155111,
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      gasPrice: 20000000000, // 20 gwei
    },
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
    deployments: "./deployments",
  },
  solidity: {
    version: "0.8.27",
    settings: {
      metadata: {
        // Not including the metadata hash
        // https://github.com/paulrberg/hardhat-template/issues/31
        bytecodeHash: "none",
      },
      // Disable the optimizer when debugging
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 800,
      },
      evmVersion: "cancun",
    },
  },
  typechain: {
    outDir: "types",
    target: "ethers-v6",
  },
  external: {
    deployments: {
      sepolia: ["deployments/sepolia"],
    },
  },
};

module.exports = config;
