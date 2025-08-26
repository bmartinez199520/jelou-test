import { config } from 'dotenv';
config();

import { registerAs } from '@nestjs/config';

export default registerAs('config', () => ({
  environment: process.env.NODE_ENV ?? 'development',
  jwt: {
    secret: process.env.JWT_SECRET ?? 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  },

  database: {
    DB_HOST: process.env.DATABASE_HOST ?? 'mysql',
    DB_PORT: process.env.DATABASE_PORT ?? 3306,
    DB_USERNAME: process.env.DATABASE_USERNAME ?? 'root',
    DB_PASSWORD: process.env.DATABASE_PASSWORD ?? 'root',
    DB_DATABASE: process.env.DATABASE_DATABASE ?? 'jelou',
  },

  redis: {
    host: 'redis',
    port: 2,
    password: '',
  },

  mongodb: {
    uri: process.env.MONGO_URI ?? 'mongodb://mongodb:27017/jelou',
  },

  logging: {
    enableFileLogging: process.env.ENABLE_FILE_LOGGING === 'true',
    enableMongoLogging: process.env.ENABLE_MONGO_LOGGING === 'true',
    logDirectory: process.env.LOG_DIRECTORY ?? 'logs',
  },

  swagger: {
    title: process.env.SWAGGER_TITLE ?? 'NestJS API',
    description: process.env.SWAGGER_DESCRIPTION ?? 'API documentation',
    version: process.env.SWAGGER_VERSION ?? '1.0.0',
  },

  node: {
    env: process.env.NODE_ENV ?? 'development',
    port: process.env.PORT ?? 3000,
  },
}));
