import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './controllers/tasks.controller';
import { TasksService } from './services/tasks.service';
import { Task } from './entities/task.entity';
import { TaskRepository } from './repositories/task.repository';
import { RedisCacheModule } from '../cache/redis-cache.module';

@Module({
  imports: [TypeOrmModule.forFeature([Task]), RedisCacheModule],
  controllers: [TasksController],
  providers: [TasksService, TaskRepository],
  exports: [TasksService],
})
export class TasksModule {}
