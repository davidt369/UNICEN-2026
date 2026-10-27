export const CATALOG_REPOSITORY = 'CATALOG_REPOSITORY';

export interface CampusEntity {
  id: number;
  code: string;
  name: string;
  city: string;
  address: string;
  isActive: boolean;
}

export interface CareerEntity {
  id: number;
  code: string;
  name: string;
  area: string;
  durationSemesters: number;
  campusId: number | null;
  campusName?: string | null;
  isActive: boolean;
}

export interface SubjectEntity {
  id: number;
  code: string;
  name: string;
  credits: number;
  semesterLevel: number;
  hoursPerWeek: number;
  careerId: number;
  careerName?: string | null;
  careerCode?: string | null;
  description: string | null;
  isActive: boolean;
}

/**
 * ============================================================================
 * [PATRÓN DE DISEÑO: REPOSITORY & PRINCIPIO SOLID: DIP]
 * ----------------------------------------------------------------------------
 * POR QUÉ: Desacoplar el catálogo académico (Sedes, Carreras y Materias) de
 *          Drizzle ORM.
 * PARA QUÉ: Asegurar que todas las consultas de catálogo apliquen eliminación
 *           lógica (`isActive = true`, `deletedAt IS NULL`) de forma uniforme.
 * ============================================================================
 */
export interface ICatalogRepository {
  findAllCampuses(): Promise<CampusEntity[]>;
  findAllCareers(): Promise<CareerEntity[]>;
  createCareer(data: {
    code: string;
    name: string;
    area: string;
    durationSemesters: number;
    campusId?: number;
  }): Promise<CareerEntity>;
  findAllSubjects(careerId?: number): Promise<SubjectEntity[]>;
  findSubjectById(id: number): Promise<SubjectEntity | null>;
  findSubjectByCode(code: string): Promise<SubjectEntity | null>;
  createSubject(data: {
    code: string;
    name: string;
    credits: number;
    semesterLevel: number;
    hoursPerWeek: number;
    careerId: number;
    description?: string;
  }): Promise<SubjectEntity>;
  updateSubject(
    id: number,
    data: Partial<{
      name: string;
      credits: number;
      semesterLevel: number;
      hoursPerWeek: number;
      careerId: number;
      description: string;
    }>,
  ): Promise<SubjectEntity | null>;
  softDeleteSubject(id: number): Promise<boolean>;
}
