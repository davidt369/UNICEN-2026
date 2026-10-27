import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty({ message: 'La sigla/código de la materia es obligatoria (ej. IIA-101).' })
  code: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre de la materia es obligatorio.' })
  name: string;

  @Type(() => Number)
  @IsInt({ message: 'Los créditos deben ser un número entero.' })
  @Min(1)
  @Max(12)
  credits: number;

  @Type(() => Number)
  @IsInt({ message: 'El semestre debe ser un número entero.' })
  @Min(1)
  @Max(12)
  semesterLevel: number;

  @Type(() => Number)
  @IsInt({ message: 'Las horas semanales deben ser un número entero.' })
  @Min(1)
  @Max(20)
  hoursPerWeek: number;

  @Type(() => Number)
  @IsInt({ message: 'Debe seleccionar una carrera válida.' })
  careerId: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateSubjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  credits?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  semesterLevel?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  hoursPerWeek?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  careerId?: number;

  @IsOptional()
  @IsString()
  description?: string;
}
