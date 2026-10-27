import { IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEnrollmentDto {
  @Type(() => Number)
  @IsInt({ message: 'El ID del curso ofertado debe ser un número entero válido.' })
  courseOfferingId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El ID del estudiante debe ser un número entero válido.' })
  studentId?: number;
}
