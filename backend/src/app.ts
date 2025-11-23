import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import { logger } from './utils/logger';
import { db } from './config/database';
import { redisConfig } from './config/redis';
import { test0GRoutes } from './routes/test-0g.routes';
import { testBlockchainRoutes } from './routes/test-blockchain.routes';
import { testRelayerRoutes } from './routes/test-relayer.routes';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
    },
  });

  // Register security plugins
  await app.register(helmet);

  // Register CORS
  await app.register(cors, {
    origin: process.env.NODE_ENV === 'production'
      ? 'https://orai.xyz'
      : true,
    credentials: true,
  });

  // Register rate limiting
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '15 minutes',
  });

  // Register JWT authentication
  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'development-secret-change-in-production',
  });

  // Register WebSocket support
  await app.register(websocket);

  // Initialize database and Redis connections
  app.addHook('onReady', async () => {
    try {
      await db.connect();
      await redisConfig.connect();
    } catch (error) {
      app.log.error(error, 'Failed to initialize connections');
      throw error;
    }
  });

  // Graceful shutdown
  app.addHook('onClose', async () => {
    await db.disconnect();
    await redisConfig.disconnect();
  });

  // Health check endpoint with database and Redis status
  app.get('/health', async () => {
    const [dbHealthy, redisHealthy] = await Promise.all([
      db.healthCheck(),
      redisConfig.healthCheck(),
    ]);

    const status = dbHealthy && redisHealthy ? 'healthy' : 'degraded';

    return {
      status,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: dbHealthy ? 'connected' : 'disconnected',
        redis: redisHealthy ? 'connected' : 'disconnected',
      },
    };
  });

  // Base API route
  app.get('/api', async () => {
    return {
      name: 'Orai Oracle API',
      version: '1.0.0',
      description: 'Decentralized AI-verified oracle on 0G',
      endpoints: {
        health: '/health',
        questions: '/api/questions',
        answers: '/api/answers',
        votes: '/api/votes',
        users: '/api/user/:address',
        contracts: {
          info: '/api/contracts/info',
          'oracle-submit': '/api/contracts/oracle/submit-question',
          'oracle-question': '/api/contracts/oracle/question/:questionId',
          'oracle-answer': '/api/contracts/oracle/answer/:questionId',
          'oracle-stats': '/api/contracts/oracle/stats',
          'voting-cast': '/api/contracts/voting/cast-vote',
          'voting-results': '/api/contracts/voting/results/:questionId',
          'token-balance': '/api/contracts/token/balance/:address',
          'token-stake-info': '/api/contracts/token/stake-info/:address',
          'token-stake': '/api/contracts/token/stake',
        },
        relayer: {
          status: '/api/relayer/status',
          start: '/api/relayer/start',
          stop: '/api/relayer/stop',
          'clear-history': '/api/relayer/clear-history',
        },
        test: {
          '0g-compute': '/api/test/0g-compute',
          '0g-storage': '/api/test/0g-storage',
          'oracle-flow': '/api/test/oracle-flow',
          'blockchain-status': '/api/test/blockchain/status',
          'blockchain-balance': '/api/test/blockchain/balance/:address',
          'blockchain-submit-question': '/api/test/blockchain/submit-question',
          'blockchain-cast-vote': '/api/test/blockchain/cast-vote',
          'relayer-status': '/api/test/relayer/status',
          'relayer-start': '/api/test/relayer/start',
          'relayer-stop': '/api/test/relayer/stop',
          'relayer-queue': '/api/test/relayer/queue'
        }
      }
    };
  });

  // Register routes
  // Contract interaction routes
  const { contractRoutes } = await import('./routes/contracts.routes');
  await app.register(contractRoutes);

  // Relayer routes
  const { relayerRoutes, autoStartRelayer, shutdownRelayer } = await import('./routes/relayer.routes');
  await app.register(relayerRoutes);

  // Auto-start relayer if configured
  await autoStartRelayer();

  // Graceful relayer shutdown
  app.addHook('onClose', async () => {
    shutdownRelayer();
  });

  // Test routes for 0G services (development only)
  if (process.env.NODE_ENV !== 'production') {
    await app.register(test0GRoutes);
    await app.register(testBlockchainRoutes);
    await app.register(testRelayerRoutes);
    app.log.info('Test routes registered');
  }

  return app;
}

// Start the server if this module is run directly
if (require.main === module) {
  const start = async () => {
    try {
      const app = await buildApp();
      const port = process.env.PORT || 3001;
      const host = process.env.HOST || '0.0.0.0';

      await app.listen({ port: Number(port), host });

      app.log.info(`🚀 Server listening on http://${host}:${port}`);
      app.log.info(`📍 Health check: http://localhost:${port}/health`);
      app.log.info(`📝 API info: http://localhost:${port}/api`);
      app.log.info(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    } catch (err) {
      console.error('Error starting server:', err);
      process.exit(1);
    }
  };

  start();
}