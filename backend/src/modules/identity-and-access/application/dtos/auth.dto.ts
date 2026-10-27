import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LoginDto {
  @IsEmail({}, { message: 'Debe proporcionar un correo institucional válido.' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio.' })
  email: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  password: string;
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'El código de registro / R.U. es obligatorio.' })
  registrationNumber: string;

  @IsString()
  @IsNotEmpty({ message: 'El número de carnet de identidad (CI/DNI) es obligatorio.' })
  dni: string;

  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido.' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio.' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener mínimo 6 caracteres.' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Los nombres son obligatorios.' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Los apellidos son obligatorios.' })
  lastName: string;

  @IsEnum(['ADMINISTRADOR', 'DOCENTE', 'ESTUDIANTE'], {
    message: 'El rol debe ser ADMINISTRADOR, DOCENTE o ESTUDIANTE.',
  })
  role: 'ADMINISTRADOR' | 'DOCENTE' | 'ESTUDIANTE';

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El ID de carrera debe ser un número entero.' })
  careerId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El ID de sede debe ser un número entero.' })
  campusId?: number;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  dni?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  careerId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  campusId?: number;
}
