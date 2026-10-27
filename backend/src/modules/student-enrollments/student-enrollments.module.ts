import { Module } from '@nestjs/common';
import { EnrollmentsController } from './infrastructure/enrollments.controller';
import { EnrollmentsService } from './application/enrollments.service';
import { ENROLLMENT_REPOSITORY } from './domain/enrollment.repository.interface';
import { DrizzleEnrollmentRepository } from './infrastructure/drizzle-enrollment.repository';

@Module({
  controllers: [EnrollmentsController],
  providers: [
    EnrollmentsService,
    {
      provide: ENROLLMENT_REPOSITORY,
      useClass: DrizzleEnrollmentRepository,
    },
  ],
  exports: [EnrollmentsService, ENROLLMENT_REPOSITORY],
})
export class StudentEnrollmentsModule {}
