import { createZGComputeNetworkBroker, ZGServingNetworkBroker } from '@0glabs/0g-serving-broker';
import { ethers } from 'ethers';
import OpenAI from 'openai';
import { logger } from '../utils/logger';
import {
  OGComputeJob,
  OGComputeResult,
  OGServiceError,
  OGErrorCode,
  ProofOfInference,
  JobStatus
} from '../types/0g.types';
import { randomBytes } from 'crypto';

/**
 * Real 0G Compute Service
 * Interacts with actual 0G GPU compute network for AI inference
 */
export class Real0GComputeService {
  private broker?: ZGServingNetworkBroker;
  private signer: ethers.Wallet;
  private provider: ethers.JsonRpcProvider;
  private initialized: boolean = false;
  private prepaidBalance: number = 0;
  private jobRegistry: Map<string, OGComputeJob> = new Map();

  constructor() {
    // Use testnet RPC
    const RPC_URL = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
    this.provider = new ethers.JsonRpcProvider(RPC_URL);

    // Initialize wallet
    const privateKey = process.env.WALLET_PRIVATE_KEY;
    if (!privateKey) {
      logger.warn('No wallet private key found. Compute service will be limited.');
      throw new OGServiceError(
        'Wallet private key not configured',
        OGErrorCode.INITIALIZATION_ERROR,
        500
      );
    }

    this.signer = new ethers.Wallet(privateKey, this.provider);

    // Initialize broker asynchronously
    this.initializeBroker();
  }

  /**
   * Initialize the 0G Serving broker
   */
  private async initializeBroker(): Promise<void> {
    try {
      logger.info('Initializing 0G Compute broker...');

      // Create the ZG Serving broker
      this.broker = await createZGComputeNetworkBroker(this.signer);

      // Try to get prepaid balance, create account if doesn't exist
      try {
        const ledgerInfo = await this.broker.ledger.getLedger();
        // getLedger returns a Result array, balance is at index 1
        const balance = Array.isArray(ledgerInfo) ? ledgerInfo[1] : ledgerInfo;
        this.prepaidBalance = parseFloat(ethers.formatEther(balance));
        logger.info({ balance: this.prepaidBalance }, '0G Compute account found');
      } catch (error) {
        // Account doesn't exist, create it by adding funds
        if (error instanceof Error && error.message.includes('Account does not exist')) {
          logger.info('0G Compute account does not exist. Creating account...');

          try {
            // Add initial funds to create the account (1.5 0G - providers require minimum 1.0 0G)
            // addLedger expects a number, not bigint
            await this.broker.ledger.addLedger(1.5);

            // Wait for transaction confirmation
            await new Promise(resolve => setTimeout(resolve, 5000));

            const ledgerInfo = await this.broker.ledger.getLedger();
            const balance = Array.isArray(ledgerInfo) ? ledgerInfo[1] : ledgerInfo;
            this.prepaidBalance = parseFloat(ethers.formatEther(balance));
            logger.info({
              newBalance: this.prepaidBalance
            }, '✅ Account created and funded successfully');
          } catch (fundError) {
            logger.error({
              error: fundError,
              errorMessage: fundError instanceof Error ? fundError.message : 'Unknown error'
            }, 'Failed to create account. Need 0G tokens in wallet.');
            throw fundError;
          }
        } else {
          throw error;
        }
      }

      // Fund account if balance is low (minimum 1.0 0G required for provider services)
      if (this.prepaidBalance < 1.0) {
        logger.warn({
          balance: this.prepaidBalance
        }, 'Low prepaid balance. Adding more funds...');

        try {
          // Use depositFund for existing accounts (not addLedger which is for new accounts)
          await this.broker.ledger.depositFund(1.5); // Add 1.5 0G
          await new Promise(resolve => setTimeout(resolve, 5000));

          const ledgerInfo = await this.broker.ledger.getLedger();
          const balance = Array.isArray(ledgerInfo) ? ledgerInfo[1] : ledgerInfo;
          this.prepaidBalance = parseFloat(ethers.formatEther(balance));
          logger.info({
            newBalance: this.prepaidBalance
          }, 'Account funded successfully');
        } catch (error) {
          logger.error({ error }, 'Failed to add funds. Need more 0G tokens.');
        }
      }

      this.initialized = true;

      const walletAddress = await this.signer.getAddress();
      logger.info({
        wallet: walletAddress,
        prepaidBalance: this.prepaidBalance,
        network: 'testnet'
      }, 'Real 0G Compute service initialized');
    } catch (error) {
      logger.error({
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined
      }, 'Failed to initialize compute broker');
      this.initialized = false;
    }
  }

