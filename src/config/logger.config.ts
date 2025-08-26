import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import 'winston-mongodb';

export const loggerConfig = WinstonModule.createLogger({
  transports: [
    new winston.transports.File({
      filename: 'logs/app.log',
      level: 'info',
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),

    new winston.transports.MongoDB({
      level: 'info',
      db: 'mongodb://mongodb:27017/logsdb',
      options: { useUnifiedTopology: true },
      collection: 'app_logs',
    }),

    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});
