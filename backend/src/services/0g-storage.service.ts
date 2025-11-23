import { logger } from '../utils/logger';
import { createHash, randomBytes } from 'crypto';
import {
  OGStorageConfig,
  OGStorageUploadParams,
  OGStorageUploadResult,
  OGStorageRetrieveParams,
  OGStorageData,
  OGServiceError,
  OGErrorCode,
} from '../types/0g.types';

/**
 * 0G Storage Service
 * Handles permanent data storage on the 0G decentralized storage network
 */
export class ZeroGStorageService {
  private config: OGStorageConfig;
  private storageCache: Map<string, OGStorageData>;
  private uploadQueue: Map<string, OGStorageUploadParams>;

  constructor() {
    this.config = {
      apiKey: process.env.OG_STORAGE_API_KEY || '',
      network: (process.env.OG_NETWORK as any) || 'testnet',
      endpoint: process.env.OG_STORAGE_ENDPOINT || 'https://storage.0g.ai/v1',
    };

    this.storageCache = new Map();
    this.uploadQueue = new Map();

    logger.info({ network: this.config.network }, '0G Storage service initialized');
  }

  /**
   * Store answer data on 0G Storage
   */
  async storeAnswer(answer: {
    questionId: string;
    answerText: string;
    evidenceSummary: string;
    modelHash: string;
    inputHash: string;
    outputHash: string;
    timestamp?: number;
    questionText?: string;
    evidence?: Array<{ url: string; content: string; relevance: number }>;
    model?: string;
  }): Promise<{ storageHash: string; storageUrl: string }> {
    try {
      const data = JSON.stringify({
        // Question & Answer
        questionId: answer.questionId,
        questionText: answer.questionText || '',
        answerText: answer.answerText,

        // Evidence & Sources
        evidenceSummary: answer.evidenceSummary,
        evidence: answer.evidence || [],

        // Proof of Inference
        proofOfInference: {
          model: answer.model || 'unknown',
          modelHash: answer.modelHash,
          inputHash: answer.inputHash,
          outputHash: answer.outputHash,
          input: answer.questionText || '',
          output: answer.answerText
        },

        // Metadata
        timestamp: answer.timestamp || Date.now(),
        version: '1.0.0',
        network: this.config.network,
        storageType: '0g-mock'
      });

      const uploadResult = await this.upload({
        data: Buffer.from(data),
        metadata: {
          type: 'oracle_answer',
          questionId: answer.questionId,
          contentType: 'application/json',
        },
        encryption: false, // Answers should be publicly accessible
        redundancy: 5, // High redundancy for important data
      });

      logger.info(
        { questionId: answer.questionId, hash: uploadResult.hash },
        'Answer stored on 0G Storage'
      );

      return {
        storageHash: uploadResult.hash,
        storageUrl: uploadResult.url,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to store answer on 0G Storage');
      if (error instanceof OGServiceError) {
        throw error;
      }
      throw new OGServiceError(
        'Failed to store answer',
        OGErrorCode.STORAGE_ERROR,
        500,
        error
      );
    }
  }

  /**
   * Store evidence and supporting documents
   */
  async storeEvidence(evidence: {
    questionId: string;
    sources: Array<{ url: string; content: string; timestamp: number }>;
    analysis: string;
  }): Promise<{ storageHash: string; size: number }> {
    try {
      const data = JSON.stringify(evidence);

      const uploadResult = await this.upload({
        data: Buffer.from(data),
        metadata: {
          type: 'oracle_evidence',
          questionId: evidence.questionId,
          sourceCount: evidence.sources.length,
        },
        encryption: false,
        redundancy: 3,
      });

      logger.info(
        { questionId: evidence.questionId, hash: uploadResult.hash },
        'Evidence stored on 0G Storage'
      );

      return {
        storageHash: uploadResult.hash,
        size: uploadResult.size,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to store evidence');
      throw new OGServiceError(
        'Failed to store evidence',
        OGErrorCode.STORAGE_ERROR,
        500,
        error
      );
    }
  }

  /**
   * Upload data to 0G Storage
   */
  async upload(params: OGStorageUploadParams): Promise<OGStorageUploadResult> {
    try {
      // Generate storage hash
      const dataBuffer = Buffer.isBuffer(params.data)
        ? params.data
        : Buffer.from(params.data);
      const hash = this.generateStorageHash(dataBuffer);

      // Check if already stored (deduplication)
      if (this.storageCache.has(hash)) {
        const cached = this.storageCache.get(hash)!;
        logger.debug({ hash }, 'Data already stored, returning cached result');
        return {
          hash,
          url: this.generateStorageUrl(hash),
          size: dataBuffer.length,
          timestamp: cached.timestamp,
          redundancy: params.redundancy || 3,
          metadata: params.metadata,
        };
      }

      // Add to upload queue
      this.uploadQueue.set(hash, params);

      // Simulate upload process
      await this.simulateUpload(hash, dataBuffer);

      // Store in cache
      const storageData: OGStorageData = {
        data: dataBuffer,
        hash,
        metadata: params.metadata,
        timestamp: Date.now(),
      };
      this.storageCache.set(hash, storageData);

      // Remove from queue
      this.uploadQueue.delete(hash);

      const result: OGStorageUploadResult = {
        hash,
        url: this.generateStorageUrl(hash),
        size: dataBuffer.length,
        timestamp: storageData.timestamp,
        redundancy: params.redundancy || 3,
        metadata: params.metadata,
      };

      logger.debug({ hash, size: result.size }, 'Data uploaded to 0G Storage');

      return result;
    } catch (error) {
      logger.error({ error }, 'Upload to 0G Storage failed');
      throw new OGServiceError(
        'Upload failed',
        OGErrorCode.STORAGE_ERROR,
        500,
        error
      );
    }
  }

  /**
   * Retrieve data from 0G Storage
   */
  async retrieve(params: OGStorageRetrieveParams): Promise<OGStorageData> {
    try {
      const { hash } = params;

      // Check cache first
      if (this.storageCache.has(hash)) {
        logger.debug({ hash }, 'Retrieved from cache');
        return this.storageCache.get(hash)!;
      }

      // Simulate network retrieval
      await this.simulateRetrieval(hash);

      // For demo purposes, generate mock data if not found
      const mockData: OGStorageData = {
        data: Buffer.from(
          JSON.stringify({
            message: 'Mock data retrieved from 0G Storage',
            hash,
            timestamp: Date.now(),
          })
        ),
        hash,
        metadata: { retrieved: true },
        timestamp: Date.now(),
      };

      // Cache the retrieved data
      this.storageCache.set(hash, mockData);

      logger.debug({ hash }, 'Data retrieved from 0G Storage');

      return mockData;
    } catch (error) {
      logger.error({ error, hash: params.hash }, 'Failed to retrieve from 0G Storage');
      throw new OGServiceError(
        'Retrieval failed',
        OGErrorCode.STORAGE_ERROR,
        500,
        error
      );
    }
  }

  /**
   * Verify data integrity
   */
  async verifyIntegrity(hash: string, data: Buffer | string): Promise<boolean> {
    try {
      const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
      const calculatedHash = this.generateStorageHash(dataBuffer);
      const isValid = calculatedHash === hash;

      logger.debug({ hash, isValid }, 'Data integrity verification');

      return isValid;
    } catch (error) {
      logger.error({ error }, 'Integrity verification failed');
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalStored: number;
    totalSize: number;
    avgRedundancy: number;
    cacheHitRate: number;
  }> {
    let totalSize = 0;
    let totalRedundancy = 0;

    for (const data of this.storageCache.values()) {
      const size = Buffer.isBuffer(data.data)
        ? data.data.length
        : Buffer.from(data.data).length;
      totalSize += size;
      totalRedundancy += 3; // Default redundancy
    }

    const avgRedundancy =
      this.storageCache.size > 0 ? totalRedundancy / this.storageCache.size : 0;

    return {
      totalStored: this.storageCache.size,
      totalSize,
      avgRedundancy,
      cacheHitRate: this.calculateCacheHitRate(),
    };
  }

  /**
   * Generate a storage hash for data
   */
  private generateStorageHash(data: Buffer): string {
    const hash = createHash('sha256').update(data).digest('hex');
    return `0x${hash}`;
  }

  /**
   * Generate a storage URL for a hash
   */
  private generateStorageUrl(hash: string): string {
    const network = this.config.network === 'mainnet' ? 'mainnet' : 'testnet';
    return `https://storage.0g.ai/${network}/${hash}`;
  }

  /**
   * Simulate upload delay
   */
  private async simulateUpload(hash: string, data: Buffer): Promise<void> {
    // Simulate network delay based on data size
    const sizeKB = data.length / 1024;
    const baseDelay = 100; // 100ms base delay
    const sizeDelay = Math.min(sizeKB * 10, 2000); // Max 2 seconds
    const totalDelay = baseDelay + sizeDelay;

    await new Promise(resolve => setTimeout(resolve, totalDelay));

    logger.debug({ hash, sizeKB, delay: totalDelay }, 'Upload simulation completed');
  }

  /**
   * Simulate retrieval delay
   */
  private async simulateRetrieval(hash: string): Promise<void> {
    // Simulate network delay for retrieval
    const delay = 50 + Math.random() * 150; // 50-200ms
    await new Promise(resolve => setTimeout(resolve, delay));

    logger.debug({ hash, delay }, 'Retrieval simulation completed');
  }

  /**
   * Calculate cache hit rate (mock implementation)
   */
  private calculateCacheHitRate(): number {
    // In a real implementation, this would track actual hits/misses
    return 0.75; // 75% cache hit rate
  }

  /**
   * Clean up old cached data
   */
  async cleanupCache(maxAge: number = 3600000): Promise<void> {
    const now = Date.now();
    let cleaned = 0;

    for (const [hash, data] of this.storageCache) {
      const age = now - data.timestamp;
      if (age > maxAge) {
        this.storageCache.delete(hash);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info({ cleaned }, 'Cleaned up old cache entries');
    }
  }

  /**
   * Get pending uploads
   */
  getPendingUploads(): Array<{ hash: string; metadata?: any }> {
    const pending: Array<{ hash: string; metadata?: any }> = [];

    for (const [hash, params] of this.uploadQueue) {
      pending.push({
        hash,
        metadata: params.metadata,
      });
    }

    return pending;
  }

  /**
   * Retry failed uploads
   */
  async retryFailedUploads(): Promise<void> {
    const failed = Array.from(this.uploadQueue.entries());

    for (const [hash, params] of failed) {
      try {
        await this.upload(params);
        logger.info({ hash }, 'Successfully retried failed upload');
      } catch (error) {
        logger.error({ hash, error }, 'Retry upload failed');
      }
    }
  }
}