import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm';
import {
  DRIZZLE_DB,
  DrizzleDb,
} from '../../../core/database/database.module';
import {
  academicPeriodsTable,
  campusesTable,
  careersTable,
  courseEvaluationsTable,
  courseOfferingsTable,
  courseSchedulesTable,
  subjectsTable,
  usersTable,
} from '../../../database/schema';
import {
  AcademicPeriodEntity,
  CourseOfferingDetailEntity,
  CreateCourseOfferingInput,
  EvaluationConfigEntity,
  ICourseOfferingsRepository,
  ScheduleBlockEntity,
} from '../domain/course-offerings.repository.interface';

@Injectable()
export class DrizzleCourseOfferingsRepository
  implements ICourseOfferingsRepository
{
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  async findAllPeriods(): Promise<AcademicPeriodEntity[]> {
    return this.db
      .select()
      .from(academicPeriodsTable)
      .where(
        and(
          eq(academicPeriodsTable.isActive, true),
          isNull(academicPeriodsTable.deletedAt),
        ),
      )
      .orderBy(desc(academicPeriodsTable.isCurrent), desc(academicPeriodsTable.id));
  }

  async findPeriodById(id: number): Promise<AcademicPeriodEntity | null> {
    const rows = await this.db
      .select()
      .from(academicPeriodsTable)
      .where(
        and(
          eq(academicPeriodsTable.id, id),
          eq(academicPeriodsTable.isActive, true),
          isNull(academicPeriodsTable.deletedAt),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async createPeriod(data: {
    code: string;
    name: string;
    startDate: string;
    endDate: string;
    enrollmentsOpen: boolean;
    isCurrent: boolean;
  }): Promise<AcademicPeriodEntity> {
    const [created] = await this.db
      .insert(academicPeriodsTable)
      .values({
        code: data.code.toUpperCase().trim(),
        name: data.name.trim(),
        startDate: data.startDate,
        endDate: data.endDate,
        enrollmentsOpen: data.enrollmentsOpen,
        isCurrent: data.isCurrent,
      })
      .returning();

    return created;
  }

  async togglePeriodEnrollments(
    id: number,
    enrollmentsOpen: boolean,
  ): Promise<AcademicPeriodEntity | null> {
    const [updated] = await this.db
      .update(academicPeriodsTable)
      .set({
        enrollmentsOpen,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(academicPeriodsTable.id, id),
          eq(academicPeriodsTable.isActive, true),
          isNull(academicPeriodsTable.deletedAt),
        ),
      )
      .returning();

    return updated ?? null;
  }

  async findAllOfferings(filters?: {
    periodId?: number;
    teacherId?: number;
    careerId?: number;
  }): Promise<CourseOfferingDetailEntity[]> {
    const conditions = [
      eq(courseOfferingsTable.isActive, true),
      isNull(courseOfferingsTable.deletedAt),
    ];

    if (filters?.periodId) {
      conditions.push(eq(courseOfferingsTable.periodId, filters.periodId));
    }
    if (filters?.teacherId) {
      conditions.push(eq(courseOfferingsTable.teacherId, filters.teacherId));
    }
    if (filters?.careerId) {
      conditions.push(eq(subjectsTable.careerId, filters.careerId));
    }

    const rows = await this.db
      .select({
        offering: courseOfferingsTable,
        subject: subjectsTable,
        career: careersTable,
        period: academicPeriodsTable,
        teacher: usersTable,
        campus: campusesTable,
      })
      .from(courseOfferingsTable)
      .innerJoin(
        subjectsTable,
        eq(courseOfferingsTable.subjectId, subjectsTable.id),
      )
      .innerJoin(careersTable, eq(subjectsTable.careerId, careersTable.id))
      .innerJoin(
        academicPeriodsTable,
        eq(courseOfferingsTable.periodId, academicPeriodsTable.id),
      )
      .innerJoin(usersTable, eq(courseOfferingsTable.teacherId, usersTable.id))
      .innerJoin(
        campusesTable,
        eq(courseOfferingsTable.campusId, campusesTable.id),
      )
      .where(and(...conditions))
      .orderBy(asc(subjectsTable.semesterLevel), asc(subjectsTable.code));

    if (!rows.length) return [];

    const offeringIds = rows.map((r) => r.offering.id);

    const allSchedules = await this.db
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

    const allEvaluations = await this.db
      .select()
      .from(courseEvaluationsTable)
      .where(
        and(
          inArray(courseEvaluationsTable.courseOfferingId, offeringIds),
          eq(courseEvaluationsTable.isActive, true),
          isNull(courseEvaluationsTable.deletedAt),
        ),
      )
      .orderBy(asc(courseEvaluationsTable.orderIndex));

    const scheduleMap = new Map<number, ScheduleBlockEntity[]>();
    for (const s of allSchedules) {
      const list = scheduleMap.get(s.courseOfferingId) || [];
      list.push(s);
      scheduleMap.set(s.courseOfferingId, list);
    }

    const evalMap = new Map<number, EvaluationConfigEntity[]>();
    for (const e of allEvaluations) {
      const list = evalMap.get(e.courseOfferingId) || [];
      list.push({
        id: e.id,
        courseOfferingId: e.courseOfferingId,
        name: e.name,
        weightPercentage: Number(e.weightPercentage),
        orderIndex: e.orderIndex,
      });
      evalMap.set(e.courseOfferingId, list);
    }

    return rows.map((r) => ({
      id: r.offering.id,
      subjectId: r.subject.id,
      subjectCode: r.subject.code,
      subjectName: r.subject.name,
      credits: r.subject.credits,
      semesterLevel: r.subject.semesterLevel,
      careerId: r.career.id,
      careerName: r.career.name,
      periodId: r.period.id,
      periodCode: r.period.code,
      periodName: r.period.name,
      enrollmentsOpen: r.period.enrollmentsOpen,
      teacherId: r.teacher.id,
      teacherName: `${r.teacher.firstName} ${r.teacher.lastName}`,
      teacherEmail: r.teacher.email,
      campusId: r.campus.id,
      campusName: r.campus.name,
      groupCode: r.offering.groupCode,
      maxQuota: r.offering.maxQuota,
      enrolledCount: r.offering.enrolledCount,
      availableQuota: Math.max(
        0,
        r.offering.maxQuota - r.offering.enrolledCount,
      ),
      modality: r.offering.modality,
      schedules: scheduleMap.get(r.offering.id) || [],
      evaluations: evalMap.get(r.offering.id) || [],
      isActive: r.offering.isActive,
    }));
  }

  async findOfferingById(
    id: number,
  ): Promise<CourseOfferingDetailEntity | null> {
    const all = await this.findAllOfferings();
    return all.find((o) => o.id === id) ?? null;
  }

  async createOffering(
    data: CreateCourseOfferingInput,
  ): Promise<CourseOfferingDetailEntity> {
    const createdId = await this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(courseOfferingsTable)
        .values({
          subjectId: data.subjectId,
          periodId: data.periodId,
          teacherId: data.teacherId,
          campusId: data.campusId,
          groupCode: data.groupCode.trim(),
          maxQuota: data.maxQuota,
          enrolledCount: 0,
          modality: data.modality || 'PRESENCIAL',
        })
        .returning();

      if (data.schedules?.length) {
        await tx.insert(courseSchedulesTable).values(
          data.schedules.map((s) => ({
            courseOfferingId: created.id,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            classroom: s.classroom.trim(),
          })),
        );
      }

      const evaluations =
        data.evaluations && data.evaluations.length > 0
          ? data.evaluations
          : [
              { name: 'Primer Parcial', weightPercentage: 35, orderIndex: 1 },
              { name: 'Segundo Parcial', weightPercentage: 35, orderIndex: 2 },
              { name: 'Examen Final', weightPercentage: 30, orderIndex: 3 },
            ];

      await tx.insert(courseEvaluationsTable).values(
        evaluations.map((ev, idx) => ({
          courseOfferingId: created.id,
          name: ev.name.trim(),
          weightPercentage: String(ev.weightPercentage),
          orderIndex: ev.orderIndex ?? idx + 1,
        })),
      );

      return created.id;
    });

    const full = await this.findOfferingById(createdId);
    return full!;
  }

  async updateEvaluations(
    courseOfferingId: number,
    evaluations: Array<{
      name: string;
      weightPercentage: number;
      orderIndex: number;
    }>,
  ): Promise<EvaluationConfigEntity[]> {
    const now = new Date();
    return this.db.transaction(async (tx) => {
      // Baja lógica de evaluaciones previas
      await tx
        .update(courseEvaluationsTable)
        .set({
          isActive: false,
          deletedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(courseEvaluationsTable.courseOfferingId, courseOfferingId),
            eq(courseEvaluationsTable.isActive, true),
          ),
        );

      const inserted = await tx
        .insert(courseEvaluationsTable)
        .values(
          evaluations.map((ev, idx) => ({
            courseOfferingId,
            name: ev.name.trim(),
            weightPercentage: String(ev.weightPercentage),
            orderIndex: ev.orderIndex ?? idx + 1,
          })),
        )
        .returning();

      return inserted.map((e) => ({
        id: e.id,
        courseOfferingId: e.courseOfferingId,
        name: e.name,
        weightPercentage: Number(e.weightPercentage),
        orderIndex: e.orderIndex,
      }));
    });
  }

  async softDeleteOffering(id: number): Promise<boolean> {
    const now = new Date();
    const res = await this.db
      .update(courseOfferingsTable)
      .set({
        isActive: false,
        deletedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(courseOfferingsTable.id, id),
          eq(courseOfferingsTable.isActive, true),
          isNull(courseOfferingsTable.deletedAt),
        ),
      )
      .returning({ id: courseOfferingsTable.id });

    return res.length > 0;
  }
}
