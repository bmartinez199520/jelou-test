import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTaskDto {
  @ApiProperty({
    description: 'El título de la tarea',
    example: 'Actualizar documentación',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiProperty({
    description: 'Descripción detallada de la tarea',
    example: 'Actualizar la documentación del proyecto con Swagger',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Estado de la tarea',
    example: 'completed',
    required: false,
    enum: ['pending', 'completed'],
  })
  @IsOptional()
  @IsEnum(['pending', 'completed'])
  status?: 'pending' | 'completed';
}
