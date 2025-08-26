import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../services/users.service';
import { UserRepository } from '../repositories/user.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { User } from '../entities/user.entity';

const mockUserRepository = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  findByEmail: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear un nuevo usuario', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const expectedUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(expectedUser);

      const result = await service.create(createUserDto);

      expect(result).toEqual(expectedUser);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(createUserDto.email);
      expect(mockUserRepository.create).toHaveBeenCalledWith(createUserDto);
    });

    it('debe lanzar ConflictException si el usuario ya existe', async () => {
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      };

      const existingUser = {
        id: 1,
        email: 'existing@example.com',
        name: 'Existing User',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        new ConflictException(`User with email ${createUserDto.email} already exists`),
      );
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(createUserDto.email);
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('debe retornar un array de usuarios', async () => {
      const expectedUsers = [
        {
          id: 1,
          email: 'user1@example.com',
          name: 'User One',
          password: 'hashedpassword1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          email: 'user2@example.com',
          name: 'User Two',
          password: 'hashedpassword2',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockUserRepository.findAll.mockResolvedValue(expectedUsers);

      const result = await service.findAll();

      expect(result).toEqual(expectedUsers);
      expect(mockUserRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('debe retornar un usuario por ID', async () => {
      const userId = 1;
      const expectedUser = {
        id: userId,
        email: 'user@example.com',
        name: 'Test User',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(expectedUser);

      const result = await service.findOne(userId);

      expect(result).toEqual(expectedUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith(userId);
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      const userId = 999;

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(userId)).rejects.toThrow(
        new NotFoundException(`User with ID ${userId} not found`),
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith(userId);
    });
  });

  describe('findByEmail', () => {
    it('debe retornar un usuario por email', async () => {
      const email = 'user@example.com';
      const expectedUser = {
        id: 1,
        email: email,
        name: 'Test User',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(expectedUser);

      const result = await service.findByEmail(email);

      expect(result).toEqual(expectedUser);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
    });

    it('debe retornar null si no encuentra el usuario por email', async () => {
      const email = 'nonexistent@example.com';

      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await service.findByEmail(email);

      expect(result).toBeNull();
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
    });
  });
});
