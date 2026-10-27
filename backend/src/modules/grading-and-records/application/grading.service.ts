import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import {
  GRADING_REPOSITORY,
  IGradingRepository,
} from '../domain/grading.repository.interface';
import { RecordGradeDto } from './dtos/grading.dto';
import { AuthenticatedUser } from '../../../core/decorators/current-user.decorator';

@Injectable()
export class GradingService {
  constructor(
    @Inject(GRADING_REPOSITORY)
    private readonly gradingRepo: IGradingRepository,
  ) {}

  async recordGrade(user: AuthenticatedUser, dto: RecordGradeDto) {
    return this.gradingRepo.recordGradeTransactional({
      enrollmentId: dto.enrollmentId,
      evaluationId: dto.evaluationId,
      score: dto.score,
      feedback: dto.feedback,
      gradedById: user.id,
      userRole: user.role,
    });
  }

  async getCourseGradebook(
    courseOfferingId: number,
    user?: AuthenticatedUser,
  ) {
    const gradebook = await this.gradingRepo.getCourseGradebook(courseOfferingId);
    if (user && user.role === 'DOCENTE' && gradebook.teacherId !== user.id) {
      throw new ForbiddenException(
        'Acceso denegado: No tiene permisos para consultar la planilla de un paralelo asignado a otro docente.',
      );
    }
    return gradebook;
  }

  async getStudentKardex(studentId: number) {
    return this.gradingRepo.getStudentKardex(studentId);
  }
}
