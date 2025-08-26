import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly redisClient: Redis;

  constructor(private readonly configService: ConfigService) {
    const redisConfig =
      this.configService.get<{
        host?: string;
        port?: number;
        password?: string;
      }>('redis') || {};

    this.redisClient = new Redis({
      host: redisConfig.host ?? 'redis',
      port: redisConfig.port ?? 6379,
      password: redisConfig.password ?? undefined,
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redisClient.get(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    const stringValue = JSON.stringify(value);
    if (ttlMs) {
      await this.redisClient.set(key, stringValue, 'PX', ttlMs);
    } else {
      await this.redisClient.set(key, stringValue);
    }
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async deleteKeysByPattern(pattern: string): Promise<void> {
    try {
      const keys: string[] = await this.redisClient.keys(pattern);
      if (keys.length > 0) {
        await this.redisClient.del(...keys);
        this.logger.log(`Deleted ${keys.length} keys for pattern ${pattern}`);
      }
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Error deleting keys by pattern ${pattern}: ${err.message || 'Unknown error'}`,
        err.stack,
      );
    }
  }

  async disconnect(): Promise<void> {
    await this.redisClient.quit();
  }
}
