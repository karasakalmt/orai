import { buildApp } from './app';
import { logger } from './utils/logger';

const start = async () => {
  try {
    const app = await buildApp();
    const port = process.env.PORT || 3001;

    await app.listen({ port: Number(port), host: '0.0.0.0' });

    logger.info(`🚀 Server listening on port ${port}`);
    logger.info(`📍 Health check: http://localhost:${port}/health`);
    logger.info(`📝 API info: http://localhost:${port}/api`);
    logger.info(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    console.error('Server startup error:', err);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the server
start();