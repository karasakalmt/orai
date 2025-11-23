/**
 * Network Configuration for 0G Testnet
 */

import { ogTestnet } from '../lib/chains/0gChain';

// Export the active chain
export const activeChain = ogTestnet;

// Network information
export const networkInfo = {
  name: '0G-Testnet',
  chainId: 16602,
  symbol: '0G',
  explorer: 'https://chainscan-galileo.0g.ai',
  faucet: 'https://faucet.0g.ai',
  storageExplorer: 'https://storagescan-galileo.0g.ai',
  validatorDashboard: 'https://testnet.0g.explorers.guru',
  description: 'Official 0G testnet (Galileo)',
};

// Contract addresses - Official 0G contracts from docs
export const contractAddresses = {
  // Orai Oracle contracts (to be deployed)
  oracle: '0x0000000000000000000000000000000000000000',
  oraiToken: '0x0000000000000000000000000000000000000000',

  // Official 0G infrastructure contracts
  flow: '0x22E03a6A89B950F1c82ec5e74F8eCa321a105296',
  mine: '0x00A9E9604b0538e06b268Fb297Df333337f9593b',
  reward: '0xA97B57b4BdFEA2D0a25e535bd849ad4e6C440A69',
  daEntrance: '0xE75A073dA5bb7b0eC622170Fd268f35E675a957B',
};