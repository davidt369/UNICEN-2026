import { ScheduleBlockEntity } from '../../course-offerings/domain/course-offerings.repository.interface';

export const ENROLLMENT_REPOSITORY = 'ENROLLMENT_REPOSITORY';

export interface EnrollmentDetailEntity {
  id: number;
  studentId: number;
  studentName: string;
  studentRegistrationNumber: string;
  studentEmail: string;
  courseOfferingId: number;
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  credits: number;
  groupCode: string;
  teacherName: string;
  campusName: string;
  periodId: number;
  periodCode: string;
  periodName: string;
  status: 'ACTIVA' | 'RETIRADA' | 'APROBADA' | 'REPROBADA';
  finalScore: number | null;
  schedules: ScheduleBlockEntity[];
  createdAt: Date;
}

/**
 * ============================================================================
 * [PATRÓN DE DISEÑO: REPOSITORY & UNIT OF WORK (TRANSACCIONES ACID)]
 * ----------------------------------------------------------------------------
 * POR QUÉ: Inscribir a un estudiante requiere verificar cupo, duplicidad,
 *          choque de horario e incrementar el contador de inscritos de forma
 *          indivisible.
 * PARA QUÉ: Evitar condiciones de carrera (race conditions) cuando varios
 *           estudiantes intentan tomar el último cupo simultáneamente.
 * PRINCIPIO SOLID: Dependency Inversion Principle (DIP).
 * ============================================================================
 */
export interface IEnrollmentRepository {
  enrollStudentTransactional(
    studentId: number,
    courseOfferingId: number,
  ): Promise<EnrollmentDetailEntity>;
  withdrawEnrollmentTransactional(
    enrollmentId: number,
  ): Promise<{ id: number; courseOfferingId: number }>;
  findByStudent(
    studentId: number,
    periodId?: number,
  ): Promise<EnrollmentDetailEntity[]>;
  findByCourseOffering(
    courseOfferingId: number,
  ): Promise<EnrollmentDetailEntity[]>;
  findById(enrollmentId: number): Promise<EnrollmentDetailEntity | null>;
}
