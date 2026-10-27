import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull, desc } from 'drizzle-orm';
import {
  DRIZZLE_DB,
  DrizzleDb,
} from '../../../core/database/database.module';
import {
  usersTable,
  careersTable,
  campusesTable,
} from '../../../database/schema';
import {
  CreateUserInput,
  IUserRepository,
  UserRecord,
} from '../domain/user.repository.interface';
import { UserRole } from '../../../core/decorators/roles.decorator';

/**
 * ============================================================================
 * [PATRÓN DE DISEÑO: REPOSITORY (IMPLEMENTACIÓN DRIZZLE ORM)]
 * ----------------------------------------------------------------------------
 * POR QUÉ: Aislar las consultas relacionales y el filtrado obligatorio de
 *          eliminación lógica (`isActive = true` y `deletedAt IS NULL`).
 * PARA QUÉ: Garantizar que ningún usuario dado de baja lógica pueda autenticarse
 *           o aparecer como activo, cumpliendo con el principio DIP y SRP.
 * ============================================================================
 */
@Injectable()
export class DrizzleUserRepository implements IUserRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  private activeFilter() {
    return and(
      eq(usersTable.isActive, true),
      isNull(usersTable.deletedAt),
    );
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const rows = await this.db
      .select({
        user: usersTable,
        careerName: careersTable.name,
        campusName: campusesTable.name,
      })
      .from(usersTable)
      .leftJoin(careersTable, eq(usersTable.careerId, careersTable.id))
      .leftJoin(campusesTable, eq(usersTable.campusId, campusesTable.id))
      .where(and(eq(usersTable.email, email.toLowerCase().trim()), this.activeFilter()))
      .limit(1);

    if (!rows.length) return null;
    return {
      ...rows[0].user,
      careerName: rows[0].careerName,
      campusName: rows[0].campusName,
    };
  }

  async findByRegistrationNumber(regNumber: string): Promise<UserRecord | null> {
    const rows = await this.db
      .select({
        user: usersTable,
        careerName: careersTable.name,
        campusName: campusesTable.name,
      })
      .from(usersTable)
      .leftJoin(careersTable, eq(usersTable.careerId, careersTable.id))
      .leftJoin(campusesTable, eq(usersTable.campusId, campusesTable.id))
      .where(and(eq(usersTable.registrationNumber, regNumber.trim()), this.activeFilter()))
      .limit(1);

    if (!rows.length) return null;
    return {
      ...rows[0].user,
      careerName: rows[0].careerName,
      campusName: rows[0].campusName,
    };
  }

  async findById(id: number): Promise<UserRecord | null> {
    const rows = await this.db
      .select({
        user: usersTable,
        careerName: careersTable.name,
        campusName: campusesTable.name,
      })
      .from(usersTable)
      .leftJoin(careersTable, eq(usersTable.careerId, careersTable.id))
      .leftJoin(campusesTable, eq(usersTable.campusId, campusesTable.id))
      .where(and(eq(usersTable.id, id), this.activeFilter()))
      .limit(1);

    if (!rows.length) return null;
    return {
      ...rows[0].user,
      careerName: rows[0].careerName,
      campusName: rows[0].campusName,
    };
  }

  async findAll(roleFilter?: UserRole): Promise<UserRecord[]> {
    const condition = roleFilter
      ? and(eq(usersTable.role, roleFilter), this.activeFilter())
      : this.activeFilter();

    const rows = await this.db
      .select({
        user: usersTable,
        careerName: careersTable.name,
        campusName: campusesTable.name,
      })
      .from(usersTable)
      .leftJoin(careersTable, eq(usersTable.careerId, careersTable.id))
      .leftJoin(campusesTable, eq(usersTable.campusId, campusesTable.id))
      .where(condition)
      .orderBy(desc(usersTable.createdAt));

    return rows.map((r) => ({
      ...r.user,
      careerName: r.careerName,
      campusName: r.campusName,
    }));
  }

  async create(data: CreateUserInput): Promise<UserRecord> {
    const [created] = await this.db
      .insert(usersTable)
      .values({
        registrationNumber: data.registrationNumber.trim(),
        dni: data.dni.trim(),
        email: data.email.toLowerCase().trim(),
        passwordHash: data.passwordHash,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        role: data.role,
        careerId: data.careerId ?? null,
        campusId: data.campusId ?? null,
      })
      .returning();

    return (await this.findById(created.id)) ?? created;
  }

  async update(
    id: number,
    data: Partial<CreateUserInput>,
  ): Promise<UserRecord | null> {
    const [updated] = await this.db
      .update(usersTable)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(usersTable.id, id), this.activeFilter()))
      .returning();

    if (!updated) return null;
    return this.findById(updated.id);
  }

  async softDelete(id: number): Promise<boolean> {
    const now = new Date();
    const result = await this.db
      .update(usersTable)
      .set({
        isActive: false,
        deletedAt: now,
        updatedAt: now,
      })
      .where(and(eq(usersTable.id, id), this.activeFilter()))
      .returning({ id: usersTable.id });

    return result.length > 0;
  }
}
