import { Module } from '@nestjs/common';
import { CourseOfferingsController } from './infrastructure/course-offerings.controller';
import { CourseOfferingsService } from './application/course-offerings.service';
import { COURSE_OFFERINGS_REPOSITORY } from './domain/course-offerings.repository.interface';
import { DrizzleCourseOfferingsRepository } from './infrastructure/drizzle-course-offerings.repository';

@Module({
  controllers: [CourseOfferingsController],
  providers: [
    CourseOfferingsService,
    {
      provide: COURSE_OFFERINGS_REPOSITORY,
      useClass: DrizzleCourseOfferingsRepository,
    },
  ],
  exports: [CourseOfferingsService, COURSE_OFFERINGS_REPOSITORY],
})
export class CourseOfferingsModule {}
