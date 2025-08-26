import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { TaskRepository } from '../repositories/task.repository';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { Task } from '../entities/task.entity';
import { RedisCacheService } from '../../cache/redis-cache.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  private readonly CACHE_TTL = 60_000;

  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly redisCache: RedisCacheService,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const newTask = await this.taskRepository.create(createTaskDto);
    await this.invalidateTasksCache();
    return newTask;
  }

  async findAll(
    status?: 'pending' | 'completed',
    page = 1,
    limit = 10,
  ): Promise<{
    tasks: Task[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    counters: { completed: number; pending: number };
  }> {
    const cacheKey = `all-tasks-${status ?? 'all'}-page-${page}-limit-${limit}`;

    const cachedData = await this.redisCache.get<{
      tasks: Task[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      counters: { completed: number; pending: number };
    }>(cacheKey);
    if (cachedData) {
      this.logger.log(`Returning tasks from cache: ${cacheKey}`);
      return cachedData;
    }

    this.logger.log(`Fetching tasks from database: ${cacheKey}`);
    const [tasks, total] = await this.taskRepository.findAll(
      status,
      page,
      limit,
    );
    const totalPages = Math.ceil(total / limit);

    const counters = await this.taskRepository.getTasksCount();

    const result = {
      tasks,
      total,
      page,
      limit,
      totalPages,
      counters,
    };

    await this.redisCache.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  async findOne(id: number): Promise<Task> {
    const cacheKey = `task-by-id-${id}`;

    const cachedTask = await this.redisCache.get<Task>(cacheKey);
    if (cachedTask) {
      this.logger.log(`Returning task ${id} from cache`);
      return cachedTask;
    }

    this.logger.log(`Fetching task ${id} from database`);
    const task = await this.taskRepository.findOne(id);
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    await this.redisCache.set(cacheKey, task, this.CACHE_TTL);

    return task;
  }

  async update(id: number, updateTaskDto: UpdateTaskDto): Promise<Task | null> {
    await this.findOne(id);
    const updatedTask = await this.taskRepository.update(id, updateTaskDto);

    await this.invalidateTaskCache(id);
    await this.invalidateTasksCache();

    return updatedTask;
  }

  async softDelete(id: number): Promise<void> {
    await this.findOne(id);
    await this.taskRepository.softDelete(id);

    await this.invalidateTaskCache(id);
    await this.invalidateTasksCache();
  }

  async permanentDelete(id: number): Promise<void> {
    await this.findOne(id);
    await this.taskRepository.permanentDelete(id);

    await this.invalidateTaskCache(id);
    await this.invalidateTasksCache();
  }

  async restore(id: number): Promise<Task | null> {
    const restoredTask = await this.taskRepository.restore(id);

    await this.invalidateTaskCache(id);
    await this.invalidateTasksCache();

    return restoredTask;
  }

  async getTasksCount(): Promise<{ completed: number; pending: number }> {
    return this.taskRepository.getTasksCount();
  }

  private async invalidateTaskCache(id: number): Promise<void> {
    const cacheKey = `task-by-id-${id}`;
    await this.redisCache.del(cacheKey);
    this.logger.log(`Invalidated cache for task ${id}`);
  }

  private async invalidateTasksCache(): Promise<void> {
    try {
      await this.redisCache.deleteKeysByPattern('all-tasks-*');
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Error invalidating tasks cache: ${err.message || 'Unknown error'}`,
        err.stack,
      );
    }
  }
}
