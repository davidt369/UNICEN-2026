import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import {
  DRIZZLE_DB,
  DrizzleDb,
} from '../../../core/database/database.module';
import {
  academicPeriodsTable,
  campusesTable,
  courseOfferingsTable,
  courseSchedulesTable,
  enrollmentsTable,
  subjectsTable,
  usersTable,
} from '../../../database/schema';
import {
  EnrollmentDetailEntity,
  IEnrollmentRepository,
} from '../domain/enrollment.repository.interface';
import { ScheduleConflictValidator } from '../domain/schedule-conflict.validator';
import { ScheduleBlockEntity } from '../../course-offerings/domain/course-offerings.repository.interface';

@Injectable()
export class DrizzleEnrollmentRepository implements IEnrollmentRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  async enrollStudentTransactional(
    studentId: number,
    courseOfferingId: number,
  ): Promise<EnrollmentDetailEntity> {
    const newEnrollmentId = await this.db.transaction(async (tx) => {
      // 1. Validar que el estudiante exista y esté activo
      const [student] = await tx
        .select()
        .from(usersTable)
        .where(
          and(
            eq(usersTable.id, studentId),
            eq(usersTable.isActive, true),
            isNull(usersTable.deletedAt),
          ),
        )
        .limit(1);

      if (!student || student.role !== 'ESTUDIANTE') {
        throw new BadRequestException(
          'El usuario especificado no es un estudiante activo en SIIA UNICEN.',
        );
      }

      // 2. Bloqueo pesimista (SELECT ... FOR UPDATE) sobre el curso ofertado para garantizar control atómico de cupo
      const [offering] = await tx
        .select()
        .from(courseOfferingsTable)
        .where(
          and(
            eq(courseOfferingsTable.id, courseOfferingId),
            eq(courseOfferingsTable.isActive, true),
            isNull(courseOfferingsTable.deletedAt),
          ),
        )
        .for('update');

      if (!offering) {
        throw new NotFoundException(
          'El curso ofertado no existe o fue dado de baja.',
        );
      }

      // 3. Verificar que la gestión académica tenga las inscripciones abiertas
      const [period] = await tx
        .select()
        .from(academicPeriodsTable)
        .where(
          and(
            eq(academicPeriodsTable.id, offering.periodId),
            eq(academicPeriodsTable.isActive, true),
            isNull(academicPeriodsTable.deletedAt),
          ),
        )
        .limit(1);

      if (!period || !period.enrollmentsOpen) {
        throw new BadRequestException(
          `Las inscripciones para la gestión ${period?.code || ''} se encuentran cerradas por administración.`,
        );
      }

      // 4. Obtener las inscripciones activas del estudiante en la misma gestión académica
      const existingEnrollments = await tx
        .select({
          enrollment: enrollmentsTable,
          course: courseOfferingsTable,
          subject: subjectsTable,
        })
        .from(enrollmentsTable)
        .innerJoin(
          courseOfferingsTable,
          eq(enrollmentsTable.courseOfferingId, courseOfferingsTable.id),
        )
        .innerJoin(
          subjectsTable,
          eq(courseOfferingsTable.subjectId, subjectsTable.id),
        )
        .where(
          and(
            eq(enrollmentsTable.studentId, studentId),
            eq(enrollmentsTable.periodId, offering.periodId),
            eq(enrollmentsTable.isActive, true),
            isNull(enrollmentsTable.deletedAt),
          ),
        );

      // 5. Validar Inscripción Duplicada (al mismo curso o a otro paralelo de la misma materia)
      for (const existing of existingEnrollments) {
        if (existing.course.id === courseOfferingId) {
          throw new ConflictException(
            'Inscripción duplicada: Ya te encuentras inscrito en este curso.',
          );
        }
        if (existing.subject.id === offering.subjectId) {
          throw new ConflictException(
            `Inscripción duplicada en materia: Ya estás inscrito en "${existing.subject.code} - ${existing.subject.name}" (${existing.course.groupCode}) en la gestión ${period.code}.`,
          );
        }
      }

      // 6. Validar Cupo Disponible
      if (offering.enrolledCount >= offering.maxQuota) {
        throw new BadRequestException(
          `Cupo agotado: El curso ya alcanzó su límite máximo de ${offering.maxQuota} estudiantes.`,
        );
      }

      // 7. Validar Choque de Horarios usando ScheduleConflictValidator (Servicio de Dominio Puro)
      const candidateSchedules = await tx
        .select()
        .from(courseSchedulesTable)
        .where(
          and(
            eq(courseSchedulesTable.courseOfferingId, courseOfferingId),
            eq(courseSchedulesTable.isActive, true),
            isNull(courseSchedulesTable.deletedAt),
          ),
        );

      if (existingEnrollments.length > 0 && candidateSchedules.length > 0) {
        const existingOfferingIds = existingEnrollments.map(
          (e) => e.course.id,
        );
        const existingSchedules = await tx
          .select()
          .from(courseSchedulesTable)
          .where(
            and(
              inArray(
                courseSchedulesTable.courseOfferingId,
                existingOfferingIds,
              ),
              eq(courseSchedulesTable.isActive, true),
              isNull(courseSchedulesTable.deletedAt),
            ),
          );

        const scheduleContexts = existingEnrollments.map((e) => ({
          courseOfferingId: e.course.id,
          subjectCode: e.subject.code,
          subjectName: e.subject.name,
          groupCode: e.course.groupCode,
          schedules: existingSchedules.filter(
            (s) => s.courseOfferingId === e.course.id,
          ),
        }));

        const conflictCheck = ScheduleConflictValidator.checkConflict(
          candidateSchedules,
          scheduleContexts,
        );
        if (conflictCheck.hasConflict) {
          throw new ConflictException(conflictCheck.conflictMessage);
        }
      }

      // 8. Registrar inscripción e incrementar contador de cupos atómicamente
      const [inserted] = await tx
        .insert(enrollmentsTable)
        .values({
          studentId,
          courseOfferingId,
          periodId: offering.periodId,
          status: 'ACTIVA',
        })
        .returning();

      await tx
        .update(courseOfferingsTable)
        .set({
          enrolledCount: sql`${courseOfferingsTable.enrolledCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(courseOfferingsTable.id, courseOfferingId));

      return inserted.id;
    });

    const detail = await this.findById(newEnrollmentId);
    return detail!;
  }

  async withdrawEnrollmentTransactional(
    enrollmentId: number,
  ): Promise<{ id: number; courseOfferingId: number }> {
    const now = new Date();
    return this.db.transaction(async (tx) => {
      const [enrollment] = await tx
        .select()
        .from(enrollmentsTable)
        .where(
          and(
            eq(enrollmentsTable.id, enrollmentId),
            eq(enrollmentsTable.isActive, true),
            isNull(enrollmentsTable.deletedAt),
          ),
        )
        .for('update');

      if (!enrollment) {
        throw new NotFoundException(
          'La inscripción no existe o ya fue retirada anteriormente.',
        );
      }

      await tx
        .update(enrollmentsTable)
        .set({
          status: 'RETIRADA',
          isActive: false,
          deletedAt: now,
          updatedAt: now,
        })
        .where(eq(enrollmentsTable.id, enrollmentId));

      await tx
        .update(courseOfferingsTable)
        .set({
          enrolledCount: sql`GREATEST(0, ${courseOfferingsTable.enrolledCount} - 1)`,
          updatedAt: now,
        })
        .where(eq(courseOfferingsTable.id, enrollment.courseOfferingId));

      return {
        id: enrollment.id,
        courseOfferingId: enrollment.courseOfferingId,
      };
    });
  }

  private async mapEnrollments(
    condition: ReturnType<typeof and>,
  ): Promise<EnrollmentDetailEntity[]> {
    const rows = await this.db
      .select({
        enrollment: enrollmentsTable,
        student: usersTable,
        offering: courseOfferingsTable,
        subject: subjectsTable,
        period: academicPeriodsTable,
        campus: campusesTable,
      })
      .from(enrollmentsTable)
      .innerJoin(usersTable, eq(enrollmentsTable.studentId, usersTable.id))
      .innerJoin(
        courseOfferingsTable,
        eq(enrollmentsTable.courseOfferingId, courseOfferingsTable.id),
      )
      .innerJoin(
        subjectsTable,
        eq(courseOfferingsTable.subjectId, subjectsTable.id),
      )
      .innerJoin(
        academicPeriodsTable,
        eq(enrollmentsTable.periodId, academicPeriodsTable.id),
      )
      .innerJoin(
        campusesTable,
        eq(courseOfferingsTable.campusId, campusesTable.id),
      )
      .where(condition)
      .orderBy(desc(enrollmentsTable.createdAt));

    if (!rows.length) return [];

    const teacherIds = [...new Set(rows.map((r) => r.offering.teacherId))];
    const teachers = await this.db
      .select()
      .from(usersTable)
      .where(inArray(usersTable.id, teacherIds));
    const teacherMap = new Map(
      teachers.map((t) => [t.id, `${t.firstName} ${t.lastName}`]),
    );

    const offeringIds = [...new Set(rows.map((r) => r.offering.id))];
    const schedules = await this.db
      .select()
      .from(courseSchedulesTable)
      .where(
        and(
          inArray(courseSchedulesTable.courseOfferingId, offeringIds),
          eq(courseSchedulesTable.isActive, true),
          isNull(courseSchedulesTable.deletedAt),
        ),
      )
      .orderBy(asc(courseSchedulesTable.id));

    const scheduleMap = new Map<number, ScheduleBlockEntity[]>();
    for (const s of schedules) {
      const list = scheduleMap.get(s.courseOfferingId) || [];
      list.push(s);
      scheduleMap.set(s.courseOfferingId, list);
    }

    return rows.map((r) => ({
      id: r.enrollment.id,
      studentId: r.student.id,
      studentName: `${r.student.firstName} ${r.student.lastName}`,
      studentRegistrationNumber: r.student.registrationNumber,
      studentEmail: r.student.email,
      courseOfferingId: r.offering.id,
      subjectId: r.subject.id,
      subjectCode: r.subject.code,
      subjectName: r.subject.name,
      credits: r.subject.credits,
      groupCode: r.offering.groupCode,
      teacherName: teacherMap.get(r.offering.teacherId) || 'Docente Titular',
      campusName: r.campus.name,
      periodId: r.period.id,
      periodCode: r.period.code,
      periodName: r.period.name,
      status: r.enrollment.status,
      finalScore:
        r.enrollment.finalScore !== null
          ? Number(r.enrollment.finalScore)
          : null,
      schedules: scheduleMap.get(r.offering.id) || [],
      createdAt: r.enrollment.createdAt,
    }));
  }

  async findByStudent(
    studentId: number,
    periodId?: number,
  ): Promise<EnrollmentDetailEntity[]> {
    const base = and(
      eq(enrollmentsTable.studentId, studentId),
      eq(enrollmentsTable.isActive, true),
      isNull(enrollmentsTable.deletedAt),
    );
    const cond = periodId
      ? and(base, eq(enrollmentsTable.periodId, periodId))
      : base;
    return this.mapEnrollments(cond);
  }

  async findByCourseOffering(
    courseOfferingId: number,
  ): Promise<EnrollmentDetailEntity[]> {
    return this.mapEnrollments(
      and(
        eq(enrollmentsTable.courseOfferingId, courseOfferingId),
        eq(enrollmentsTable.isActive, true),
        isNull(enrollmentsTable.deletedAt),
      ),
    );
  }

  async findById(enrollmentId: number): Promise<EnrollmentDetailEntity | null> {
    const list = await this.mapEnrollments(
      and(
        eq(enrollmentsTable.id, enrollmentId),
        eq(enrollmentsTable.isActive, true),
        isNull(enrollmentsTable.deletedAt),
      ),
    );
    return list[0] ?? null;
  }
}
