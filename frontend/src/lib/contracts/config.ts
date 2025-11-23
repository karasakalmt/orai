import OracleContractABI from './OracleContract.json';
import VotingContractABI from './VotingContract.json';
import OraiTokenABI from './OraiToken.json';
import GovernanceContractABI from './GovernanceContract.json';

// Contract addresses on 0G Testnet (Chain ID: 16600)
export const CONTRACT_ADDRESSES = {
  OraiToken: '0xDE465372A030570e649e76F9adB6b9bB2EE2f7c0',
  VotingContract: '0x604239Dcb79142D6733c0d9FF03c57f10208D256',
  OracleContract: '0x15ED253e953CCf67BB55E328c2FE4bB2183e3b09',
  GovernanceContract: '0x9811232BE9C101ee7cb90b12439b6ac29Bd16139',
} as const;

// Contract ABIs
export const CONTRACT_ABIS = {
  OraiToken: OraiTokenABI.abi,
  VotingContract: VotingContractABI.abi,
  OracleContract: OracleContractABI.abi,
  GovernanceContract: GovernanceContractABI.abi,
} as const;

// Explorer links
export const EXPLORER_URLS = {
  OraiToken: 'https://scan-testnet.0g.ai/address/0xDE465372A030570e649e76F9adB6b9bB2EE2f7c0',
  VotingContract: 'https://scan-testnet.0g.ai/address/0x604239Dcb79142D6733c0d9FF03c57f10208D256',
  OracleContract: 'https://scan-testnet.0g.ai/address/0x15ED253e953CCf67BB55E328c2FE4bB2183e3b09',
  GovernanceContract: 'https://scan-testnet.0g.ai/address/0x9811232BE9C101ee7cb90b12439b6ac29Bd16139',
} as const;

// Contract configuration
export const CONTRACT_CONFIG = {
  minOracleFee: '0.01', // in 0G tokens
  rewardPercentage: '5',
  treasuryPercentage: '10',
  relayerPercentage: '85',
} as const;

// Network information
export const NETWORK_INFO = {
  name: '0G Testnet',
  chainId: 16600,
  rpcUrl: 'https://evmrpc-testnet.0g.ai',
  explorer: 'https://scan-testnet.0g.ai',
} as const;
