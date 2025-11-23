import { createClient } from 'redis';
import { logger } from '../utils/logger';

class RedisConfig {
  private static instance: RedisConfig;
  private client: ReturnType<typeof createClient>;

  private constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    this.client = createClient({
      url: redisUrl,
    });

    this.client.on('connect', () => {
      logger.info('✅ Redis client connected');
    });

    this.client.on('error', (err) => {
      logger.error({ error: err }, 'Redis client error');
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
    });
  }

  public static getInstance(): RedisConfig {
    if (!RedisConfig.instance) {
      RedisConfig.instance = new RedisConfig();
    }
    return RedisConfig.instance;
  }

  public getClient() {
    return this.client;
  }

  public async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      logger.error({ error }, 'Failed to connect to Redis');
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      logger.info('Redis client disconnected');
    } catch (error) {
      logger.error({ error }, 'Failed to disconnect from Redis');
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  // Helper methods for common operations
  public async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  public async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setEx(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  public async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  public async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  public async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  // JSON helper methods
  public async setJSON(key: string, value: any, ttl?: number): Promise<void> {
    const jsonString = JSON.stringify(value);
    if (ttl) {
      await this.client.setEx(key, ttl, jsonString);
    } else {
      await this.client.set(key, jsonString);
    }
  }

  public async getJSON(key: string): Promise<any | null> {
    const value = await this.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value);
    } catch (error) {
      logger.error({ error, key }, 'Failed to parse JSON from Redis');
      return null;
    }
  }
}

// Export singleton instance
export const redisConfig = RedisConfig.getInstance();
export const redis = redisConfig.getClient();