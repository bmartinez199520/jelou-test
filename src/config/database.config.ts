import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export default (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: configService.get<string>('config.database.DB_HOST') ?? 'mysql',
  port: configService.get<number>('config.database.DB_PORT') ?? 3306,
  username: configService.get<string>('config.database.DB_USERNAME') ?? 'root',
  password: configService.get<string>('config.database.DB_PASSWORD') ?? 'root',
  database: configService.get<string>('config.database.DB_DATABASE') ?? 'jelou',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  migrationsRun: true,
  synchronize: false,
  logging: true,
});
