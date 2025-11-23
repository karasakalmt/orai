import { logger } from '../utils/logger';

// Mock implementations
import { ZeroGComputeService } from './0g-compute.service';
import { ZeroGStorageService } from './0g-storage.service';

/**
 * Service Factory
 * Determines whether to use mock or real 0G services based on configuration
 */

// Interface for compute service
interface ComputeService {
  submitInferenceJob(params: any): Promise<any>;
  getJobStatus(jobId: string): Promise<any>;
  getJobResult(jobId: string): Promise<any>;
  generateProofOfInference(jobId: string, questionId: string): Promise<any>;
}

// Interface for storage service
interface StorageService {
  storeAnswer(answer: any): Promise<any>;
  upload(params: any): Promise<any>;
  retrieve(params: any): Promise<any>;
}

/**
 * Create compute service based on environment configuration
 */
export async function createComputeService(): Promise<ComputeService> {
  const useReal = process.env.USE_REAL_0G === 'true';
  const hasPrivateKey = !!process.env.WALLET_PRIVATE_KEY;

  if (useReal && hasPrivateKey) {
    try {
      logger.info('🚀 Using REAL 0G Compute Service');
      const { Real0GComputeService } = await import('./0g-compute.real');
      return new Real0GComputeService() as any;
    } catch (error) {
      logger.error({ error }, 'Failed to initialize real compute service, falling back to mock');
    }
  }

  logger.info('🔧 Using MOCK Compute Service (set USE_REAL_0G=true to use real service)');
  return new ZeroGComputeService() as any;
}

/**
 * Create storage service based on environment configuration
 */
export async function createStorageService(): Promise<StorageService> {
  const useReal = process.env.USE_REAL_0G === 'true';
  const hasPrivateKey = !!process.env.WALLET_PRIVATE_KEY;

  if (useReal && hasPrivateKey) {
    try {
      logger.info('🚀 Using REAL 0G Storage Service');
      const { Real0GStorageService } = await import('./0g-storage.real');
      return new Real0GStorageService() as any;
    } catch (error) {
      logger.error({ error }, 'Failed to initialize real storage service, falling back to mock');
    }
  }

  logger.info('🔧 Using MOCK Storage Service (set USE_REAL_0G=true to use real service)');
  return new ZeroGStorageService() as any;
}

/**
 * Get service status information
 */
export function getServiceStatus(): {
  mode: 'mock' | 'real';
  compute: string;
  storage: string;
  requirements: string[];
} {
  const useReal = process.env.USE_REAL_0G === 'true';
  const hasPrivateKey = !!process.env.WALLET_PRIVATE_KEY;

  const requirements: string[] = [];

  if (!hasPrivateKey) {
    requirements.push('Add WALLET_PRIVATE_KEY to .env');
  }

  if (!useReal) {
    requirements.push('Set USE_REAL_0G=true in .env');
  }

  if (useReal && hasPrivateKey) {
    requirements.push('Get testnet tokens from https://faucet.0g.ai');
    requirements.push('Fund prepaid account for compute');
  }

  return {
    mode: useReal && hasPrivateKey ? 'real' : 'mock',
    compute: useReal && hasPrivateKey ? 'Real0GComputeService' : 'ZeroGComputeService',
    storage: useReal && hasPrivateKey ? 'Real0GStorageService' : 'ZeroGStorageService',
    requirements
  };
}

// Export singleton instances
let computeServiceInstance: ComputeService | null = null;
let storageServiceInstance: StorageService | null = null;

/**
 * Get or create compute service singleton
 */
export async function getComputeService(): Promise<ComputeService> {
  if (!computeServiceInstance) {
    computeServiceInstance = await createComputeService();
  }
  return computeServiceInstance;
}

/**
 * Get or create storage service singleton
 */
export async function getStorageService(): Promise<StorageService> {
  if (!storageServiceInstance) {
    storageServiceInstance = await createStorageService();
  }
  return storageServiceInstance;
}

/**
 * Reset service instances (useful for testing or configuration changes)
 */
export function resetServices(): void {
  computeServiceInstance = null;
  storageServiceInstance = null;
  logger.info('Service instances reset');
}

// Log service configuration on module load
const status = getServiceStatus();
logger.info({
  mode: status.mode,
  compute: status.compute,
  storage: status.storage,
  requirementsCount: status.requirements.length
}, 'Service factory initialized');