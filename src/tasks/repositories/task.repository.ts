import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from '../entities/task.entity';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';

@Injectable()
export class TaskRepository {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async findAll(
    status?: 'pending' | 'completed',
    page = 1,
    limit = 10,
  ): Promise<[Task[], number]> {
    const query = this.taskRepository.createQueryBuilder('task');

    if (status) {
      query.where('task.status = :status', { status });
    }

    query.andWhere('task.deletedAt IS NULL');
    query.skip((page - 1) * limit);
    query.take(limit);
    query.orderBy('task.createdAt', 'DESC');

    return query.getManyAndCount();
  }

  async findOne(id: number): Promise<Task | null> {
    return this.taskRepository.findOneBy({ id });
  }

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const task = this.taskRepository.create(createTaskDto);
    return this.taskRepository.save(task);
  }

  async update(id: number, updateTaskDto: UpdateTaskDto): Promise<Task | null> {
    await this.taskRepository.update(id, updateTaskDto);
    return this.findOne(id);
  }

  async softDelete(id: number): Promise<void> {
    await this.taskRepository.softDelete(id);
  }

  async permanentDelete(id: number): Promise<void> {
    await this.taskRepository.delete(id);
  }

  async getTasksCount(): Promise<{ completed: number; pending: number }> {
    const completed = await this.taskRepository.count({
      where: { status: 'completed' },
      withDeleted: false,
    });
    const pending = await this.taskRepository.count({
      where: { status: 'pending' },
      withDeleted: false,
    });
    return { completed, pending };
  }

  async restore(id: number): Promise<Task | null> {
    await this.taskRepository.restore(id);
    return this.findOne(id);
  }
}
