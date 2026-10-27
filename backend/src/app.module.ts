import { Controller, Get, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './core/database/database.module';
import { IdentityAndAccessModule } from './modules/identity-and-access/identity-and-access.module';
import { AcademicCatalogModule } from './modules/academic-catalog/academic-catalog.module';
import { CourseOfferingsModule } from './modules/course-offerings/course-offerings.module';
import { StudentEnrollmentsModule } from './modules/student-enrollments/student-enrollments.module';
import { GradingAndRecordsModule } from './modules/grading-and-records/grading-and-records.module';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'OK',
      system: 'SIIA UNICEN 2026 - API Académica',
      timestamp: new Date().toISOString(),
    };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    IdentityAndAccessModule,
    AcademicCatalogModule,
    CourseOfferingsModule,
    StudentEnrollmentsModule,
    GradingAndRecordsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
