import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'El email del usuario',
    example: 'usuario@example.com',
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'La contraseña del usuario (mínimo 6 caracteres)',
    example: 'password123',
    required: true,
    minLength: 6,
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
