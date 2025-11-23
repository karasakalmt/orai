import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { ogTestnet, ogMainnet } from '../chains/0gChain';

// Get the chain based on environment
const isDevelopment = import.meta.env.DEV;
const chain = isDevelopment ? ogTestnet : ogMainnet;

// Configure wagmi and RainbowKit
export const config = getDefaultConfig({
  appName: 'Orai Oracle',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [ogTestnet, ogMainnet],
  ssr: false, // Set to true if using SSR
});

// Export the active chain for use in components
export const activeChain = chain;