/**
 * Deployed contract addresses on 0G testnet
 * Source: contracts/deployments/0g-testnet-latest.json
 */

export const CONTRACT_ADDRESSES = {
  OraiToken: '0xDE465372A030570e649e76F9adB6b9bB2EE2f7c0',
  VotingContract: '0x604239Dcb79142D6733c0d9FF03c57f10208D256',
  OracleContract: '0x15ED253e953CCf67BB55E328c2FE4bB2183e3b09',
  GovernanceContract: '0x9811232BE9C101ee7cb90b12439b6ac29Bd16139',
} as const;

export const NETWORK_CONFIG = {
  chainId: 16600,
  network: '0g-testnet',
  rpcUrl: process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai',
  explorerUrl: 'https://scan-testnet.0g.ai',
} as const;

export const ORACLE_CONFIG = {
  minOracleFee: '0.01',
  rewardPercentage: 5,
  treasuryPercentage: 10,
  relayerPercentage: 85,
} as const;
