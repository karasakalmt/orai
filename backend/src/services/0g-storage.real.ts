import { ZgFile, Indexer, getFlowContract } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { logger } from '../utils/logger';
import {
  OGStorageUploadParams,
  OGStorageUploadResult,
  OGStorageRetrieveParams,
  OGStorageData,
  OGServiceError,
  OGErrorCode
} from '../types/0g.types';

/**
 * Real 0G Storage Service
 * Interacts with actual 0G decentralized storage network
 */
export class Real0GStorageService {
  private indexer: Indexer;
  private signer: ethers.Wallet;
  private provider: ethers.JsonRpcProvider;
  private flowContract: any;
  private initialized: boolean = false;

  constructor() {
    // Use testnet endpoints from our config
    const RPC_URL = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai/';
    const INDEXER_RPC = process.env.OG_INDEXER_URL || 'https://indexer-storage-testnet-turbo.0g.ai';

    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(RPC_URL);

    // Initialize wallet if private key is available
    const privateKey = process.env.WALLET_PRIVATE_KEY;
    if (!privateKey) {
      logger.warn('No wallet private key found. Storage service will be limited.');
      throw new OGServiceError(
        'Wallet private key not configured',
        OGErrorCode.INITIALIZATION_ERROR,
        500
      );
    }

    this.signer = new ethers.Wallet(privateKey, this.provider);
    this.indexer = new Indexer(INDEXER_RPC);

    // Initialize flow contract
    this.initializeContract();

    logger.info({
      network: 'testnet',
      rpc: RPC_URL,
      indexer: INDEXER_RPC
    }, 'Real 0G Storage service initialized');
  }

  /**
   * Initialize the flow contract for storage operations
   */
  private async initializeContract(): Promise<void> {
    try {
      // Flow contract address for testnet
      const FLOW_CONTRACT_ADDRESS = '0x22E03a6A89B950F1c82ec5e74F8eCa321a105296';

      this.flowContract = await getFlowContract(FLOW_CONTRACT_ADDRESS, this.signer);
      this.initialized = true;

      const walletAddress = await this.signer.getAddress();
      const balance = await this.provider.getBalance(walletAddress);

      logger.info({
        wallet: walletAddress,
        balance: ethers.formatEther(balance),
        flowContract: FLOW_CONTRACT_ADDRESS
      }, 'Storage contract initialized');
    } catch (error) {
      logger.error({ error }, 'Failed to initialize storage contract');
      this.initialized = false;
    }
  }

