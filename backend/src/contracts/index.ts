/**
 * Contract Services Index
 * Exports all contract services and configuration
 */

export { OracleContractService } from './OracleContract.service';
export { VotingContractService } from './VotingContract.service';
export { OraiTokenService } from './OraiToken.service';

export {
  CONTRACT_ADDRESSES,
  NETWORK_CONFIG,
  ORACLE_CONFIG,
} from './addresses';

/**
 * Create contract service instances
 */
export function createContractServices(privateKey?: string) {
  const oracleService = new OracleContractService(privateKey);
  const votingService = new VotingContractService(privateKey);
  const tokenService = new OraiTokenService(privateKey);

  return {
    oracle: oracleService,
    voting: votingService,
    token: tokenService,
  };
}

import { OracleContractService } from './OracleContract.service';
import { VotingContractService } from './VotingContract.service';
import { OraiTokenService } from './OraiToken.service';

// Singleton instances for read-only operations
let contractServicesInstance: ReturnType<typeof createContractServices> | null = null;

/**
 * Get or create singleton contract service instances
 */
export function getContractServices(privateKey?: string): ReturnType<typeof createContractServices> {
  if (!contractServicesInstance || privateKey) {
    contractServicesInstance = createContractServices(privateKey);
  }
  return contractServicesInstance;
}
