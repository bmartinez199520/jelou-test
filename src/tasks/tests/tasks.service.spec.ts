import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from '../services/tasks.service';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { NotFoundException } from '@nestjs/common';
import { RedisCacheService } from '../../cache/redis-cache.service';
import { TaskRepository } from '../repositories/task.repository';

// Mock del repositorio de tareas
const mockTaskRepository = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  permanentDelete: jest.fn(),
  restore: jest.fn(),
  getTasksCount: jest.fn(),
};

// Mock del servicio de caché Redis
const mockRedisCacheService = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  deleteKeysByPattern: jest.fn(),
};

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    // Resetear todos los mocks antes de cada prueba
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: TaskRepository,
          useValue: mockTaskRepository,
        },
        {
          provide: RedisCacheService,
          useValue: mockRedisCacheService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  // PRUEBAS PARA EL MÉTODO CREATE
  describe('create', () => {
    it('debe crear una nueva tarea', async () => {
      // Datos de prueba
      const createTaskDto: CreateTaskDto = {
        title: 'Nueva tarea',
        description: 'Descripción de la tarea',
      };

      const expectedTask = {
        id: 1,
        title: 'Nueva tarea',
        description: 'Descripción de la tarea',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      // Configurar el mock
      mockTaskRepository.create.mockResolvedValue(expectedTask);

      // Ejecutar el método
      const result = await service.create(createTaskDto);

      // Verificaciones
      expect(result).toEqual(expectedTask);
      expect(mockTaskRepository.create).toHaveBeenCalledWith(createTaskDto);
      expect(mockRedisCacheService.deleteKeysByPattern).toHaveBeenCalledWith(
        'all-tasks-*',
      );
    });
  });

  // PRUEBAS PARA EL MÉTODO FINDALL
  describe('findAll', () => {
    it('debe obtener todas las tareas con paginación por defecto', async () => {
      // Datos de prueba
      const tasks = [
        {
          id: 1,
          title: 'Tarea 1',
          description: 'Descripción 1',
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      const counters = { completed: 0, pending: 1 };

      // Configurar los mocks
      mockRedisCacheService.get.mockResolvedValue(null); // No hay caché
      mockTaskRepository.findAll.mockResolvedValue([tasks, 1]); // 1 tarea, 1 total
      mockTaskRepository.getTasksCount.mockResolvedValue(counters);

      // Ejecutar el método
      const result = await service.findAll();

      // Verificaciones
      expect(result).toEqual({
        tasks,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        counters,
      });
      expect(mockTaskRepository.findAll).toHaveBeenCalledWith(undefined, 1, 10);
      expect(mockRedisCacheService.set).toHaveBeenCalled();
    });

    it('debe devolver datos desde caché si están disponibles', async () => {
      // Datos de prueba desde caché
      const cachedResult = {
        tasks: [
          {
            id: 1,
            title: 'Tarea en caché',
            description: 'Descripción en caché',
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

      // Configurar el mock de caché para devolver datos
      mockRedisCacheService.get.mockResolvedValue(cachedResult);

      // Ejecutar el método
      const result = await service.findAll();

      // Verificaciones
      expect(result).toEqual(cachedResult);
      expect(mockRedisCacheService.get).toHaveBeenCalled();
      expect(mockTaskRepository.findAll).not.toHaveBeenCalled(); // No debería llamar al repositorio
    });

    it('debe filtrar tareas por estado', async () => {
      // Datos de prueba
      const status = 'completed';
      const tasks = [
        {
          id: 2,
          title: 'Tarea completada',
          description: 'Esta tarea está completada',
          status: 'completed',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      const counters = { completed: 1, pending: 0 };

      // Configurar los mocks
      mockRedisCacheService.get.mockResolvedValue(null); // No hay caché
      mockTaskRepository.findAll.mockResolvedValue([tasks, 1]); // 1 tarea, 1 total
      mockTaskRepository.getTasksCount.mockResolvedValue(counters);

      // Ejecutar el método
      const result = await service.findAll(status);

      // Verificaciones
      expect(result.tasks).toEqual(tasks);
      expect(mockTaskRepository.findAll).toHaveBeenCalledWith(status, 1, 10);
    });
  });

  // PRUEBAS PARA EL MÉTODO FINDONE
  describe('findOne', () => {
    it('debe obtener una tarea por ID', async () => {
      // Datos de prueba
      const taskId = 1;
      const expectedTask = {
        id: taskId,
        title: 'Tarea 1',
        description: 'Descripción 1',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      // Configurar los mocks
      mockRedisCacheService.get.mockResolvedValue(null); // No hay caché
      mockTaskRepository.findOne.mockResolvedValue(expectedTask);

      // Ejecutar el método
      const result = await service.findOne(taskId);

      // Verificaciones
      expect(result).toEqual(expectedTask);
      expect(mockRedisCacheService.get).toHaveBeenCalledWith(
        `task-by-id-${taskId}`,
      );
      expect(mockTaskRepository.findOne).toHaveBeenCalledWith(taskId);
      expect(mockRedisCacheService.set).toHaveBeenCalledWith(
        `task-by-id-${taskId}`,
        expectedTask,
        expect.any(Number),
      );
    });

    it('debe devolver una tarea desde caché si está disponible', async () => {
      // Datos de prueba
      const taskId = 1;
      const cachedTask = {
        id: taskId,
        title: 'Tarea en caché',
        description: 'Esta tarea viene de la caché',
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      // Configurar el mock de caché
      mockRedisCacheService.get.mockResolvedValue(cachedTask);

      // Ejecutar el método
      const result = await service.findOne(taskId);

      // Verificaciones
      expect(result).toEqual(cachedTask);
      expect(mockRedisCacheService.get).toHaveBeenCalledWith(
        `task-by-id-${taskId}`,
      );
      expect(mockTaskRepository.findOne).not.toHaveBeenCalled(); // No debería llamar al repositorio
    });

    it('debe lanzar NotFoundException si la tarea no existe', async () => {
      // Datos de prueba
      const taskId = 999; // ID que no existe

      // Configurar los mocks
      mockRedisCacheService.get.mockResolvedValue(null); // No hay caché
      mockTaskRepository.findOne.mockResolvedValue(null); // No hay tarea

      // Verificar que se lanza la excepción
      await expect(service.findOne(taskId)).rejects.toThrow(NotFoundException);
      expect(mockRedisCacheService.get).toHaveBeenCalledWith(
        `task-by-id-${taskId}`,
      );
      expect(mockTaskRepository.findOne).toHaveBeenCalledWith(taskId);
    });
  });

  // PRUEBAS PARA EL MÉTODO UPDATE
  describe('update', () => {
    it('debe actualizar una tarea existente', async () => {
      // Datos de prueba
      const taskId = 1;
      const updateTaskDto: UpdateTaskDto = {
        title: 'Título actualizado',
        description: 'Descripción actualizada',
      };

      const existingTask = {
        id: taskId,
        title: 'Título original',
        description: 'Descripción original',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const updatedTask = {
        ...existingTask,
        ...updateTaskDto,
      };

      // Configurar los mocks
      mockRedisCacheService.get.mockResolvedValue(null);
      mockTaskRepository.findOne.mockResolvedValue(existingTask);
      mockTaskRepository.update.mockResolvedValue(updatedTask);

      // Ejecutar el método
      const result = await service.update(taskId, updateTaskDto);

      // Verificaciones
      expect(result).toEqual(updatedTask);
      expect(mockTaskRepository.findOne).toHaveBeenCalledWith(taskId);
      expect(mockTaskRepository.update).toHaveBeenCalledWith(
        taskId,
        updateTaskDto,
      );
      expect(mockRedisCacheService.del).toHaveBeenCalledWith(
        `task-by-id-${taskId}`,
      );
      expect(mockRedisCacheService.deleteKeysByPattern).toHaveBeenCalledWith(
        'all-tasks-*',
      );
    });

    it('debe lanzar NotFoundException si la tarea a actualizar no existe', async () => {
      // Datos de prueba
      const taskId = 999;
      const updateTaskDto: UpdateTaskDto = { title: 'Actualización' };

      // Configurar los mocks para simular que la tarea no existe
      mockRedisCacheService.get.mockResolvedValue(null);
      mockTaskRepository.findOne.mockResolvedValue(null);

      // Verificar que se lanza la excepción
      await expect(service.update(taskId, updateTaskDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // PRUEBAS PARA EL MÉTODO SOFTDELETE
  describe('softDelete', () => {
    it('debe eliminar temporalmente una tarea', async () => {
      // Datos de prueba
      const taskId = 1;
      const existingTask = {
        id: taskId,
        title: 'Tarea a eliminar',
        description: 'Esta tarea será eliminada',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      // Configurar los mocks
      mockRedisCacheService.get.mockResolvedValue(null);
      mockTaskRepository.findOne.mockResolvedValue(existingTask);
      mockTaskRepository.softDelete.mockResolvedValue({ affected: 1 });

      // Ejecutar el método
      await service.softDelete(taskId);

      // Verificaciones
      expect(mockTaskRepository.findOne).toHaveBeenCalledWith(taskId);
      expect(mockTaskRepository.softDelete).toHaveBeenCalledWith(taskId);
      expect(mockRedisCacheService.del).toHaveBeenCalledWith(
        `task-by-id-${taskId}`,
      );
      expect(mockRedisCacheService.deleteKeysByPattern).toHaveBeenCalledWith(
        'all-tasks-*',
      );
    });
  });

  // PRUEBAS PARA EL MÉTODO PERMANENTDELETE
  describe('permanentDelete', () => {
    it('debe eliminar permanentemente una tarea', async () => {
      // Datos de prueba
      const taskId = 1;
      const existingTask = {
        id: taskId,
        title: 'Tarea a eliminar permanentemente',
        description: 'Esta tarea será eliminada permanentemente',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      // Configurar los mocks
      mockRedisCacheService.get.mockResolvedValue(null);
      mockTaskRepository.findOne.mockResolvedValue(existingTask);

      // Ejecutar el método
      await service.permanentDelete(taskId);

      // Verificaciones
      expect(mockTaskRepository.findOne).toHaveBeenCalledWith(taskId);
      expect(mockTaskRepository.permanentDelete).toHaveBeenCalledWith(taskId);
      expect(mockRedisCacheService.del).toHaveBeenCalledWith(
        `task-by-id-${taskId}`,
      );
      expect(mockRedisCacheService.deleteKeysByPattern).toHaveBeenCalledWith(
        'all-tasks-*',
      );
    });
  });

  // PRUEBAS PARA EL MÉTODO RESTORE
  describe('restore', () => {
    it('debe restaurar una tarea eliminada', async () => {
      // Datos de prueba
      const taskId = 1;
      const restoredTask = {
        id: taskId,
        title: 'Tarea restaurada',
        description: 'Esta tarea ha sido restaurada',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      // Configurar el mock
      mockTaskRepository.restore.mockResolvedValue(restoredTask);

      // Ejecutar el método
      const result = await service.restore(taskId);

      // Verificaciones
      expect(result).toEqual(restoredTask);
      expect(mockTaskRepository.restore).toHaveBeenCalledWith(taskId);
      expect(mockRedisCacheService.del).toHaveBeenCalledWith(
        `task-by-id-${taskId}`,
      );
      expect(mockRedisCacheService.deleteKeysByPattern).toHaveBeenCalledWith(
        'all-tasks-*',
      );
    });
  });

  // PRUEBAS PARA EL MÉTODO GETTASKSCOUNT
  describe('getTasksCount', () => {
    it('debe obtener el conteo de tareas por estado', async () => {
      // Datos de prueba
      const counters = { completed: 5, pending: 10 };

      // Configurar el mock
      mockTaskRepository.getTasksCount.mockResolvedValue(counters);

      // Ejecutar el método
      const result = await service.getTasksCount();

      // Verificaciones
      expect(result).toEqual(counters);
      expect(mockTaskRepository.getTasksCount).toHaveBeenCalled();
    });
  });
});
