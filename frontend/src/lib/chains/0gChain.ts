import { Chain } from 'viem';

// 0G Testnet (Galileo) - Official testnet from docs
export const ogTestnet: Chain = {
  id: 16602, // 0x40da in hex
  name: '0G-Testnet',
  nativeCurrency: {
    decimals: 18,
    name: '0G',
    symbol: '0G',
  },
  rpcUrls: {
    default: {
      http: ['https://evmrpc-testnet.0g.ai'],
    },
    public: {
      http: ['https://evmrpc-testnet.0g.ai'],
    },
  },
  blockExplorers: {
    default: {
      name: '0G Explorer',
      url: 'https://chainscan-galileo.0g.ai',
    },
  },
  testnet: true,
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11' as `0x${string}`,
      blockCreated: 0,
    },
  },
};

export const ogMainnet: Chain = {
  id: 16601,
  name: '0G Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: '0G',
    symbol: 'OG',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.0g.ai'],
    },
    public: {
      http: ['https://rpc.0g.ai'],
    },
  },
  blockExplorers: {
    default: {
      name: '0G Explorer',
      url: 'https://explorer.0g.ai',
    },
  },
  testnet: false,
};