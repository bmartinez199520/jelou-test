import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task } from '../src/tasks/entities/task.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../src/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

describe('TasksController (e2e)', () => {
  let app: INestApplication;
  let taskRepository: Repository<Task>;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    
    await app.init();

    taskRepository = moduleFixture.get(getRepositoryToken(Task));
    userRepository = moduleFixture.get(getRepositoryToken(User));
    jwtService = moduleFixture.get(JwtService);

    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const testUser = await userRepository.save({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
    });

    // Generate JWT token for test user
    authToken = jwtService.sign({ sub: testUser.id, username: testUser.username });

    // Clean up task repository before tests
    await taskRepository.clear();
  });

  afterAll(async () => {
    await taskRepository.clear();
    await userRepository.clear();
    await app.close();
  });

  describe('/tasks (GET)', () => {
    it('should return empty array when no tasks', () => {
      return request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect([]);
    });

    it('should return tasks array', async () => {
      // Create a task first
      const task = await taskRepository.save({
        title: 'Test Task',
        description: 'Test description',
        completed: false,
      });

      return request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Array);
          expect(res.body.length).toBe(1);
          expect(res.body[0].id).toBe(task.id);
          expect(res.body[0].title).toBe(task.title);
        });
    });
  });

  describe('/tasks (POST)', () => {
    it('should create a new task', () => {
      const newTask = {
        title: 'New Task',
        description: 'New Description',
        completed: false,
      };

      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newTask)
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.title).toBe(newTask.title);
          expect(res.body.description).toBe(newTask.description);
          expect(res.body.completed).toBe(newTask.completed);
        });
    });

    it('should validate request body', () => {
      const invalidTask = {
        // Missing title
        description: 'Invalid task without title',
        completed: false,
        extraField: 'This should be rejected',
      };

      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidTask)
        .expect(400);
    });
  });

  describe('/tasks/:id (GET)', () => {
    it('should return a task by id', async () => {
      const task = await taskRepository.save({
        title: 'Get by ID Task',
        description: 'Test getting by ID',
        completed: false,
      });

      return request(app.getHttpServer())
        .get(`/tasks/${task.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(task.id);
          expect(res.body.title).toBe(task.title);
        });
    });

    it('should return 404 for non-existent task', () => {
      return request(app.getHttpServer())
        .get('/tasks/9999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/tasks/:id (PATCH)', () => {
    it('should update a task', async () => {
      const task = await taskRepository.save({
        title: 'Task to Update',
        description: 'Will be updated',
        completed: false,
      });

      const updateData = {
        title: 'Updated Task Title',
        completed: true,
      };

      return request(app.getHttpServer())
        .patch(`/tasks/${task.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(task.id);
          expect(res.body.title).toBe(updateData.title);
          expect(res.body.completed).toBe(updateData.completed);
          expect(res.body.description).toBe(task.description);
        });
    });

    it('should return 404 for updating non-existent task', () => {
      return request(app.getHttpServer())
        .patch('/tasks/9999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Title' })
        .expect(404);
    });
  });

  describe('/tasks/:id (DELETE)', () => {
    it('should delete a task', async () => {
      const task = await taskRepository.save({
        title: 'Task to Delete',
        description: 'Will be deleted',
        completed: false,
      });

      await request(app.getHttpServer())
        .delete(`/tasks/${task.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify task was deleted
      return request(app.getHttpServer())
        .get(`/tasks/${task.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 404 for deleting non-existent task', () => {
      return request(app.getHttpServer())
        .delete('/tasks/9999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
