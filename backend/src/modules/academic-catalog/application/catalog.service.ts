import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CATALOG_REPOSITORY,
  ICatalogRepository,
} from '../domain/catalog.repository.interface';
import { CreateSubjectDto, UpdateSubjectDto } from './dtos/catalog.dto';

@Injectable()
export class CatalogService {
  constructor(
    @Inject(CATALOG_REPOSITORY)
    private readonly catalogRepo: ICatalogRepository,
  ) {}

  async getCampuses() {
    return this.catalogRepo.findAllCampuses();
  }

  async getCareers() {
    return this.catalogRepo.findAllCareers();
  }

  async getSubjects(careerId?: number) {
    return this.catalogRepo.findAllSubjects(careerId);
  }

  async createSubject(dto: CreateSubjectDto) {
    const existing = await this.catalogRepo.findSubjectByCode(dto.code);
    if (existing) {
      throw new ConflictException(
        `Ya existe una materia activa con la sigla ${dto.code.toUpperCase()}.`,
      );
    }
    return this.catalogRepo.createSubject(dto);
  }

  async updateSubject(id: number, dto: UpdateSubjectDto) {
    const updated = await this.catalogRepo.updateSubject(id, dto);
    if (!updated) {
      throw new NotFoundException('La materia solicitada no existe o está inactiva.');
    }
    return updated;
  }

  async softDeleteSubject(id: number) {
    const ok = await this.catalogRepo.softDeleteSubject(id);
    if (!ok) {
      throw new NotFoundException('La materia no existe o ya fue dada de baja.');
    }
    return {
      id,
      message: 'Materia dada de baja lógica correctamente.',
    };
  }
}
