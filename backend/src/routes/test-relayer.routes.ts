import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { relayerService } from '../services';
import { logger } from '../utils/logger';

/**
 * Test routes for the relayer service
 * These endpoints control and monitor the event relayer
 */
export async function testRelayerRoutes(app: FastifyInstance) {
  /**
   * Get relayer status
   */
  app.get('/api/test/relayer/status', async (request, reply) => {
    try {
      const status = relayerService.getStatus();

      return reply.code(200).send({
        success: true,
        ...status,
        message: status.running ? 'Relayer is running' : 'Relayer is stopped',
      });
    } catch (error) {
      logger.error({ error }, 'Failed to get relayer status');
      return reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get status',
      });
    }
  });

  /**
   * Start the relayer service
   */
  app.post('/api/test/relayer/start', async (request, reply) => {
    try {
      await relayerService.start();

      return reply.code(200).send({
        success: true,
        message: 'Relayer service started successfully',
        status: relayerService.getStatus(),
      });
    } catch (error) {
      logger.error({ error }, 'Failed to start relayer');
      return reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start relayer',
      });
    }
  });

  /**
   * Stop the relayer service
   */
  app.post('/api/test/relayer/stop', async (request, reply) => {
    try {
      await relayerService.stop();

      return reply.code(200).send({
        success: true,
        message: 'Relayer service stopped successfully',
        status: relayerService.getStatus(),
      });
    } catch (error) {
      logger.error({ error }, 'Failed to stop relayer');
      return reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to stop relayer',
      });
    }
  });

  /**
   * Process pending AI jobs manually
   */
  app.post('/api/test/relayer/process-ai-jobs', async (request, reply) => {
    try {
      await relayerService.processPendingAIJobs();

      return reply.code(200).send({
        success: true,
        message: 'AI jobs processed',
        status: relayerService.getStatus(),
      });
    } catch (error) {
      logger.error({ error }, 'Failed to process AI jobs');
      return reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process jobs',
      });
    }
  });

  /**
   * Simulate a blockchain event (for testing)
   */
  app.post<{ Body: { eventType: string; data: any } }>(
    '/api/test/relayer/simulate-event',
    {
      schema: {
        description: 'Simulate a blockchain event for testing',
        tags: ['test', 'relayer'],
        body: {
          type: 'object',
          required: ['eventType', 'data'],
          properties: {
            eventType: {
              type: 'string',
              enum: [
                'QuestionSubmitted',
                'AnswerSubmitted',
                'VoteCast',
                'VotingFinalized'
              ]
            },
            data: { type: 'object' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { eventType, data } = request.body;

        logger.info({ eventType, data }, 'Simulating blockchain event');

        // Simulate different event types
        switch (eventType) {
          case 'QuestionSubmitted':
            // Mock event data
            const mockQuestionEvent = {
              questionId: data.questionId || `0x${Date.now().toString(16)}`,
              submitter: data.submitter || '0x0000000000000000000000000000000000000001',
              question: data.question || 'Test question?',
              blockNumber: data.blockNumber || 1000000,
              transactionHash: `0x${Date.now().toString(16)}`,
            };

            return reply.code(200).send({
              success: true,
              message: 'QuestionSubmitted event simulated',
              event: mockQuestionEvent,
              note: 'In production, this would be triggered by actual blockchain events',
            });

          case 'VoteCast':
            const mockVoteEvent = {
              questionId: data.questionId || `0x${Date.now().toString(16)}`,
              voter: data.voter || '0x0000000000000000000000000000000000000002',
              support: data.support !== undefined ? data.support : true,
              weight: data.weight || '1000000000000000000', // 1 token
              blockNumber: data.blockNumber || 1000001,
            };

            return reply.code(200).send({
              success: true,
              message: 'VoteCast event simulated',
              event: mockVoteEvent,
            });

          default:
            return reply.code(200).send({
              success: true,
              message: `${eventType} event simulated`,
              event: data,
            });
        }
      } catch (error) {
        logger.error({ error }, 'Failed to simulate event');
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Event simulation failed',
        });
      }
    }
  );

  /**
   * Get processing queue details
   */
  app.get('/api/test/relayer/queue', async (request, reply) => {
    try {
      const status = relayerService.getStatus();

      return reply.code(200).send({
        success: true,
        queueSize: status.queueSize,
        items: status.processingItems.map(([id, item]) => ({
          questionId: id,
          ...item,
        })),
      });
    } catch (error) {
      logger.error({ error }, 'Failed to get queue details');
      return reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get queue',
      });
    }
  });

  logger.info('Relayer test routes registered');
}