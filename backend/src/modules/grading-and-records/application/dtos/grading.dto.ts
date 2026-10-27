import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RecordGradeDto {
  @Type(() => Number)
  @IsInt({ message: 'El ID de la inscripción debe ser un entero válido.' })
  enrollmentId: number;

  @Type(() => Number)
  @IsInt({ message: 'El ID de la evaluación debe ser un entero válido.' })
  evaluationId: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'La calificación debe ser un valor numérico.' })
  @Min(0, { message: 'La calificación mínima permitida en SIIA UNICEN es 0 puntos.' })
  @Max(100, { message: 'La calificación máxima permitida en SIIA UNICEN es 100 puntos.' })
  score: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}
