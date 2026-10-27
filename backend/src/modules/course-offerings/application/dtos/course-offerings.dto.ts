import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAcademicPeriodDto {
  @IsString()
  @IsNotEmpty({ message: 'El código de la gestión es obligatorio (ej. I-2026).' })
  code: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre de la gestión es obligatorio.' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'La fecha de inicio es obligatoria.' })
  startDate: string;

  @IsString()
  @IsNotEmpty({ message: 'La fecha de cierre es obligatoria.' })
  endDate: string;

  @IsBoolean()
  enrollmentsOpen: boolean;

  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;
}

export class TogglePeriodEnrollmentsDto {
  @IsBoolean({ message: 'Debe indicar si las inscripciones están abiertas (true/false).' })
  enrollmentsOpen: boolean;
}

export class ScheduleBlockDto {
  @IsEnum(['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'], {
    message: 'El día debe ser válido (LUNES a SABADO).',
  })
  dayOfWeek: 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO';

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'La hora de inicio debe tener formato HH:mm (ej. 08:00).',
  })
  startTime: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'La hora de fin debe tener formato HH:mm (ej. 10:00).',
  })
  endTime: string;

  @IsString()
  @IsNotEmpty({ message: 'El aula o laboratorio es obligatorio.' })
  classroom: string;
}

export class EvaluationItemDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la evaluación es obligatorio.' })
  name: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'La ponderación mínima es 1%.' })
  @Max(100, { message: 'La ponderación máxima es 100%.' })
  weightPercentage: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  orderIndex?: number;
}

export class CreateCourseOfferingDto {
  @Type(() => Number)
  @IsInt({ message: 'Debe seleccionar una materia válida.' })
  subjectId: number;

  @Type(() => Number)
  @IsInt({ message: 'Debe seleccionar una gestión académica válida.' })
  periodId: number;

  @Type(() => Number)
  @IsInt({ message: 'Debe asignar un docente válido.' })
  teacherId: number;

  @Type(() => Number)
  @IsInt({ message: 'Debe seleccionar una sede universitaria válida.' })
  campusId: number;

  @IsString()
  @IsNotEmpty({ message: 'El paralelo o grupo es obligatorio (ej. Paralelo A).' })
  groupCode: string;

  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'El cupo máximo debe ser al menos 1 estudiante.' })
  @Max(150, { message: 'El cupo máximo por aula no puede exceder 150 estudiantes.' })
  maxQuota: number;

  @IsOptional()
  @IsString()
  modality?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'El curso debe tener al menos un bloque de horario asignado.' })
  @ValidateNested({ each: true })
  @Type(() => ScheduleBlockDto)
  schedules: ScheduleBlockDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvaluationItemDto)
  evaluations?: EvaluationItemDto[];
}

export class UpdateCourseEvaluationsDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe definir al menos una evaluación.' })
  @ValidateNested({ each: true })
  @Type(() => EvaluationItemDto)
  evaluations: EvaluationItemDto[];
}
