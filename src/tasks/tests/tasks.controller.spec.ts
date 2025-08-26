import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from '../controllers/tasks.controller';
import { TasksService } from '../services/tasks.service';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

const mockJwtService = {
  sign: jest.fn(),
};

const mockTasksService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  permanentDelete: jest.fn(),
  restore: jest.fn(),
};

describe('TasksController', () => {
  let controller: TasksController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('debe crear una nueva tarea', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Nueva tarea',
        description: 'Descripción de la tarea',
      };

      const expectedResult = {
        id: 1,
        title: 'Nueva tarea',
        description: 'Descripción de la tarea',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockTasksService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createTaskDto);

      expect(result).toEqual(expectedResult);
      expect(mockTasksService.create).toHaveBeenCalledWith(createTaskDto);
    });
  });

  describe('findAll', () => {
    it('debe obtener todas las tareas con paginación por defecto', async () => {
      const expectedResult = {
        tasks: [
          {
            id: 1,
            title: 'Tarea 1',
            description: 'Descripción 1',
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        counters: { completed: 0, pending: 1 },
      };

      mockTasksService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(result).toEqual(expectedResult);
      expect(mockTasksService.findAll).toHaveBeenCalledWith(undefined, 1, 10);
    });

    it('debe filtrar tareas por estado y usar parámetros de paginación', async () => {
      const status = 'completed';
      const page = '2';
      const limit = '5';

      const expectedResult = {
        tasks: [
          {
            id: 2,
            title: 'Tarea 2',
            description: 'Descripción 2',
            status: 'completed',
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          },
        ],
        total: 1,
        page: 2,
        limit: 5,
        totalPages: 1,
        counters: { completed: 1, pending: 0 },
      };

      mockTasksService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(status, +page, +limit);

      expect(result).toEqual(expectedResult);
      expect(mockTasksService.findAll).toHaveBeenCalledWith(
        status,
        +page,
        +limit,
      );
    });
  });

  describe('findOne', () => {
    it('debe obtener una tarea por ID', async () => {
      const taskId = '1';
      const expectedResult = {
        id: 1,
        title: 'Tarea 1',
        description: 'Descripción 1',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockTasksService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(taskId);

      expect(result).toEqual(expectedResult);
      expect(mockTasksService.findOne).toHaveBeenCalledWith(+taskId);
    });

    it('debe propagar la excepción si la tarea no existe', async () => {
      const taskId = '999';

      mockTasksService.findOne.mockRejectedValue(
        new NotFoundException(`Task with ID ${taskId} not found`),
      );

      await expect(controller.findOne(taskId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockTasksService.findOne).toHaveBeenCalledWith(+taskId);
    });
  });

  describe('update', () => {
    it('debe actualizar una tarea existente', async () => {
      const taskId = '1';
      const updateTaskDto: UpdateTaskDto = {
        title: 'Título actualizado',
        description: 'Descripción actualizada',
      };

      const expectedResult = {
        id: 1,
        title: 'Título actualizado',
        description: 'Descripción actualizada',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockTasksService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(taskId, updateTaskDto);

      expect(result).toEqual(expectedResult);
      expect(mockTasksService.update).toHaveBeenCalledWith(
        +taskId,
        updateTaskDto,
      );
    });
  });

  describe('softDelete', () => {
    it('debe eliminar temporalmente una tarea', async () => {
      const taskId = '1';

      mockTasksService.softDelete.mockResolvedValue(undefined);

      await controller.softDelete(taskId);

      expect(mockTasksService.softDelete).toHaveBeenCalledWith(+taskId);
    });
  });

  describe('permanentDelete', () => {
    it('debe eliminar permanentemente una tarea', async () => {
      const taskId = '1';

      mockTasksService.permanentDelete.mockResolvedValue(undefined);

      await controller.permanentDelete(taskId);

      expect(mockTasksService.permanentDelete).toHaveBeenCalledWith(+taskId);
    });
  });

  describe('restore', () => {
    it('debe restaurar una tarea eliminada', async () => {
      const taskId = '1';
      const expectedResult = {
        id: 1,
        title: 'Tarea restaurada',
        description: 'Descripción de la tarea',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockTasksService.restore.mockResolvedValue(expectedResult);

      const result = await controller.restore(taskId);

      expect(result).toEqual(expectedResult);
      expect(mockTasksService.restore).toHaveBeenCalledWith(+taskId);
    });
  });
});
