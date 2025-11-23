// Hardhat 3 configuration with ESM
import { defineConfig } from "hardhat/config";
import hardhatMocha from "@nomicfoundation/hardhat-mocha";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatVerify from "@nomicfoundation/hardhat-verify";
import "dotenv/config";

export default defineConfig({
  plugins: [hardhatMocha, hardhatEthers, hardhatVerify],
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
      chainId: 31337
    },
    "0g-testnet": {
      type: "http",
      url: process.env.RPC_URL || "https://evmrpc-testnet.0g.ai",
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "your_private_key_here"
        ? [process.env.PRIVATE_KEY]
        : undefined,
      chainId: 16602,
      gasPrice: 25000000000 // 25 gwei
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  },
  verify: {
    etherscan: {
      apiKey: process.env.ETHERSCAN_API_KEY || "no-api-key-needed"
    },
    blockscout: {
      enabled: false
    },
    sourcify: {
      enabled: false
    }
  },
  chainDescriptors: {
    16602: {
      name: "0G Testnet",
      blockExplorers: {
        etherscan: {
          name: "0G Scan",
          url: "https://scan-testnet.0g.ai",
          apiUrl: "https://scan-testnet.0g.ai/api"
        }
      }
    }
  }
});