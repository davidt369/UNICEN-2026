export const COURSE_OFFERINGS_REPOSITORY = 'COURSE_OFFERINGS_REPOSITORY';

export type DayOfWeek =
  | 'LUNES'
  | 'MARTES'
  | 'MIERCOLES'
  | 'JUEVES'
  | 'VIERNES'
  | 'SABADO';

export interface AcademicPeriodEntity {
  id: number;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  enrollmentsOpen: boolean;
  isCurrent: boolean;
  isActive: boolean;
}

export interface ScheduleBlockEntity {
  id: number;
  courseOfferingId: number;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  classroom: string;
}

export interface EvaluationConfigEntity {
  id: number;
  courseOfferingId: number;
  name: string;
  weightPercentage: number;
  orderIndex: number;
}

export interface CourseOfferingDetailEntity {
  id: number;
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  credits: number;
  semesterLevel: number;
  careerId: number;
  careerName: string;
  periodId: number;
  periodCode: string;
  periodName: string;
  enrollmentsOpen: boolean;
  teacherId: number;
  teacherName: string;
  teacherEmail: string;
  campusId: number;
  campusName: string;
  groupCode: string;
  maxQuota: number;
  enrolledCount: number;
  availableQuota: number;
  modality: string;
  schedules: ScheduleBlockEntity[];
  evaluations: EvaluationConfigEntity[];
  isActive: boolean;
}

export interface CreateCourseOfferingInput {
  subjectId: number;
  periodId: number;
  teacherId: number;
  campusId: number;
  groupCode: string;
  maxQuota: number;
  modality: string;
  schedules: Array<{
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    classroom: string;
  }>;
  evaluations?: Array<{
    name: string;
    weightPercentage: number;
    orderIndex: number;
  }>;
}

/**
 * ============================================================================
 * [PATRÓN DE DISEÑO: REPOSITORY & FACTORY DE OFERTA ACADÉMICA]
 * ----------------------------------------------------------------------------
 * POR QUÉ: La creación de un curso ofertado requiere persistir atómicamente
 *          el curso, sus bloques horarios y su estructura de evaluaciones
 *          ponderadas dinámicas.
 * PARA QUÉ: Garantizar la integridad transaccional de la oferta académica por
 *           gestión y exponer contratos limpios hacia los casos de uso.
 * ============================================================================
 */
export interface ICourseOfferingsRepository {
  findAllPeriods(): Promise<AcademicPeriodEntity[]>;
  findPeriodById(id: number): Promise<AcademicPeriodEntity | null>;
  createPeriod(data: {
    code: string;
    name: string;
    startDate: string;
    endDate: string;
    enrollmentsOpen: boolean;
    isCurrent: boolean;
  }): Promise<AcademicPeriodEntity>;
  togglePeriodEnrollments(
    id: number,
    enrollmentsOpen: boolean,
  ): Promise<AcademicPeriodEntity | null>;
  findAllOfferings(filters?: {
    periodId?: number;
    teacherId?: number;
    careerId?: number;
  }): Promise<CourseOfferingDetailEntity[]>;
  findOfferingById(id: number): Promise<CourseOfferingDetailEntity | null>;
  createOffering(
    data: CreateCourseOfferingInput,
  ): Promise<CourseOfferingDetailEntity>;
  updateEvaluations(
    courseOfferingId: number,
    evaluations: Array<{
      name: string;
      weightPercentage: number;
      orderIndex: number;
    }>,
  ): Promise<EvaluationConfigEntity[]>;
  softDeleteOffering(id: number): Promise<boolean>;
}
