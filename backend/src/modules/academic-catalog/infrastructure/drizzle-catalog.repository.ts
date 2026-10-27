import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';
import {
  DRIZZLE_DB,
  DrizzleDb,
} from '../../../core/database/database.module';
import {
  campusesTable,
  careersTable,
  subjectsTable,
} from '../../../database/schema';
import {
  CampusEntity,
  CareerEntity,
  ICatalogRepository,
  SubjectEntity,
} from '../domain/catalog.repository.interface';

@Injectable()
export class DrizzleCatalogRepository implements ICatalogRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  async findAllCampuses(): Promise<CampusEntity[]> {
    return this.db
      .select()
      .from(campusesTable)
      .where(
        and(
          eq(campusesTable.isActive, true),
          isNull(campusesTable.deletedAt),
        ),
      )
      .orderBy(asc(campusesTable.id));
  }

  async findAllCareers(): Promise<CareerEntity[]> {
    const rows = await this.db
      .select({
        career: careersTable,
        campusName: campusesTable.name,
      })
      .from(careersTable)
      .leftJoin(campusesTable, eq(careersTable.campusId, campusesTable.id))
      .where(
        and(eq(careersTable.isActive, true), isNull(careersTable.deletedAt)),
      )
      .orderBy(asc(careersTable.name));

    return rows.map((r) => ({
      ...r.career,
      campusName: r.campusName,
    }));
  }

  async createCareer(data: {
    code: string;
    name: string;
    area: string;
    durationSemesters: number;
    campusId?: number;
  }): Promise<CareerEntity> {
    const [created] = await this.db
      .insert(careersTable)
      .values({
        code: data.code.toUpperCase().trim(),
        name: data.name.trim(),
        area: data.area.trim(),
        durationSemesters: data.durationSemesters,
        campusId: data.campusId ?? null,
      })
      .returning();

    return created;
  }

  async findAllSubjects(careerId?: number): Promise<SubjectEntity[]> {
    const baseFilter = and(
      eq(subjectsTable.isActive, true),
      isNull(subjectsTable.deletedAt),
    );
    const whereClause = careerId
      ? and(baseFilter, eq(subjectsTable.careerId, careerId))
      : baseFilter;

    const rows = await this.db
      .select({
        subject: subjectsTable,
        careerName: careersTable.name,
        careerCode: careersTable.code,
      })
      .from(subjectsTable)
      .innerJoin(careersTable, eq(subjectsTable.careerId, careersTable.id))
      .where(whereClause)
      .orderBy(asc(subjectsTable.semesterLevel), asc(subjectsTable.code));

    return rows.map((r) => ({
      ...r.subject,
      careerName: r.careerName,
      careerCode: r.careerCode,
    }));
  }

  async findSubjectById(id: number): Promise<SubjectEntity | null> {
    const rows = await this.db
      .select({
        subject: subjectsTable,
        careerName: careersTable.name,
        careerCode: careersTable.code,
      })
      .from(subjectsTable)
      .innerJoin(careersTable, eq(subjectsTable.careerId, careersTable.id))
      .where(
        and(
          eq(subjectsTable.id, id),
          eq(subjectsTable.isActive, true),
          isNull(subjectsTable.deletedAt),
        ),
      )
      .limit(1);

    if (!rows.length) return null;
    return {
      ...rows[0].subject,
      careerName: rows[0].careerName,
      careerCode: rows[0].careerCode,
    };
  }

  async findSubjectByCode(code: string): Promise<SubjectEntity | null> {
    const rows = await this.db
      .select()
      .from(subjectsTable)
      .where(
        and(
          eq(subjectsTable.code, code.toUpperCase().trim()),
          eq(subjectsTable.isActive, true),
          isNull(subjectsTable.deletedAt),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async createSubject(data: {
    code: string;
    name: string;
    credits: number;
    semesterLevel: number;
    hoursPerWeek: number;
    careerId: number;
    description?: string;
  }): Promise<SubjectEntity> {
    const [created] = await this.db
      .insert(subjectsTable)
      .values({
        code: data.code.toUpperCase().trim(),
        name: data.name.trim(),
        credits: data.credits,
        semesterLevel: data.semesterLevel,
        hoursPerWeek: data.hoursPerWeek,
        careerId: data.careerId,
        description: data.description ?? null,
      })
      .returning();

    return (await this.findSubjectById(created.id)) ?? created;
  }

  async updateSubject(
    id: number,
    data: Partial<{
      name: string;
      credits: number;
      semesterLevel: number;
      hoursPerWeek: number;
      careerId: number;
      description: string;
    }>,
  ): Promise<SubjectEntity | null> {
    const [updated] = await this.db
      .update(subjectsTable)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(subjectsTable.id, id),
          eq(subjectsTable.isActive, true),
          isNull(subjectsTable.deletedAt),
        ),
      )
      .returning();

    if (!updated) return null;
    return this.findSubjectById(updated.id);
  }

  async softDeleteSubject(id: number): Promise<boolean> {
    const now = new Date();
    const res = await this.db
      .update(subjectsTable)
      .set({
        isActive: false,
        deletedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(subjectsTable.id, id),
          eq(subjectsTable.isActive, true),
          isNull(subjectsTable.deletedAt),
        ),
      )
      .returning({ id: subjectsTable.id });

    return res.length > 0;
  }
}