  /**
   * Store answer data on real 0G Storage network
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
  }): Promise<{ storageHash: string; storageUrl: string; txHash?: string }> {
    if (!this.initialized) {
      throw new OGServiceError(
        'Storage service not initialized',
        OGErrorCode.INITIALIZATION_ERROR,
        500
      );
    }

    const tempDir = path.join(os.tmpdir(), '0g-storage');
    await fs.mkdir(tempDir, { recursive: true });
    const tempPath = path.join(tempDir, `answer_${Date.now()}.json`);

    try {
      // Prepare comprehensive answer data for permanent storage
      const answerData = {
        // Question & Answer
        questionId: answer.questionId,
        questionText: answer.questionText || '',
        answerText: answer.answerText,

        // Evidence & Sources
        evidenceSummary: answer.evidenceSummary,
        evidence: answer.evidence || [],

        // Proof of Inference (for verification)
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
        network: 'testnet',
        storageType: '0g-decentralized'
      };

      // Write to temporary file
      await fs.writeFile(tempPath, JSON.stringify(answerData, null, 2));

      // Create ZgFile from the temporary file
      const file = await ZgFile.fromFilePath(tempPath);

      // Generate merkle tree
      const [tree, treeErr] = await file.merkleTree();
      if (treeErr) {
        throw new OGServiceError(
          'Failed to generate merkle tree',
          OGErrorCode.STORAGE_ERROR,
          500,
          treeErr
        );
      }

      logger.info({
        questionId: answer.questionId,
        root: tree.root(),
        fileSize: file.size()
      }, 'Uploading to 0G Storage...');

      // Upload to 0G Storage network (correct parameters: zgFile, RPC_URL, signer)
      const RPC_URL = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai/';
      const [txHash, uploadErr] = await this.indexer.upload(
        file,
        RPC_URL,
        this.signer
      );

      if (uploadErr) {
        throw new OGServiceError(
          'Failed to upload to 0G Storage',
          OGErrorCode.STORAGE_ERROR,
          500,
          uploadErr
        );
      }

      logger.info({
        questionId: answer.questionId,
        txHash
      }, 'Upload transaction submitted, waiting for confirmation...');

      // Close file and cleanup
      await file.close();
      await fs.unlink(tempPath).catch(() => {});

      const storageHash = tree.root();
      const storageUrl = `https://storagescan-galileo.0g.ai/hash/${storageHash}`;

      logger.info({
        questionId: answer.questionId,
        storageHash,
        txHash
      }, 'Answer stored on 0G Storage network');

      return {
        storageHash,
        storageUrl,
        txHash
      };
    } catch (error) {
      // Cleanup on error
      await fs.unlink(tempPath).catch(() => {});

      logger.error({ error }, 'Failed to store answer on 0G Storage');

      if (error instanceof OGServiceError) {
        throw error;
      }

      throw new OGServiceError(
        'Storage operation failed',
        OGErrorCode.STORAGE_ERROR,
        500,
        error
      );
    }
  }

  /**
   * Upload generic data to 0G Storage
   */
  async upload(params: OGStorageUploadParams): Promise<OGStorageUploadResult> {
    if (!this.initialized) {
      throw new OGServiceError(
        'Storage service not initialized',
        OGErrorCode.INITIALIZATION_ERROR,
        500
      );
    }

    const tempDir = path.join(os.tmpdir(), '0g-storage');
    await fs.mkdir(tempDir, { recursive: true });
    const tempPath = path.join(tempDir, `upload_${Date.now()}.data`);

    try {
      // Convert data to buffer
      const dataBuffer = Buffer.isBuffer(params.data)
        ? params.data
        : Buffer.from(params.data);

      // Write to temporary file
      await fs.writeFile(tempPath, dataBuffer);

      // Create ZgFile
      const file = await ZgFile.fromFilePath(tempPath);

      // Generate merkle tree
      const [tree, treeErr] = await file.merkleTree();
      if (treeErr) {
        throw treeErr;
      }

      // Upload to network (correct parameters: zgFile, RPC_URL, signer)
      const RPC_URL = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai/';
      const [txHash, uploadErr] = await this.indexer.upload(
        file,
        RPC_URL,
        this.signer
      );

      if (uploadErr) {
        throw uploadErr;
      }

      // Cleanup
      await file.close();
      await fs.unlink(tempPath).catch(() => {});

      const result: OGStorageUploadResult = {
        hash: tree.root(),
        url: `https://storagescan-galileo.0g.ai/hash/${tree.root()}`,
        size: dataBuffer.length,
        timestamp: Date.now(),
        redundancy: params.redundancy || 3,
        metadata: params.metadata
      };

      logger.debug({
        hash: result.hash,
        size: result.size,
        txHash
      }, 'Data uploaded to 0G Storage');

      return result;
    } catch (error) {
      await fs.unlink(tempPath).catch(() => {});

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
   * Retrieve data from 0G Storage network
   */
  async retrieve(params: OGStorageRetrieveParams): Promise<OGStorageData> {
    const tempDir = path.join(os.tmpdir(), '0g-storage');
    await fs.mkdir(tempDir, { recursive: true });
    const outputPath = path.join(tempDir, `download_${Date.now()}.data`);

    try {
      logger.debug({ hash: params.hash }, 'Retrieving from 0G Storage...');

      // Download from network
      const err = await this.indexer.download(
        params.hash,
        outputPath,
        true // proof
      );

      if (err) {
        throw new OGServiceError(
          'Failed to retrieve from 0G Storage',
          OGErrorCode.STORAGE_ERROR,
          404,
          err
        );
      }

      // Read downloaded file
      const data = await fs.readFile(outputPath);

      // Try to parse as JSON if possible
      let parsedData: any = data;
      try {
        const jsonStr = data.toString('utf-8');
        parsedData = JSON.parse(jsonStr);
      } catch {
        // Not JSON, keep as buffer
      }

      // Cleanup
      await fs.unlink(outputPath).catch(() => {});

      const result: OGStorageData = {
        data: parsedData,
        hash: params.hash,
        metadata: {}, // Could extract from indexer if available
        timestamp: Date.now()
      };

      logger.debug({ hash: params.hash }, 'Data retrieved from 0G Storage');

      return result;
    } catch (error) {
      await fs.unlink(outputPath).catch(() => {});

      logger.error({ error, hash: params.hash }, 'Failed to retrieve from 0G Storage');

      if (error instanceof OGServiceError) {
        throw error;
      }

      throw new OGServiceError(
        'Retrieval failed',
        OGErrorCode.STORAGE_ERROR,
        500,
        error
      );
    }
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.initialized;
  }

  /**
   * Get wallet address
   */
  async getWalletAddress(): Promise<string | null> {
    try {
      return await this.signer.getAddress();
    } catch {
      return null;
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(): Promise<{ balance: string; formatted: string }> {
    try {
      const address = await this.signer.getAddress();
      const balance = await this.provider.getBalance(address);
      return {
        balance: balance.toString(),
        formatted: ethers.formatEther(balance)
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get balance');
      return {
        balance: '0',
        formatted: '0'
      };
    }
  }
}