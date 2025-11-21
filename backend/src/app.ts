import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import { logger } from './utils/logger';
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

  // Health check endpoint
  app.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
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
        users: '/api/user/:address'
      }
    };
  });

  return app;
}