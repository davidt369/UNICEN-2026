import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  COURSE_OFFERINGS_REPOSITORY,
  ICourseOfferingsRepository,
} from '../domain/course-offerings.repository.interface';
import {
  CreateAcademicPeriodDto,
  CreateCourseOfferingDto,
  EvaluationItemDto,
  ScheduleBlockDto,
  UpdateCourseEvaluationsDto,
} from './dtos/course-offerings.dto';

/**
 * ============================================================================
 * [CAPA DE APLICACIÓN: REGLAS DE DOMINIO DE OFERTA ACADÉMICA]
 * ----------------------------------------------------------------------------
 * POR QUÉ: Garantizar que ningún curso se cree con horarios incoherentes
 *          (hora de fin menor o igual a hora de inicio) ni con ponderaciones
 *          de evaluación que no sumen exactamente el 100%.
 * PARA QUÉ: Proteger las invariantes matemáticas antes de que los estudiantes
 *           se inscriban o los docentes califiquen (Principio SRP).
 * ============================================================================
 */
@Injectable()
export class CourseOfferingsService {
  constructor(
    @Inject(COURSE_OFFERINGS_REPOSITORY)
    private readonly offeringsRepo: ICourseOfferingsRepository,
  ) {}

  private validateScheduleBlocks(schedules: ScheduleBlockDto[]) {
    for (const block of schedules) {
      if (block.startTime >= block.endTime) {
        throw new BadRequestException(
          `Bloque horario inválido el día ${block.dayOfWeek}: la hora de inicio (${block.startTime}) debe ser anterior a la hora de fin (${block.endTime}).`,
        );
      }
    }
  }

  private validateEvaluationsWeight(evaluations: EvaluationItemDto[]) {
    const totalWeight = evaluations.reduce(
      (acc, curr) => acc + Number(curr.weightPercentage),
      0,
    );
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new BadRequestException(
        `Invariante de evaluación violada: La suma de las ponderaciones del curso debe ser exactamente 100% (actual: ${totalWeight}%).`,
      );
    }
  }

  async getPeriods() {
    return this.offeringsRepo.findAllPeriods();
  }

  async createPeriod(dto: CreateAcademicPeriodDto) {
    return this.offeringsRepo.createPeriod({
      ...dto,
      isCurrent: dto.isCurrent ?? false,
    });
  }

  async togglePeriodEnrollments(id: number, enrollmentsOpen: boolean) {
    const updated = await this.offeringsRepo.togglePeriodEnrollments(
      id,
      enrollmentsOpen,
    );
    if (!updated) {
      throw new NotFoundException('La gestión académica solicitada no existe.');
    }
    return updated;
  }

  async getOfferings(filters?: {
    periodId?: number;
    teacherId?: number;
    careerId?: number;
  }) {
    return this.offeringsRepo.findAllOfferings(filters);
  }

  async getOfferingById(id: number) {
    const offering = await this.offeringsRepo.findOfferingById(id);
    if (!offering) {
      throw new NotFoundException('El curso ofertado no existe o fue dado de baja.');
    }
    return offering;
  }

  async createOffering(dto: CreateCourseOfferingDto) {
    this.validateScheduleBlocks(dto.schedules);
    if (dto.evaluations && dto.evaluations.length > 0) {
      this.validateEvaluationsWeight(dto.evaluations);
    }

    return this.offeringsRepo.createOffering({
      subjectId: dto.subjectId,
      periodId: dto.periodId,
      teacherId: dto.teacherId,
      campusId: dto.campusId,
      groupCode: dto.groupCode,
      maxQuota: dto.maxQuota,
      modality: dto.modality || 'PRESENCIAL',
      schedules: dto.schedules,
      evaluations: dto.evaluations?.map((e, i) => ({
        name: e.name,
        weightPercentage: e.weightPercentage,
        orderIndex: e.orderIndex ?? i + 1,
      })),
    });
  }

  async updateCourseEvaluations(
    courseOfferingId: number,
    dto: UpdateCourseEvaluationsDto,
  ) {
    await this.getOfferingById(courseOfferingId);
    this.validateEvaluationsWeight(dto.evaluations);

    return this.offeringsRepo.updateEvaluations(
      courseOfferingId,
      dto.evaluations.map((e, idx) => ({
        name: e.name,
        weightPercentage: e.weightPercentage,
        orderIndex: e.orderIndex ?? idx + 1,
      })),
    );
  }

  async softDeleteOffering(id: number) {
    const ok = await this.offeringsRepo.softDeleteOffering(id);
    if (!ok) {
      throw new NotFoundException(
        'El curso no existe o ya fue dado de baja lógica.',
      );
    }
    return {
      id,
      message: 'Curso ofertado dado de baja lógica correctamente.',
    };
  }
}
