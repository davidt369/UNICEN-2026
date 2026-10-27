import { ScheduleBlockEntity } from '../../course-offerings/domain/course-offerings.repository.interface';

export interface EnrolledCourseScheduleContext {
  courseOfferingId: number;
  subjectCode: string;
  subjectName: string;
  groupCode: string;
  schedules: ScheduleBlockEntity[];
}

export interface ScheduleConflictResult {
  hasConflict: boolean;
  conflictMessage?: string;
}

/**
 * ============================================================================
 * [SERVICIO DE DOMINIO PURO: VALIDADOR DE CHOQUE DE HORARIOS]
 * ----------------------------------------------------------------------------
 * POR QUÉ: La detección de solapamiento de horarios es una regla matemática
 *          pura del negocio universitario que no depende de HTTP ni de SQL.
 * PARA QUÉ: Evaluar en memoria y probar unitariamente la invariante de
 *           incompatibilidad horaria (`inicioA < finB && finA > inicioB` en el
 *           mismo día) antes de confirmar una inscripción.
 * PRINCIPIOS SOLID: Single Responsibility (SRP) y Pure Domain Logic.
 * ============================================================================
 */
export class ScheduleConflictValidator {
  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  }

  static checkConflict(
    candidateSchedules: ScheduleBlockEntity[],
    existingCourses: EnrolledCourseScheduleContext[],
  ): ScheduleConflictResult {
    for (const candidate of candidateSchedules) {
      const candStart = this.timeToMinutes(candidate.startTime);
      const candEnd = this.timeToMinutes(candidate.endTime);

      for (const existing of existingCourses) {
        for (const exBlock of existing.schedules) {
          if (candidate.dayOfWeek !== exBlock.dayOfWeek) continue;

          const exStart = this.timeToMinutes(exBlock.startTime);
          const exEnd = this.timeToMinutes(exBlock.endTime);

          // Condición matemática de intersección de intervalos abiertos: [candStart, candEnd) n [exStart, exEnd) != vacio
          if (candStart < exEnd && candEnd > exStart) {
            return {
              hasConflict: true,
              conflictMessage: `Choque de horario el día ${candidate.dayOfWeek} (${candidate.startTime} - ${candidate.endTime}) con la materia inscrita "${existing.subjectCode} - ${existing.subjectName}" (${existing.groupCode}, horario ${exBlock.startTime} - ${exBlock.endTime}).`,
            };
          }
        }
      }
    }

    return { hasConflict: false };
  }
}
