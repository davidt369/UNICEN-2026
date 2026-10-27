import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './core/filters/http-exception.filter';
import { AuthService } from './modules/identity-and-access/application/auth.service';
import { CourseOfferingsService } from './modules/course-offerings/application/course-offerings.service';
import { EnrollmentsService } from './modules/student-enrollments/application/enrollments.service';
import { GradingService } from './modules/grading-and-records/application/grading.service';

describe('SIIA UNICEN 2026 - Integración End-to-End con PostgreSQL', () => {
  let app: INestApplication;
  let authService: AuthService;
  let offeringsService: CourseOfferingsService;
  let enrollmentsService: EnrollmentsService;
  let gradingService: GradingService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();

    authService = app.get(AuthService);
    offeringsService = app.get(CourseOfferingsService);
    enrollmentsService = app.get(EnrollmentsService);
    gradingService = app.get(GradingService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. Login PASETO v4.public para estudiante1@unicen.edu.bo', async () => {
    const res = await authService.login({
      email: 'estudiante1@unicen.edu.bo',
      password: 'Unicen2026!',
    });

    expect(res.accessToken.startsWith('v4.public.')).toBe(true);
    expect(res.user.role).toBe('ESTUDIANTE');
    expect(res.user.registrationNumber).toBe('RU-2026-482910');
  });

  it('2. Rechaza inscripción duplicada al mismo curso', async () => {
    const res = await authService.login({
      email: 'estudiante1@unicen.edu.bo',
      password: 'Unicen2026!',
    });
    const offerings = await offeringsService.getOfferings();
    const arqCourse = offerings.find((o) => o.subjectCode === 'IIA-201');
    expect(arqCourse).toBeDefined();

    await expect(
      enrollmentsService.enroll(
        {
          id: res.user.id,
          email: res.user.email,
          role: res.user.role,
          registrationNumber: res.user.registrationNumber,
          fullName: res.user.fullName,
        },
        { courseOfferingId: arqCourse!.id },
      ),
    ).rejects.toThrow(/Inscripción duplicada/);
  });

  it('3. Rechaza inscripción cuando el cupo está agotado (2/2)', async () => {
    const res = await authService.login({
      email: 'estudiante1@unicen.edu.bo',
      password: 'Unicen2026!',
    });
    const offerings = await offeringsService.getOfferings();
    const fullCourse = offerings.find((o) => o.subjectCode === 'MED-101');
    expect(fullCourse).toBeDefined();

    await expect(
      enrollmentsService.enroll(
        {
          id: res.user.id,
          email: res.user.email,
          role: res.user.role,
          registrationNumber: res.user.registrationNumber,
          fullName: res.user.fullName,
        },
        { courseOfferingId: fullCourse!.id },
      ),
    ).rejects.toThrow(/Cupo agotado/);
  });

  it('4. Rechaza inscripción cuando existe choque de horario (Lunes 08:30-10:30 vs 08:00-10:00)', async () => {
    const res = await authService.login({
      email: 'estudiante1@unicen.edu.bo',
      password: 'Unicen2026!',
    });
    const offerings = await offeringsService.getOfferings();
    const conflictCourse = offerings.find((o) => o.subjectCode === 'IIA-402');
    expect(conflictCourse).toBeDefined();

    await expect(
      enrollmentsService.enroll(
        {
          id: res.user.id,
          email: res.user.email,
          role: res.user.role,
          registrationNumber: res.user.registrationNumber,
          fullName: res.user.fullName,
        },
        { courseOfferingId: conflictCourse!.id },
      ),
    ).rejects.toThrow(/Choque de horario el día LUNES/);
  });

  it('5. Permite inscripción válida y luego retiro con baja lógica liberando el cupo', async () => {
    const res = await authService.login({
      email: 'estudiante1@unicen.edu.bo',
      password: 'Unicen2026!',
    });
    const offerings = await offeringsService.getOfferings();
    const validCourse = offerings.find((o) => o.subjectCode === 'IIA-301');
    expect(validCourse).toBeDefined();
    const initialCount = validCourse!.enrolledCount;

    const userCtx = {
      id: res.user.id,
      email: res.user.email,
      role: res.user.role,
      registrationNumber: res.user.registrationNumber,
      fullName: res.user.fullName,
    };

    const enrolled = await enrollmentsService.enroll(userCtx, {
      courseOfferingId: validCourse!.id,
    });
    expect(enrolled.id).toBeDefined();

    const afterEnroll = await offeringsService.getOfferingById(validCourse!.id);
    expect(afterEnroll.enrolledCount).toBe(initialCount + 1);

    // Retiro por baja lógica
    const withdrawn = await enrollmentsService.withdraw(userCtx, enrolled.id);
    expect(withdrawn.message).toContain('baja lógica');

    const afterWithdraw = await offeringsService.getOfferingById(
      validCourse!.id,
    );
    expect(afterWithdraw.enrolledCount).toBe(initialCount);
  });

  it('6. Consulta Kardex estudiantil con promedio ponderado y desglose de evaluaciones', async () => {
    const res = await authService.login({
      email: 'estudiante1@unicen.edu.bo',
      password: 'Unicen2026!',
    });
    const kardex = await gradingService.getStudentKardex(res.user.id);
    expect(kardex.summary.approvedCourses).toBeGreaterThanOrEqual(1);
    expect(kardex.records.length).toBeGreaterThanOrEqual(2);
  });
});
