import { UserRole } from '../../../core/decorators/roles.decorator';

export const USER_REPOSITORY = 'USER_REPOSITORY';

export interface UserRecord {
  id: number;
  registrationNumber: string;
  dni: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  careerId: number | null;
  campusId: number | null;
  careerName?: string | null;
  campusName?: string | null;
  isActive: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  registrationNumber: string;
  dni: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  careerId?: number | null;
  campusId?: number | null;
}

/**
 * ============================================================================
 * [PATRÓN DE DISEÑO: REPOSITORY & PRINCIPIO SOLID: DIP]
 * ----------------------------------------------------------------------------
 * POR QUÉ: Desacoplar los casos de uso de identidad y registro estudiantil
 *          de las consultas directas de Drizzle ORM.
 * PARA QUÉ: Garantizar que todas las consultas respeten el filtro de
 *           eliminación lógica (`isActive = true, deletedAt IS NULL`) y
 *           facilitar pruebas unitarias sin base de datos real.
 * ============================================================================
 */
export interface IUserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  findByRegistrationNumber(regNumber: string): Promise<UserRecord | null>;
  findById(id: number): Promise<UserRecord | null>;
  findAll(roleFilter?: UserRole): Promise<UserRecord[]>;
  create(data: CreateUserInput): Promise<UserRecord>;
  update(id: number, data: Partial<CreateUserInput>): Promise<UserRecord | null>;
  softDelete(id: number): Promise<boolean>;
}
