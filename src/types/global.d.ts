import { Redis } from 'ioredis';

declare global {
  // eslint-disable-next-line no-var
  var redisConnection: Redis;

  namespace NodeJS {
    interface Global {
      redisConnection: Redis;
    }
  }
}
