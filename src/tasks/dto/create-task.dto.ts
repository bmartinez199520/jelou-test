import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({
    description: 'El título de la tarea',
    example: 'Completar informe mensual',
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Descripción detallada de la tarea',
    example: 'Incluir datos de ventas y métricas de rendimiento',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
