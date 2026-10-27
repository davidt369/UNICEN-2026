import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  numeric,
} from 'drizzle-orm/pg-core';

/**
 * ============================================================================
 * [ARQUITECTURA LIMPIA & PATRÓN MIXIN DE AUDITORÍA Y ELIMINACIÓN LÓGICA]
 * ----------------------------------------------------------------------------
 * POR QUÉ: En sistemas empresariales y universitarios (SIIA UNICEN), la pérdida
 *          física de registros (HARD DELETE) destruye la trazabilidad legal y
 *          académica de actas, inscripciones e historiales estudiantiles.
 * PARA QUÉ: Garantizar que todas las entidades del dominio soporten baja lógica
 *           universal (`isActive = false`, `deletedAt = timestamp`) y auditoría
 *           temporal (`createdAt`, `updatedAt`), aplicando el principio DRY y
 *           Single Responsibility (SRP).
 * ============================================================================
 */
export const auditAndSoftDeleteColumns = {
  isActive: boolean('is_active').default(true).notNull(),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
};

export const userRoleEnum = pgEnum('user_role', [
  'ADMINISTRADOR',
  'DOCENTE',
  'ESTUDIANTE',
]);

export const enrollmentStatusEnum = pgEnum('enrollment_status', [
  'ACTIVA',
  'RETIRADA',
  'APROBADA',
  'REPROBADA',
]);

export const dayOfWeekEnum = pgEnum('day_of_week', [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
]);

/**
 * 1. SEDES UNIVERSITARIAS (Campuses)
 * Representa las sedes oficiales de UNICEN en Bolivia (Cochabamba, La Paz, Santa Cruz).
 */
export const campusesTable = pgTable('campuses', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 120 }).notNull(),
  city: varchar('city', { length: 60 }).notNull(),
  address: varchar('address', { length: 200 }).notNull(),
  ...auditAndSoftDeleteColumns,
});

/**
 * 2. CARRERAS DE LICENCIATURA (Careers)
 * Programas oficiales de UNICEN (Salud, Empresarial, Tecnología, Social).
 */
export const careersTable = pgTable('careers', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 25 }).notNull().unique(),
  name: varchar('name', { length: 150 }).notNull(),
  area: varchar('area', { length: 80 }).notNull(), // Salud, Tecnología, Empresarial, Social
  durationSemesters: integer('duration_semesters').default(10).notNull(),
  campusId: integer('campus_id').references(() => campusesTable.id),
  ...auditAndSoftDeleteColumns,
});

/**
 * 3. USUARIOS E IDENTIDAD (Users)
 * Almacena Administradores, Docentes y Estudiantes bajo control de acceso por rol.
 */
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  registrationNumber: varchar('registration_number', { length: 40 })
    .notNull()
    .unique(), // Código SIIA / R.U. o Legajo Docente
  dni: varchar('dni', { length: 25 }).notNull(),
  email: varchar('email', { length: 120 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 80 }).notNull(),
  lastName: varchar('last_name', { length: 80 }).notNull(),
  role: userRoleEnum('role').notNull(),
  careerId: integer('career_id').references(() => careersTable.id),
  campusId: integer('campus_id').references(() => campusesTable.id),
  ...auditAndSoftDeleteColumns,
});

/**
 * 4. CATÁLOGO DE MATERIAS (Subjects)
 * Materias que conforman el plan de estudios de cada carrera.
 */
export const subjectsTable = pgTable('subjects', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 30 }).notNull().unique(),
  name: varchar('name', { length: 150 }).notNull(),
  credits: integer('credits').default(4).notNull(),
  semesterLevel: integer('semester_level').default(1).notNull(),
  hoursPerWeek: integer('hours_per_week').default(4).notNull(),
  careerId: integer('career_id')
    .references(() => careersTable.id)
    .notNull(),
  description: text('description'),
  ...auditAndSoftDeleteColumns,
});

/**
 * 5. PERÍODOS / GESTIONES ACADÉMICAS (Academic Periods)
 * Controla qué gestión está vigente y si las inscripciones están abiertas o cerradas.
 */
export const academicPeriodsTable = pgTable('academic_periods', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 20 }).notNull().unique(), // Ej: 'I-2026', 'II-2025'
  name: varchar('name', { length: 100 }).notNull(),
  startDate: varchar('start_date', { length: 20 }).notNull(),
  endDate: varchar('end_date', { length: 20 }).notNull(),
  enrollmentsOpen: boolean('enrollments_open').default(true).notNull(),
  isCurrent: boolean('is_current').default(false).notNull(),
  ...auditAndSoftDeleteColumns,
});

