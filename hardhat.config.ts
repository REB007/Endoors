import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ignition";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Get private key from environment variable or use a default one for localhost
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    // Local development network
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // Celo Alfajores testnet
    celoAlfajores: {
      url: process.env.CELO_ALFAJORES_RPC || "https://alfajores-forno.celo-testnet.org",
      accounts: [PRIVATE_KEY],
      chainId: 44787,
    },
    // Celo mainnet (for future use)
    celo: {
      url: process.env.CELO_RPC || "https://forno.celo.org",
      accounts: [PRIVATE_KEY],
      chainId: 42220,
    },
  },
  // Etherscan API key for contract verification (if needed)
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
};

export default config;