  /**
   * Submit an inference job to the 0G compute network
   */
  async submitInferenceJob(params: {
    questionText: string;
    referenceUrls?: string[];
    model?: string;
    priority?: 'low' | 'normal' | 'high';
  }): Promise<{ jobId: string; estimatedTime: number }> {
    if (!this.initialized || !this.broker) {
      throw new OGServiceError(
        'Compute service not initialized',
        OGErrorCode.INITIALIZATION_ERROR,
        500
      );
    }

    try {
      // Generate unique job ID
      const jobId = `job_${Date.now()}_${randomBytes(6).toString('hex')}`;

      // Prepare the request
      const modelName = params.model || 'phala/gpt-oss-120b'; // Default model

      // List available services
      const services = await this.broker.inference.listService();

      if (services.length === 0) {
        throw new OGServiceError(
          'No compute providers available',
          OGErrorCode.COMPUTE_ERROR,
          503
        );
      }

      // Find a provider that supports the requested model
      const provider = services.find(s =>
        s.model === modelName || s.serviceType === 'inference'
      ) || services[0]; // Fallback to first available

      logger.info({
        jobId,
        provider: provider.provider,
        model: modelName
      }, 'Submitting inference job to 0G Compute...');

      // Check if provider signer is already acknowledged
      const isAcknowledged = await this.broker.inference.userAcknowledged(provider.provider);
      logger.info({
        provider: provider.provider,
        isAcknowledged
      }, 'Checked provider acknowledgment status');

      if (!isAcknowledged) {
        // Transfer funds to provider if needed (creates provider-specific account)
        try {
          const transferAmount = ethers.parseEther('1.0'); // Transfer 1.0 0G to provider account (minimum required)
          logger.info({
            provider: provider.provider,
            amount: '1.0 0G'
          }, 'Transferring funds to provider account...');

          await this.broker.ledger.transferFund(
            provider.provider,
            'inference',
            transferAmount
          );

          logger.info('Provider account funded successfully');
        } catch (error) {
          // Account might already exist, continue
          logger.warn({ error }, 'Provider fund transfer warning (may already be funded)');
        }

        // Acknowledge the provider signer (required before making inference requests)
        logger.info({ provider: provider.provider }, 'Acknowledging provider signer...');
        await this.broker.inference.acknowledgeProviderSigner(provider.provider);
        logger.info('Provider signer acknowledged successfully');
      } else {
        logger.info({ provider: provider.provider }, 'Provider already acknowledged, skipping transfer and acknowledgment');
      }

      // Prepare messages for the model
      const messages = [
        {
          role: 'system' as const,
          content: 'You are a helpful AI assistant providing accurate and verified information.'
        },
        {
          role: 'user' as const,
          content: params.questionText
        }
      ];

      // Add reference URLs if provided
      if (params.referenceUrls && params.referenceUrls.length > 0) {
        messages.push({
          role: 'system' as const,
          content: `Reference URLs for context: ${params.referenceUrls.join(', ')}`
        });
      }

      // Get authenticated headers for the request
      logger.info({ provider: provider.provider }, 'Getting request headers from broker...');
      const headers = await this.broker.inference.getRequestHeaders(
        provider.provider,
        JSON.stringify({
          model: modelName,
          messages,
          stream: false,
          temperature: 0.7,
          max_tokens: 500
        })
      );
      logger.info({ headers: Object.keys(headers) }, 'Request headers obtained');

      // Create job record
      const job: OGComputeJob = {
        id: jobId,
        type: 'inference',
        model: modelName,
        input: {
          prompt: params.questionText,
          maxTokens: 500,
          temperature: 0.7
        },
        status: 'processing',
        estimatedCompletionTime: Date.now() + 5000, // Estimate 5 seconds
        createdAt: new Date()
      };

      this.jobRegistry.set(jobId, job);

      // Make the inference request
      const endpoint = provider.url || `https://api.0g.ai`;
      const requestUrl = `${endpoint}/v1/chat/completions`;
      const requestBody = {
        model: modelName,
        messages,
        stream: false,
        temperature: 0.7,
        max_tokens: 500
      };

      logger.info({
        jobId,
        endpoint: requestUrl,
        model: modelName,
        messageCount: messages.length
      }, 'Making inference request...');

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      logger.info({
        jobId,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      }, 'Received response from provider');

      if (!response.ok) {
        const errorText = await response.text();
        logger.error({
          jobId,
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText
        }, 'Inference request failed');
        throw new Error(`Inference request failed: ${response.statusText} - ${errorText}`);
      }

      const responseText = await response.text();
      logger.debug({ jobId, responseText }, 'Raw response text');

      const result = JSON.parse(responseText);

      // Verify response if provider is verifiable (TEE)
      if (provider.verifiable) {
        try {
          await this.broker.inference.processResponse(provider.provider, response);
          logger.info({ jobId }, 'Response verified successfully');
        } catch (error) {
          logger.warn({ error, jobId }, 'Response verification failed');
        }
      }

      // Update job with result
      const computeResult: OGComputeResult = {
        output: result.choices?.[0]?.message?.content || 'No response generated',
        modelHash: ethers.keccak256(ethers.toUtf8Bytes(modelName)),
        inputHash: ethers.keccak256(ethers.toUtf8Bytes(params.questionText)),
        outputHash: ethers.keccak256(ethers.toUtf8Bytes(result.choices?.[0]?.message?.content || '')),
        nodeSignatures: [provider.provider], // Provider address as signature
        computeNodeId: provider.provider,
        processingTime: Date.now() - job.createdAt.getTime(),
        tokensUsed: result.usage?.total_tokens || 0
      };

      job.status = 'completed';
      job.completedAt = new Date();
      job.result = computeResult;

      // Update prepaid balance
      const ledgerInfo = await this.broker.ledger.getLedger();
      const balance = Array.isArray(ledgerInfo) ? ledgerInfo[1] : ledgerInfo;
      this.prepaidBalance = parseFloat(ethers.formatEther(balance));

      logger.info({
        jobId,
        tokensUsed: computeResult.tokensUsed,
        processingTime: computeResult.processingTime,
        remainingBalance: this.prepaidBalance
      }, 'Inference job completed successfully');

      return {
        jobId,
        estimatedTime: 0 // Already completed
      };
    } catch (error) {
      logger.error({
        error,
        errorType: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        errorDetails: error
      }, 'Failed to submit inference job');

      if (error instanceof OGServiceError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new OGServiceError(
        `Inference job submission failed: ${errorMessage}`,
        OGErrorCode.COMPUTE_ERROR,
        500,
        error
      );
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<JobStatus> {
    const job = this.jobRegistry.get(jobId);

    if (!job) {
      throw new OGServiceError(
        'Job not found',
        OGErrorCode.COMPUTE_ERROR,
        404
      );
    }

    const progress = job.status === 'completed' ? 100 :
                    job.status === 'processing' ? 50 :
                    job.status === 'failed' ? 0 : 25;

    return {
      jobId: job.id,
      status: job.status,
      progress,
      message: job.error || `Job is ${job.status}`,
      result: job.result
    };
  }

  /**
   * Get job result
   */
  async getJobResult(jobId: string): Promise<OGComputeResult | null> {
    const job = this.jobRegistry.get(jobId);

    if (!job) {
      throw new OGServiceError(
        'Job not found',
        OGErrorCode.COMPUTE_ERROR,
        404
      );
    }

    return job.result || null;
  }

  /**
   * Generate proof of inference
   */
  async generateProofOfInference(
    jobId: string,
    questionId: string
  ): Promise<ProofOfInference> {
    const job = this.jobRegistry.get(jobId);

    if (!job || !job.result) {
      throw new OGServiceError(
        'Job not found or not completed',
        OGErrorCode.COMPUTE_ERROR,
        404
      );
    }

    const proof: ProofOfInference = {
      questionId,
      modelHash: job.result.modelHash,
      inputHash: job.result.inputHash,
      outputHash: job.result.outputHash,
      nodeSignatures: job.result.nodeSignatures,
      timestamp: Date.now(),
      computeNodes: [job.result.computeNodeId]
    };

    logger.debug({ jobId, questionId }, 'Proof of inference generated');

    return proof;
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.initialized && !!this.broker;
  }

  /**
   * Get prepaid balance
   */
  async getBalance(): Promise<number> {
    if (!this.broker) {
      return 0;
    }

    try {
      const ledgerInfo = await this.broker.ledger.getLedger();
      const balance = Array.isArray(ledgerInfo) ? ledgerInfo[1] : ledgerInfo;
      this.prepaidBalance = parseFloat(ethers.formatEther(balance));
      return this.prepaidBalance;
    } catch (error) {
      logger.error({ error }, 'Failed to get balance');
      return 0;
    }
  }

  /**
   * Fund prepaid account
   */
  async fundAccount(amount: string): Promise<{ txHash: string; newBalance: number }> {
    if (!this.broker) {
      throw new OGServiceError(
        'Compute service not initialized',
        OGErrorCode.INITIALIZATION_ERROR,
        500
      );
    }

    try {
      // addLedger expects a number
      await this.broker.ledger.addLedger(parseFloat(amount));

      // Wait for transaction confirmation
      await new Promise(resolve => setTimeout(resolve, 5000));

      const ledgerInfo = await this.broker.ledger.getLedger();
      const balance = Array.isArray(ledgerInfo) ? ledgerInfo[1] : ledgerInfo;
      this.prepaidBalance = parseFloat(ethers.formatEther(balance));

      logger.info({
        amount,
        newBalance: this.prepaidBalance
      }, 'Prepaid account funded');

      return {
        txHash: 'completed', // SDK doesn't return tx hash directly
        newBalance: this.prepaidBalance
      };
    } catch (error) {
      logger.error({ error }, 'Failed to fund account');
      throw new OGServiceError(
        'Failed to fund prepaid account',
        OGErrorCode.TRANSACTION_ERROR,
        500,
        error
      );
    }
  }

  /**
   * List available providers
   */
  async listProviders(): Promise<any[]> {
    if (!this.broker) {
      return [];
    }

    try {
      const services = await this.broker.inference.listService();
      return services.map((s: any) => ({
        provider: s.provider,
        url: s.url,
        model: s.model,
        serviceType: s.serviceType,
        verifiable: s.verifiable || false,
        inputPrice: s.inputPrice,
        outputPrice: s.outputPrice
      }));
    } catch (error) {
      logger.error({ error }, 'Failed to list providers');
      return [];
    }
  }

  /**
   * Clean up old jobs from memory
   */
  cleanupJobs(maxAge: number = 3600000): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [jobId, job] of this.jobRegistry) {
      const age = now - job.createdAt.getTime();
      if (age > maxAge) {
        this.jobRegistry.delete(jobId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug({ cleaned }, 'Cleaned up old compute jobs');
    }
  }
}