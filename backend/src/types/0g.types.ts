/**
 * Type definitions for 0G Network services
 * Based on 0G infrastructure specifications
 */

// 0G Compute Types
export interface OGComputeConfig {
  apiKey: string;
  network: '0g-testnet' | '0g-mainnet' | 'testnet' | 'mainnet';
  endpoint?: string;
}

export interface OGComputeJob {
  id: string;
  type: 'inference' | 'training' | 'verification';
  model: string;
  input: OGComputeInput;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  estimatedCompletionTime: number;
  createdAt: Date;
  completedAt?: Date;
  result?: OGComputeResult;
  error?: string;
}

export interface OGComputeInput {
  prompt: string;
  maxTokens: number;
  temperature: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
}

export interface OGComputeResult {
  output: string;
  modelHash: string;
  inputHash: string;
  outputHash: string;
  nodeSignatures: string[];
  computeNodeId: string;
  processingTime: number;
  tokensUsed: number;
}

export interface ProofOfInference {
  questionId: string;
  modelHash: string;
  inputHash: string;
  outputHash: string;
  nodeSignatures: string[];
  timestamp: number;
  computeNodes: string[];
}

// 0G Storage Types
export interface OGStorageConfig {
  apiKey: string;
  network: '0g-testnet' | '0g-mainnet' | 'testnet' | 'mainnet';
  endpoint?: string;
}

export interface OGStorageUploadParams {
  data: Buffer | string;
  metadata?: Record<string, any>;
  encryption?: boolean;
  redundancy?: number;
}

export interface OGStorageUploadResult {
  hash: string;
  url: string;
  size: number;
  timestamp: number;
  redundancy: number;
  metadata?: Record<string, any>;
}

export interface OGStorageRetrieveParams {
  hash: string;
  decrypt?: boolean;
}

export interface OGStorageData {
  data: Buffer | string;
  hash: string;
  metadata?: Record<string, any>;
  timestamp: number;
}

// Job Status Types
export interface JobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  result?: any;
  error?: string;
}

// Network Types
export interface NetworkConfig {
  rpcUrl: string;
  chainId: number;
  name: string;
  currency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

// Error Types
export class OGServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'OGServiceError';
  }
}

export enum OGErrorCode {
  NETWORK_ERROR = 'OG_NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'OG_AUTH_ERROR',
  INSUFFICIENT_BALANCE = 'OG_INSUFFICIENT_BALANCE',
  JOB_FAILED = 'OG_JOB_FAILED',
  STORAGE_ERROR = 'OG_STORAGE_ERROR',
  VALIDATION_ERROR = 'OG_VALIDATION_ERROR',
  TIMEOUT = 'OG_TIMEOUT',
  RATE_LIMIT = 'OG_RATE_LIMIT',
  CONNECTION_ERROR = 'OG_CONNECTION_ERROR',
  INITIALIZATION_ERROR = 'OG_INITIALIZATION_ERROR',
  CONTRACT_ERROR = 'OG_CONTRACT_ERROR',
  TRANSACTION_ERROR = 'OG_TRANSACTION_ERROR',
  COMPUTE_ERROR = 'OG_COMPUTE_ERROR',
  INVALID_INPUT = 'OG_INVALID_INPUT',
  UNAUTHORIZED = 'OG_UNAUTHORIZED',
  INSUFFICIENT_RESOURCES = 'OG_INSUFFICIENT_RESOURCES',
}

// Model Types
export interface AIModel {
  id: string;
  name: string;
  version: string;
  hash: string;
  type: 'text' | 'image' | 'multimodal';
  contextLength: number;
  pricing: {
    perToken: number;
    minimumFee: number;
  };
}

// Blockchain Types
export interface OGTransactionResult {
  hash: string;
  blockNumber: number;
  gasUsed: string;
  status: 'success' | 'failed';
  confirmations: number;
}

export interface OGTransactionReceipt {
  transactionHash: string;
  blockNumber: number;
  gasUsed: bigint;
  status: number;
  logs: any[];
}