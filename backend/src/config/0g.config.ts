/**
 * 0G Network Configuration
 * Based on official 0G testnet documentation
 * Network: Galileo Testnet
 */

export const ZERO_G_CONFIG = {
  // Network Configuration
  network: {
    name: '0G-Galileo-Testnet',
    chainId: 16602,
    currency: {
      name: '0G',
      symbol: '0G',
      decimals: 18,
    },
  },

  // RPC Endpoints
  rpc: {
    // Development endpoint (for testing only)
    development: 'https://evmrpc-testnet.0g.ai',

    // Production-grade alternatives
    production: {
      quickNode: process.env.OG_RPC_QUICKNODE || '',
      thirdWeb: process.env.OG_RPC_THIRDWEB || '',
      ankr: process.env.OG_RPC_ANKR || '',
      drpc: process.env.OG_RPC_DRPC || '',
    },

    // Get active RPC URL based on environment
    getActiveUrl: function() {
      if (process.env.NODE_ENV === 'production' && process.env.OG_RPC_PRODUCTION) {
        return process.env.OG_RPC_PRODUCTION;
      }
      return process.env.OG_RPC_URL || this.development;
    }
  },

  // Smart Contract Addresses (Galileo Testnet)
  contracts: {
    // Storage Components
    storage: {
      flow: '0x22E03a6A89B950F1c82ec5e74F8eCa321a105296',
      mine: '0x00A9E9604b0538e06b268Fb297Df333337f9593b',
      reward: '0xA97B57b4BdFEA2D0a25e535bd849ad4e6C440A69',
    },

    // Data Availability
    da: {
      entrance: '0xE75A073dA5bb7b0eC622170Fd268f35E675a957B',
    },

    // Oracle Hub (to be deployed)
    oracle: {
      hub: process.env.ORACLE_HUB_ADDRESS || '0x0000000000000000000000000000000000000000',
      voting: process.env.VOTING_MODULE_ADDRESS || '0x0000000000000000000000000000000000000000',
      token: process.env.ORAI_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000',
    },
  },

  // Explorer URLs
  explorers: {
    blockExplorer: 'https://chainscan-galileo.0g.ai',
    storageExplorer: 'https://storagescan-galileo.0g.ai',
    validatorDashboard: 'https://testnet.0g.explorers.guru',
  },

  // API Endpoints
  api: {
    compute: {
      endpoint: process.env.OG_COMPUTE_ENDPOINT || 'https://compute.0g.ai/v1',
      apiKey: process.env.OG_COMPUTE_API_KEY || '',
    },
    storage: {
      endpoint: process.env.OG_STORAGE_ENDPOINT || 'https://storage.0g.ai/v1',
      apiKey: process.env.OG_STORAGE_API_KEY || '',
    },
  },

  // Faucet Configuration
  faucet: {
    url: 'https://faucet.0g.ai',
    dailyLimit: '0.1', // 0.1 0G per wallet per day
  },

  // Gas Configuration
  gas: {
    // Gas price in Gwei (adjust based on network conditions)
    price: {
      slow: '10',
      standard: '20',
      fast: '30',
    },
    // Gas limits for different operations
    limits: {
      submitQuestion: 200000,
      submitAnswer: 300000,
      castVote: 150000,
      finalizeVoting: 250000,
    },
  },

  // Timing Configuration
  timing: {
    votingPeriod: 24 * 60 * 60, // 24 hours in seconds
    votingExtension: 12 * 60 * 60, // 12 hours extension for split votes
    answerTimeout: 5 * 60, // 5 minutes for answer generation
    blockTime: 3, // Average block time in seconds
  },

  // Validation Configuration
  validation: {
    minQuorum: 10, // Minimum 10% of staked tokens must vote
    consensusThreshold: 66, // 66% consensus required for verification
    maxReferenceUrls: 5,
    maxQuestionLength: 500,
    minQuestionLength: 10,
  },

  // Helper Functions
  utils: {
    /**
     * Get block explorer URL for a transaction
     */
    getTxExplorerUrl: (txHash: string): string => {
      return `https://chainscan-galileo.0g.ai/tx/${txHash}`;
    },

    /**
     * Get block explorer URL for an address
     */
    getAddressExplorerUrl: (address: string): string => {
      return `https://chainscan-galileo.0g.ai/address/${address}`;
    },

    /**
     * Get storage explorer URL for a storage hash
     */
    getStorageExplorerUrl: (hash: string): string => {
      return `https://storagescan-galileo.0g.ai/hash/${hash}`;
    },
  },
};

// Export individual components for convenience
export const OG_NETWORK = ZERO_G_CONFIG.network;
export const OG_CONTRACTS = ZERO_G_CONFIG.contracts;
export const OG_RPC_URL = ZERO_G_CONFIG.rpc.getActiveUrl();
export const OG_CHAIN_ID = ZERO_G_CONFIG.network.chainId;