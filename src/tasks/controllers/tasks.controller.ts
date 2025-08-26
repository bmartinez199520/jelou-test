import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { TasksService } from '../services/tasks.service';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { Task } from '../entities/task.entity';

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva tarea' })
  @ApiBody({ type: CreateTaskDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'La tarea ha sido creada exitosamente',
    type: Task,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos inválidos',
  })
  async create(@Body() createTaskDto: CreateTaskDto) {
    const result = await this.tasksService.create(createTaskDto);
    return result;
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las tareas' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'completed'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tareas encontradas',
    type: [Task],
  })
  findAll(
    @Query('status') status?: 'pending' | 'completed',
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.tasksService.findAll(status, +page, +limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una tarea por ID' })
  @ApiParam({ name: 'id', description: 'ID de la tarea' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tarea encontrada',
    type: Task,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tarea no encontrada',
  })
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una tarea' })
  @ApiParam({ name: 'id', description: 'ID de la tarea' })
  @ApiBody({ type: UpdateTaskDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tarea actualizada correctamente',
    type: Task,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tarea no encontrada',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos inválidos',
  })
  async update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    const result = await this.tasksService.update(+id, updateTaskDto);
    return result;
  }

  @Delete(':id/soft')
  @ApiOperation({ summary: 'Eliminar una tarea (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID de la tarea' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tarea eliminada temporalmente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tarea no encontrada',
  })
  async softDelete(@Param('id') id: string) {
    const result = await this.tasksService.softDelete(+id);
    return result;
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Eliminar una tarea permanentemente' })
  @ApiParam({ name: 'id', description: 'ID de la tarea' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tarea eliminada permanentemente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tarea no encontrada',
  })
  async permanentDelete(@Param('id') id: string) {
    const result = await this.tasksService.permanentDelete(+id);
    return result;
  }

  @Put(':id/restore')
  @ApiOperation({ summary: 'Restaurar una tarea eliminada' })
  @ApiParam({ name: 'id', description: 'ID de la tarea' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tarea restaurada correctamente',
    type: Task,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tarea no encontrada',
  })
  async restore(@Param('id') id: string) {
    const result = await this.tasksService.restore(+id);
    return result;
  }
}
