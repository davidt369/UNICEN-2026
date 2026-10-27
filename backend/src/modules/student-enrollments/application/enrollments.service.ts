import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ENROLLMENT_REPOSITORY,
  IEnrollmentRepository,
} from '../domain/enrollment.repository.interface';
import { CreateEnrollmentDto } from './dtos/enrollment.dto';
import { AuthenticatedUser } from '../../../core/decorators/current-user.decorator';

@Injectable()
export class EnrollmentsService {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly enrollmentRepo: IEnrollmentRepository,
  ) {}

  async enroll(user: AuthenticatedUser, dto: CreateEnrollmentDto) {
    // Si es ESTUDIANTE solo puede inscribirse a sí mismo; si es ADMINISTRADOR puede especificar studentId
    const targetStudentId =
      user.role === 'ADMINISTRADOR' && dto.studentId ? dto.studentId : user.id;

    return this.enrollmentRepo.enrollStudentTransactional(
      targetStudentId,
      dto.courseOfferingId,
    );
  }

  async withdraw(user: AuthenticatedUser, enrollmentId: number) {
    const existing = await this.enrollmentRepo.findById(enrollmentId);
    if (!existing) {
      throw new NotFoundException(
        'La inscripción solicitada no existe o ya fue retirada.',
      );
    }

    if (user.role === 'ESTUDIANTE' && existing.studentId !== user.id) {
      throw new ForbiddenException(
        'No tienes permiso para retirar la inscripción de otro estudiante.',
      );
    }

    const result =
      await this.enrollmentRepo.withdrawEnrollmentTransactional(enrollmentId);
    return {
      ...result,
      message:
        'Inscripción retirada mediante baja lógica. El cupo fue liberado automáticamente.',
    };
  }

  async getMyEnrollments(studentId: number, periodId?: number) {
    return this.enrollmentRepo.findByStudent(studentId, periodId);
  }

  async getEnrollmentsByCourse(courseOfferingId: number) {
    return this.enrollmentRepo.findByCourseOffering(courseOfferingId);
  }
}
