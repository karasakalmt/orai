import { logger } from '../utils/logger';
import { createHash } from 'crypto';
import {
  OGComputeConfig,
  OGComputeJob,
  OGComputeInput,
  OGComputeResult,
  ProofOfInference,
  JobStatus,
  OGServiceError,
  OGErrorCode,
  AIModel,
} from '../types/0g.types';

/**
 * 0G Compute Service
 * Handles AI inference jobs on the decentralized 0G GPU network
 */
export class ZeroGComputeService {
  private config: OGComputeConfig;
  private activeJobs: Map<string, OGComputeJob>;
  private models: Map<string, AIModel>;

  constructor() {
    this.config = {
      apiKey: process.env.OG_COMPUTE_API_KEY || '',
      network: (process.env.OG_NETWORK as any) || 'testnet',
      endpoint: process.env.OG_COMPUTE_ENDPOINT || 'https://compute.0g.ai/v1',
    };

    this.activeJobs = new Map();
    this.models = this.initializeModels();

    logger.info({ network: this.config.network }, '0G Compute service initialized');
  }

  /**
   * Initialize available AI models
   */
  private initializeModels(): Map<string, AIModel> {
    const models = new Map<string, AIModel>();

    // GPT-4 equivalent model
    models.set('gpt-4', {
      id: 'gpt-4-0g',
      name: 'GPT-4 0G',
      version: '1.0.0',
      hash: this.generateHash('gpt-4-0g-v1.0.0'),
      type: 'text',
      contextLength: 8192,
      pricing: {
        perToken: 0.00003,
        minimumFee: 0.01,
      },
    });

    // Llama model
    models.set('llama-70b', {
      id: 'llama-70b-0g',
      name: 'Llama 70B 0G',
      version: '2.0.0',
      hash: this.generateHash('llama-70b-0g-v2.0.0'),
      type: 'text',
      contextLength: 4096,
      pricing: {
        perToken: 0.00001,
        minimumFee: 0.005,
      },
    });

    return models;
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
    try {
      const model = params.model || 'gpt-4';
      const modelConfig = this.models.get(model);

      if (!modelConfig) {
        throw new OGServiceError(
          `Model ${model} not found`,
          OGErrorCode.VALIDATION_ERROR,
          400
        );
      }

      const jobId = this.generateJobId();
      const prompt = this.constructPrompt(params.questionText, params.referenceUrls);

      const job: OGComputeJob = {
        id: jobId,
        type: 'inference',
        model,
        input: {
          prompt,
          maxTokens: 1000,
          temperature: 0.7,
          topP: 0.9,
          frequencyPenalty: 0.0,
          presencePenalty: 0.0,
        },
        status: 'pending',
        estimatedCompletionTime: this.calculateEstimatedTime(params.priority),
        createdAt: new Date(),
      };

      this.activeJobs.set(jobId, job);

      // Simulate async processing
      this.processJobAsync(jobId, modelConfig);

      logger.info({ jobId, model }, 'Inference job submitted to 0G Compute');

      return {
        jobId,
        estimatedTime: job.estimatedCompletionTime,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to submit 0G compute job');
      if (error instanceof OGServiceError) {
        throw error;
      }
      throw new OGServiceError(
        'Failed to submit compute job',
        OGErrorCode.NETWORK_ERROR,
        500,
        error
      );
    }
  }

  /**
   * Get the status of a compute job
   */
  async getJobStatus(jobId: string): Promise<JobStatus> {
    const job = this.activeJobs.get(jobId);

    if (!job) {
      throw new OGServiceError(
        `Job ${jobId} not found`,
        OGErrorCode.VALIDATION_ERROR,
        404
      );
    }

    const progress = this.calculateProgress(job);

    return {
      jobId: job.id,
      status: job.status,
      progress,
      message: this.getStatusMessage(job.status),
      result: job.result,
      error: job.error,
    };
  }

  /**
   * Get the result of a completed job
   */
  async getJobResult(jobId: string): Promise<OGComputeResult | null> {
    const job = this.activeJobs.get(jobId);

    if (!job) {
      throw new OGServiceError(
        `Job ${jobId} not found`,
        OGErrorCode.VALIDATION_ERROR,
        404
      );
    }

    if (job.status !== 'completed') {
      return null;
    }

    return job.result || null;
  }

  /**
   * Generate proof of inference for a completed job
   */
  async generateProofOfInference(
    jobId: string,
    questionId: string
  ): Promise<ProofOfInference> {
    const job = this.activeJobs.get(jobId);

    if (!job || !job.result) {
      throw new OGServiceError(
        'Job not found or not completed',
        OGErrorCode.VALIDATION_ERROR,
        400
      );
    }

    const proof: ProofOfInference = {
      questionId,
      modelHash: job.result.modelHash,
      inputHash: job.result.inputHash,
      outputHash: job.result.outputHash,
      nodeSignatures: job.result.nodeSignatures,
      timestamp: Date.now(),
      computeNodes: this.getComputeNodes(),
    };

    logger.info({ jobId, questionId }, 'Proof of inference generated');

    return proof;
  }

  /**
   * Construct a prompt from question and references
   */
  private constructPrompt(questionText: string, referenceUrls?: string[]): string {
    let prompt = `You are Orai, a knowledgeable AI oracle that provides accurate, verifiable answers. Your responses must be factual and evidence-based.\n\n`;
    prompt += `Question: ${questionText}\n\n`;

    if (referenceUrls && referenceUrls.length > 0) {
      prompt += `Reference URLs to consider:\n`;
      referenceUrls.forEach((url, index) => {
        prompt += `${index + 1}. ${url}\n`;
      });
      prompt += `\n`;
    }

    prompt += `Instructions:\n`;
    prompt += `1. Provide a clear, factual answer to the question\n`;
    prompt += `2. Include specific data points and evidence\n`;
    prompt += `3. Cite sources when possible\n`;
    prompt += `4. Be concise but comprehensive\n`;
    prompt += `5. If uncertain, clearly state the limitations\n\n`;
    prompt += `Answer:`;

    return prompt;
  }

  /**
   * Simulate async job processing (in production, this would poll the 0G network)
   */
  private async processJobAsync(jobId: string, model: AIModel): Promise<void> {
    const job = this.activeJobs.get(jobId);
    if (!job) return;

    // Simulate processing delay
    setTimeout(async () => {
      try {
        // Update to processing
        job.status = 'processing';

        // Simulate inference time (2-5 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

        // Generate mock result
        const result: OGComputeResult = {
          output: this.generateMockAnswer(job.input.prompt),
          modelHash: model.hash,
          inputHash: this.generateHash(JSON.stringify(job.input)),
          outputHash: this.generateHash(this.generateMockAnswer(job.input.prompt)),
          nodeSignatures: this.generateNodeSignatures(),
          computeNodeId: `node-${Math.floor(Math.random() * 100)}`,
          processingTime: 2500 + Math.random() * 2500,
          tokensUsed: 150 + Math.floor(Math.random() * 350),
        };

        job.result = result;
        job.status = 'completed';
        job.completedAt = new Date();

        logger.info({ jobId }, 'Compute job completed successfully');
      } catch (error) {
        job.status = 'failed';
        job.error = error instanceof Error ? error.message : 'Unknown error';
        logger.error({ jobId, error }, 'Compute job failed');
      }
    }, 1000);
  }

  /**
   * Generate a mock answer for development/testing
   */
  private generateMockAnswer(prompt: string): string {
    // Extract question from prompt
    const questionMatch = prompt.match(/Question: (.+?)\n/);
    const question = questionMatch ? questionMatch[1] : 'the question';

    // Generate contextual mock answers based on keywords
    if (question.toLowerCase().includes('price') && question.toLowerCase().includes('eth')) {
      return `Based on current market data aggregated from major exchanges, the price of Ethereum (ETH) is $3,245.67 USD as of ${new Date().toISOString()}. This represents a 2.3% increase over the last 24 hours with a trading volume of $15.2 billion. The data is sourced from CoinMarketCap, CoinGecko, and direct exchange APIs including Binance, Coinbase, and Kraken.`;
    }

    if (question.toLowerCase().includes('market cap') && question.toLowerCase().includes('bitcoin')) {
      return `Bitcoin's total market capitalization is currently $1.26 trillion USD, representing 48.7% of the total cryptocurrency market. With 19.5 million BTC in circulation out of the 21 million maximum supply, Bitcoin maintains its position as the largest cryptocurrency by market cap. Data aggregated from CoinMarketCap and CoinGecko as of ${new Date().toISOString()}.`;
    }

    if (question.toLowerCase().includes('gas price')) {
      return `The current Ethereum gas price is 25 Gwei (0.000000025 ETH) for standard transactions. Fast transactions are priced at 30 Gwei, while slow transactions can be processed at 20 Gwei. Network congestion is moderate with approximately 15 transactions per second being processed. Data sourced from Etherscan and Gas Station Network.`;
    }

    // Generic response for other questions
    return `Based on the available data and analysis, ${question.toLowerCase()} has been evaluated using multiple trusted sources. The comprehensive analysis indicates that current metrics show stable performance with positive indicators for the near term. This assessment is based on real-time data aggregated from verified sources as of ${new Date().toISOString()}.`;
  }

  /**
   * Generate a SHA-256 hash
   */
  private generateHash(data: string): string {
    return '0x' + createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate a unique job ID
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Generate mock node signatures
   */
  private generateNodeSignatures(): string[] {
    const signatures: string[] = [];
    const nodeCount = 3 + Math.floor(Math.random() * 3); // 3-5 nodes

    for (let i = 0; i < nodeCount; i++) {
      signatures.push(this.generateHash(`node_signature_${i}_${Date.now()}`));
    }

    return signatures;
  }

  /**
   * Get list of compute nodes (mock)
   */
  private getComputeNodes(): string[] {
    return [
      'node-us-east-1',
      'node-us-west-2',
      'node-eu-central-1',
      'node-ap-southeast-1',
    ].slice(0, 2 + Math.floor(Math.random() * 3));
  }

  /**
   * Calculate estimated completion time
   */
  private calculateEstimatedTime(priority?: 'low' | 'normal' | 'high'): number {
    const baseTime = 30; // 30 seconds base time

    switch (priority) {
      case 'high':
        return baseTime / 2; // 15 seconds
      case 'low':
        return baseTime * 2; // 60 seconds
      default:
        return baseTime; // 30 seconds
    }
  }

  /**
   * Calculate job progress
   */
  private calculateProgress(job: OGComputeJob): number {
    switch (job.status) {
      case 'completed':
        return 100;
      case 'failed':
        return 0;
      case 'processing':
        const elapsed = Date.now() - job.createdAt.getTime();
        const estimated = job.estimatedCompletionTime * 1000;
        return Math.min(95, Math.floor((elapsed / estimated) * 100));
      case 'pending':
        return 10;
      default:
        return 0;
    }
  }

  /**
   * Get human-readable status message
   */
  private getStatusMessage(status: string): string {
    switch (status) {
      case 'pending':
        return 'Job queued for processing';
      case 'processing':
        return 'AI inference in progress on 0G network';
      case 'completed':
        return 'Inference completed successfully';
      case 'failed':
        return 'Job failed during processing';
      default:
        return 'Unknown status';
    }
  }

  /**
   * Clean up old completed jobs
   */
  async cleanupOldJobs(maxAge: number = 3600000): Promise<void> {
    const now = Date.now();
    let cleaned = 0;

    for (const [jobId, job] of this.activeJobs) {
      if (job.completedAt) {
        const age = now - job.completedAt.getTime();
        if (age > maxAge) {
          this.activeJobs.delete(jobId);
          cleaned++;
        }
      }
    }

    if (cleaned > 0) {
      logger.info({ cleaned }, 'Cleaned up old compute jobs');
    }
  }
}