/**
 * 6. OFERTA DE CURSOS POR GESTIÓN (Course Offerings)
 * Instancia de una materia ofertada en una gestión con docente, paralelo y cupo.
 */
export const courseOfferingsTable = pgTable('course_offerings', {
  id: serial('id').primaryKey(),
  subjectId: integer('subject_id')
    .references(() => subjectsTable.id)
    .notNull(),
  periodId: integer('period_id')
    .references(() => academicPeriodsTable.id)
    .notNull(),
  teacherId: integer('teacher_id')
    .references(() => usersTable.id)
    .notNull(),
  campusId: integer('campus_id')
    .references(() => campusesTable.id)
    .notNull(),
  groupCode: varchar('group_code', { length: 80 }).notNull(), // Ej: 'Paralelo A', 'Turno Mañana'
  maxQuota: integer('max_quota').default(30).notNull(),
  enrolledCount: integer('enrolled_count').default(0).notNull(),
  modality: varchar('modality', { length: 40 }).default('PRESENCIAL').notNull(),
  ...auditAndSoftDeleteColumns,
});

/**
 * 7. BLOQUES DE HORARIO DEL CURSO (Course Schedules)
 * Permite validar matemáticamente choques de horario entre cursos inscritos.
 */
export const courseSchedulesTable = pgTable('course_schedules', {
  id: serial('id').primaryKey(),
  courseOfferingId: integer('course_offering_id')
    .references(() => courseOfferingsTable.id)
    .notNull(),
  dayOfWeek: dayOfWeekEnum('day_of_week').notNull(),
  startTime: varchar('start_time', { length: 10 }).notNull(), // Formato HH:mm, ej. '08:00'
  endTime: varchar('end_time', { length: 10 }).notNull(), // Formato HH:mm, ej. '10:00'
  classroom: varchar('classroom', { length: 80 }).notNull(),
  ...auditAndSoftDeleteColumns,
});

/**
 * 8. EVALUACIONES DINÁMICAS PONDERADAS POR CURSO (Course Evaluations)
 * Define los rubros de evaluación (ej. 1er Parcial 35%, 2do Parcial 35%, Examen Final 30%).
 */
export const courseEvaluationsTable = pgTable('course_evaluations', {
  id: serial('id').primaryKey(),
  courseOfferingId: integer('course_offering_id')
    .references(() => courseOfferingsTable.id)
    .notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  weightPercentage: numeric('weight_percentage', {
    precision: 5,
    scale: 2,
  }).notNull(), // Porcentaje sobre 100%
  orderIndex: integer('order_index').default(1).notNull(),
  ...auditAndSoftDeleteColumns,
});

/**
 * 9. INSCRIPCIONES DE ESTUDIANTES (Enrollments)
 * Relaciona al estudiante con un curso ofertado en una gestión.
 */
export const enrollmentsTable = pgTable('enrollments', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id')
    .references(() => usersTable.id)
    .notNull(),
  courseOfferingId: integer('course_offering_id')
    .references(() => courseOfferingsTable.id)
    .notNull(),
  periodId: integer('period_id')
    .references(() => academicPeriodsTable.id)
    .notNull(),
  status: enrollmentStatusEnum('status').default('ACTIVA').notNull(),
  finalScore: numeric('final_score', { precision: 5, scale: 2 }), // Calculado por el Patrón Strategy (0 - 100)
  ...auditAndSoftDeleteColumns,
});

/**
 * 10. CALIFICACIONES POR EVALUACIÓN E INSCRIPCIÓN (Student Grades)
 * Registra la nota individual obtenida en cada evaluación dinámica del curso.
 */
export const studentGradesTable = pgTable('student_grades', {
  id: serial('id').primaryKey(),
  enrollmentId: integer('enrollment_id')
    .references(() => enrollmentsTable.id)
    .notNull(),
  evaluationId: integer('evaluation_id')
    .references(() => courseEvaluationsTable.id)
    .notNull(),
  score: numeric('score', { precision: 5, scale: 2 }).notNull(), // Nota sobre 100 puntos
  feedback: text('feedback'),
  gradedById: integer('graded_by_id').references(() => usersTable.id),
  ...auditAndSoftDeleteColumns,
});
