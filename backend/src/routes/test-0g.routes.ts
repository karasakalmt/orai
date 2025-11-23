import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { getComputeService, getStorageService, getServiceStatus } from '../services/service-factory';
import { logger } from '../utils/logger';

interface TestComputeBody {
  question: string;
  referenceUrls?: string[];
  model?: string;
}

interface TestStorageBody {
  data: any;
  metadata?: Record<string, any>;
}

/**
 * Test routes for 0G services
 * These endpoints are for development and testing purposes
 */
export async function test0GRoutes(app: FastifyInstance) {
  const computeService = await getComputeService();
  const storageService = await getStorageService();
  const serviceStatus = getServiceStatus();

  /**
   * Test 0G Compute service
   */
  app.post<{ Body: TestComputeBody }>(
    '/api/test/0g-compute',
    {
      schema: {
        description: 'Test 0G Compute service with a sample question',
        tags: ['test'],
        body: {
          type: 'object',
          required: ['question'],
          properties: {
            question: { type: 'string', minLength: 10 },
            referenceUrls: {
              type: 'array',
              items: { type: 'string', format: 'uri' },
              maxItems: 5,
            },
            model: { type: 'string', enum: ['gpt-4', 'llama-70b'] },
          },
        },
        response: {
          200: {
            description: 'Compute job submitted successfully',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              jobId: { type: 'string' },
              estimatedTime: { type: 'number' },
              status: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: TestComputeBody }>, reply: FastifyReply) => {
      try {
        const { question, referenceUrls, model } = request.body;

        // Submit job to 0G Compute
        const result = await computeService.submitInferenceJob({
          questionText: question,
          referenceUrls,
          model,
          priority: 'normal',
        });

        logger.info({ jobId: result.jobId }, 'Test compute job submitted');

        // Get initial status
        const status = await computeService.getJobStatus(result.jobId);

        return reply.code(200).send({
          success: true,
          jobId: result.jobId,
          estimatedTime: result.estimatedTime,
          status: status.status,
          message: `Compute job submitted. Check status at /api/test/0g-compute/status/${result.jobId}`,
        });
      } catch (error) {
        logger.error({ error }, 'Test compute failed');
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * Check compute job status
   */
  app.get<{ Params: { jobId: string } }>(
    '/api/test/0g-compute/status/:jobId',
    {
      schema: {
        description: 'Check status of a compute job',
        tags: ['test'],
        params: {
          type: 'object',
          properties: {
            jobId: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { jobId: string } }>, reply: FastifyReply) => {
      try {
        const { jobId } = request.params;

        const status = await computeService.getJobStatus(jobId);
        const result = await computeService.getJobResult(jobId);

        return reply.code(200).send({
          success: true,
          jobId,
          status: status.status,
          progress: status.progress,
          message: status.message,
          result: result || null,
        });
      } catch (error) {
        logger.error({ error }, 'Status check failed');
        return reply.code(404).send({
          success: false,
          error: error instanceof Error ? error.message : 'Job not found',
        });
      }
    }
  );

  /**
   * Test 0G Storage service
   */
  app.post<{ Body: TestStorageBody }>(
    '/api/test/0g-storage',
    {
      schema: {
        description: 'Test 0G Storage service',
        tags: ['test'],
        body: {
          type: 'object',
          required: ['data'],
          properties: {
            data: { type: 'object' },
            metadata: { type: 'object' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: TestStorageBody }>, reply: FastifyReply) => {
      try {
        const { data, metadata } = request.body;

        // Store test answer data with comprehensive format
        const result = await storageService.storeAnswer({
          questionId: `test_${Date.now()}`,
          questionText: 'Test question for storage verification',
          answerText: JSON.stringify(data),
          evidenceSummary: 'Test storage operation with comprehensive data format',
          evidence: [
            { url: 'https://example.com/test', content: 'Test evidence', relevance: 1.0 }
          ],
          model: 'test-model',
          modelHash: '0x' + 'a'.repeat(64),
          inputHash: '0x' + 'b'.repeat(64),
          outputHash: '0x' + 'c'.repeat(64),
          timestamp: Date.now()
        });

        logger.info({ hash: result.storageHash }, 'Test storage completed');

        return reply.code(200).send({
          success: true,
          storageHash: result.storageHash,
          storageUrl: result.storageUrl,
          message: `Data stored successfully. Retrieve at /api/test/0g-storage/${result.storageHash}`,
        });
      } catch (error) {
        logger.error({ error }, 'Test storage failed');
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Storage failed',
        });
      }
    }
  );

  /**
   * Retrieve from 0G Storage
   */
  app.get<{ Params: { hash: string } }>(
    '/api/test/0g-storage/:hash',
    {
      schema: {
        description: 'Retrieve data from 0G Storage',
        tags: ['test'],
        params: {
          type: 'object',
          properties: {
            hash: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { hash: string } }>, reply: FastifyReply) => {
      try {
        const { hash } = request.params;

        const data = await storageService.retrieve({ hash });

        return reply.code(200).send({
          success: true,
          hash,
          data: data.data.toString(),
          metadata: data.metadata,
          timestamp: data.timestamp,
        });
      } catch (error) {
        logger.error({ error }, 'Retrieval failed');
        return reply.code(404).send({
          success: false,
          error: error instanceof Error ? error.message : 'Data not found',
        });
      }
    }
  );

  /**
   * Test complete oracle flow
   */
  app.post(
    '/api/test/oracle-flow',
    {
      schema: {
        description: 'Test complete oracle flow: compute -> storage',
        tags: ['test'],
        body: {
          type: 'object',
          required: ['question'],
          properties: {
            question: { type: 'string', minLength: 10 },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: { question: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { question } = request.body;

        // Step 1: Submit to compute
        const computeResult = await computeService.submitInferenceJob({
          questionText: question,
          model: 'gpt-4',
        });

        // Step 2: Wait for completion (mock - immediate in test)
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Step 3: Get result
        const jobStatus = await computeService.getJobStatus(computeResult.jobId);
        const jobResult = await computeService.getJobResult(computeResult.jobId);

        if (!jobResult) {
          return reply.code(202).send({
            success: true,
            message: 'Job still processing',
            jobId: computeResult.jobId,
            status: jobStatus.status,
          });
        }

        // Step 4: Store in 0G Storage with comprehensive data
        const storageResult = await storageService.storeAnswer({
          questionId: `oracle_${Date.now()}`,
          questionText: request.body.question,
          answerText: jobResult.output,
          evidenceSummary: 'Generated by 0G Compute decentralized AI inference',
          evidence: [],
          model: 'phala/gpt-oss-120b',
          modelHash: jobResult.modelHash,
          inputHash: jobResult.inputHash,
          outputHash: jobResult.outputHash,
          timestamp: Date.now()
        });

        // Step 5: Generate proof of inference
        const proof = await computeService.generateProofOfInference(
          computeResult.jobId,
          `oracle_${Date.now()}`
        );

        return reply.code(200).send({
          success: true,
          question,
          answer: jobResult.output,
          compute: {
            jobId: computeResult.jobId,
            modelHash: jobResult.modelHash,
            processingTime: jobResult.processingTime,
            tokensUsed: jobResult.tokensUsed,
          },
          storage: {
            hash: storageResult.storageHash,
            url: storageResult.storageUrl,
          },
          proof,
        });
      } catch (error) {
        logger.error({ error }, 'Oracle flow test failed');
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Oracle flow failed',
        });
      }
    }
  );

  /**
   * Get 0G service statistics
   */
  app.get('/api/test/0g-stats', async (request, reply) => {
    try {
      const storageStats = await storageService.getStorageStats();

      return reply.code(200).send({
        success: true,
        storage: storageStats,
        compute: {
          activeJobs: 0, // Would track in production
          completedJobs: 0,
          averageProcessingTime: 3500,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Failed to get stats');
      return reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get stats',
      });
    }
  });

  /**
   * Get 0G service configuration status
   */
  app.get('/api/test/0g-config', async (request, reply) => {
    try {
      return reply.code(200).send({
        success: true,
        ...serviceStatus,
        environment: {
          USE_REAL_0G: process.env.USE_REAL_0G || 'false',
          HAS_PRIVATE_KEY: !!process.env.WALLET_PRIVATE_KEY,
          NETWORK: process.env.OG_NETWORK || 'testnet',
          RPC_URL: process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai'
        }
      });
    } catch (error) {
      logger.error({ error }, 'Failed to get service config');
      return reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get config',
      });
    }
  });

  logger.info({
    mode: serviceStatus.mode,
    compute: serviceStatus.compute,
    storage: serviceStatus.storage
  }, '0G test routes registered');
}