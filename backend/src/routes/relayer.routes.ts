import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { RelayerService } from '../services/relayer.service';
import { logger } from '../utils/logger';

let relayerService: RelayerService | null = null;

/**
 * Relayer management routes
 */
export async function relayerRoutes(app: FastifyInstance) {
  /**
   * Get relayer status
   */
  app.get('/api/relayer/status', async (request, reply) => {
    if (!relayerService) {
      return reply.code(200).send({
        success: true,
        status: 'stopped',
        isRunning: false,
        processedCount: 0,
        message: 'Relayer service not initialized',
      });
    }

    const status = relayerService.getStatus();

    return reply.code(200).send({
      success: true,
      status: status.isRunning ? 'running' : 'stopped',
      ...status,
    });
  });

  /**
   * Start the relayer service
   */
  app.post('/api/relayer/start', async (request, reply) => {
    try {
      const privateKey = process.env.WALLET_PRIVATE_KEY;

      if (!privateKey) {
        return reply.code(400).send({
          success: false,
          error: 'WALLET_PRIVATE_KEY not configured in environment',
        });
      }

      if (relayerService && relayerService.getStatus().isRunning) {
        return reply.code(400).send({
          success: false,
          error: 'Relayer service is already running',
        });
      }

      // Create and start relayer service
      if (!relayerService) {
        relayerService = new RelayerService(privateKey);
      }

      await relayerService.start();

      logger.info('Relayer service started via API');

      return reply.code(200).send({
        success: true,
        message: 'Relayer service started successfully',
        status: relayerService.getStatus(),
      });
    } catch (error) {
      logger.error({ error }, 'Failed to start relayer service');
      return reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start relayer',
      });
    }
  });

  /**
   * Stop the relayer service
   */
  app.post('/api/relayer/stop', async (request, reply) => {
    try {
      if (!relayerService) {
        return reply.code(400).send({
          success: false,
          error: 'Relayer service not initialized',
        });
      }

      if (!relayerService.getStatus().isRunning) {
        return reply.code(400).send({
          success: false,
          error: 'Relayer service is not running',
        });
      }

      relayerService.stop();

      logger.info('Relayer service stopped via API');

      return reply.code(200).send({
        success: true,
        message: 'Relayer service stopped successfully',
        status: relayerService.getStatus(),
      });
    } catch (error) {
      logger.error({ error }, 'Failed to stop relayer service');
      return reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to stop relayer',
      });
    }
  });

  /**
   * Clear processed questions history
   */
  app.post('/api/relayer/clear-history', async (request, reply) => {
    try {
      if (!relayerService) {
        return reply.code(400).send({
          success: false,
          error: 'Relayer service not initialized',
        });
      }

      relayerService.clearHistory();

      return reply.code(200).send({
        success: true,
        message: 'Processed questions history cleared',
      });
    } catch (error) {
      logger.error({ error }, 'Failed to clear history');
      return reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear history',
      });
    }
  });

  logger.info('Relayer routes registered');
}

/**
 * Auto-start relayer if configured
 */
export async function autoStartRelayer(): Promise<void> {
  const autoStart = process.env.AUTO_START_RELAYER === 'true';
  const privateKey = process.env.WALLET_PRIVATE_KEY;

  if (autoStart && privateKey) {
    try {
      logger.info('AUTO_START_RELAYER enabled - starting relayer service...');
      relayerService = new RelayerService(privateKey);
      await relayerService.start();
      logger.info('✅ Relayer service auto-started successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to auto-start relayer service');
    }
  }
}

/**
 * Graceful shutdown of relayer
 */
export function shutdownRelayer(): void {
  if (relayerService && relayerService.getStatus().isRunning) {
    logger.info('Shutting down relayer service...');
    relayerService.stop();
  }
}
