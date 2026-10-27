import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './core/filters/http-exception.filter';
import { AuthService } from './modules/identity-and-access/application/auth.service';
import { CatalogService } from './modules/academic-catalog/application/catalog.service';
import { CourseOfferingsService } from './modules/course-offerings/application/course-offerings.service';
import { EnrollmentsService } from './modules/student-enrollments/application/enrollments.service';
import { GradingService } from './modules/grading-and-records/application/grading.service';

describe('SIIA UNICEN 2026 - Pruebas Integrales de los 5 Módulos sobre PostgreSQL', () => {
  let app: INestApplication;
  let authService: AuthService;
  let catalogService: CatalogService;
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
    catalogService = app.get(CatalogService);
    offeringsService = app.get(CourseOfferingsService);
    enrollmentsService = app.get(EnrollmentsService);
    gradingService = app.get(GradingService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('[Módulo 1: Identity & Access] Login PASETO v4.public y ciclo de vida con Baja Lógica de Usuario', async () => {
    const res = await authService.login({
      email: 'estudiante1@unicen.edu.bo',
      password: 'Unicen2026!',
    });

    expect(res.accessToken.startsWith('v4.public.')).toBe(true);
    expect(res.user.role).toBe('ESTUDIANTE');

    // Crear usuario temporal y aplicar eliminación lógica (Soft Delete)
    const uniqueSuffix = Date.now();
    const tempUser = await authService.registerUser({
      registrationNumber: `RU-TEST-${uniqueSuffix}`,
      dni: '9988776 CB',
      email: `test.${uniqueSuffix}@unicen.edu.bo`,
      password: 'Unicen2026!',
      firstName: 'Usuario',
      lastName: 'Temporal',
      role: 'ESTUDIANTE',
    });
    expect(tempUser.id).toBeDefined();

    const deleted = await authService.softDeleteUser(tempUser.id);
    expect(deleted.message).toContain('baja lógica');

    await expect(authService.getProfile(tempUser.id)).rejects.toThrow(
      /no encontrado o inactivo/,
    );
  });

  it('[Módulo 2: Academic Catalog] Consulta de Sede Cochabamba, Carreras y CRUD de Materias con Baja Lógica', async () => {
    const campuses = await catalogService.getCampuses();
    const careers = await catalogService.getCareers();
    expect(campuses.length).toBe(1);
    expect(campuses[0].city).toBe('Cochabamba');
    expect(careers.length).toBeGreaterThanOrEqual(4);

    const uniqueCode = `TST-${Date.now().toString().slice(-4)}`;
    const createdSubject = await catalogService.createSubject({
      code: uniqueCode,
      name: 'Materia de Prueba Automatizada',
      credits: 4,
      semesterLevel: 2,
      hoursPerWeek: 4,
      careerId: careers[0].id,
      description: 'Verificación de catálogo y soft delete',
    });
    expect(createdSubject.code).toBe(uniqueCode);

    const softDeleted = await catalogService.softDeleteSubject(
      createdSubject.id,
    );
    expect(softDeleted.message).toContain('baja lógica');
  });

  it('[Módulo 3: Course Offerings] Control de Gestiones Académicas y Validación de Ponderaciones (100%)', async () => {
    const periods = await offeringsService.getPeriods();
    const current = periods.find((p) => p.code === 'I-2026');
    expect(current).toBeDefined();

    // Cerrar y volver a abrir inscripciones de la gestión I-2026
    const closed = await offeringsService.togglePeriodEnrollments(
      current!.id,
      false,
    );
    expect(closed.enrollmentsOpen).toBe(false);

    const reopened = await offeringsService.togglePeriodEnrollments(
      current!.id,
      true,
    );
    expect(reopened.enrollmentsOpen).toBe(true);

    // Verificar rechazo de ponderaciones que no suman 100%
    const offerings = await offeringsService.getOfferings();
    await expect(
      offeringsService.updateCourseEvaluations(offerings[0].id, {
        evaluations: [
          { name: 'Parcial 1', weightPercentage: 40 },
          { name: 'Parcial 2', weightPercentage: 40 },
        ],
      }),
    ).rejects.toThrow(/exactamente 100%/);
  });

  it('[Módulo 4: Student Enrollments] Validación de Duplicados, Cupo Agotado, Choque de Horario y Retiro con Baja Lógica', async () => {
    const res = await authService.login({
      email: 'estudiante1@unicen.edu.bo',
      password: 'Unicen2026!',
    });
    const userCtx = {
      id: res.user.id,
      email: res.user.email,
      role: res.user.role,
      registrationNumber: res.user.registrationNumber,
      fullName: res.user.fullName,
    };

    const offerings = await offeringsService.getOfferings();

    // 4.1 Inscripción duplicada
    const arqCourse = offerings.find((o) => o.subjectCode === 'IIA-201')!;
    await expect(
      enrollmentsService.enroll(userCtx, { courseOfferingId: arqCourse.id }),
    ).rejects.toThrow(/Inscripción duplicada/);

    // 4.2 Cupo agotado (2/2)
    const fullCourse = offerings.find((o) => o.subjectCode === 'MED-101')!;
    await expect(
      enrollmentsService.enroll(userCtx, { courseOfferingId: fullCourse.id }),
    ).rejects.toThrow(/Cupo agotado/);

    // 4.3 Choque de horario (Lunes 08:30-10:30 vs Lunes 08:00-10:00)
    const conflictCourse = offerings.find((o) => o.subjectCode === 'IIA-402')!;
    await expect(
      enrollmentsService.enroll(userCtx, {
        courseOfferingId: conflictCourse.id,
      }),
    ).rejects.toThrow(/Choque de horario el día LUNES/);

    // 4.4 Inscripción exitosa y retiro con baja lógica liberando cupo
    const validCourse = offerings.find((o) => o.subjectCode === 'IIA-301')!;
    const beforeQuota = validCourse.enrolledCount;

    const enrolled = await enrollmentsService.enroll(userCtx, {
      courseOfferingId: validCourse.id,
    });
    expect(enrolled.id).toBeDefined();

    const afterEnroll = await offeringsService.getOfferingById(validCourse.id);
    expect(afterEnroll.enrolledCount).toBe(beforeQuota + 1);

    await enrollmentsService.withdraw(userCtx, enrolled.id);
    const afterWithdraw = await offeringsService.getOfferingById(
      validCourse.id,
    );
    expect(afterWithdraw.enrolledCount).toBe(beforeQuota);
  });

  it('[Módulo 5: Grading & Records] Planilla Docente, Registro de Notas Strategy y Kardex Académico', async () => {
    const teacherLogin = await authService.login({
      email: 'docente.ia@unicen.edu.bo',
      password: 'Unicen2026!',
    });
    const teacherCtx = {
      id: teacherLogin.user.id,
      email: teacherLogin.user.email,
      role: teacherLogin.user.role,
      registrationNumber: teacherLogin.user.registrationNumber,
      fullName: teacherLogin.user.fullName,
    };

    const offerings = await offeringsService.getOfferings();
    const arqCourse = offerings.find((o) => o.subjectCode === 'IIA-201')!;

    const gradebook = await gradingService.getCourseGradebook(arqCourse.id);
    expect(gradebook.evaluations.length).toBeGreaterThanOrEqual(3);
    expect(gradebook.students.length).toBeGreaterThanOrEqual(1);

    const targetStudent = gradebook.students[0];
    const thirdEval = gradebook.evaluations[2]; // Laboratorios Prácticos (20%)

    const updatedStudentRow = await gradingService.recordGrade(teacherCtx, {
      enrollmentId: targetStudent.enrollmentId,
      evaluationId: thirdEval.id,
      score: 95,
      feedback: 'Laboratorio verificado en prueba automatizada',
    });

    expect(updatedStudentRow.finalScore).toBeGreaterThan(43.75);

    const kardex = await gradingService.getStudentKardex(
      targetStudent.studentId,
    );
    expect(kardex.summary.approvedCourses).toBeGreaterThanOrEqual(1);
    expect(kardex.summary.generalAverage).toBeGreaterThan(51);
  });

  it('[Módulo 6: Seguridad & Aislamiento de Roles] Prevención de acceso cruzado entre docentes y roles', async () => {
    const teacherLogin = await authService.login({
      email: 'docente.ia@unicen.edu.bo',
      password: 'Unicen2026!',
    });
    const teacherCtx = {
      id: teacherLogin.user.id,
      email: teacherLogin.user.email,
      role: teacherLogin.user.role,
      registrationNumber: teacherLogin.user.registrationNumber,
      fullName: teacherLogin.user.fullName,
    };

    const offerings = await offeringsService.getOfferings();
    const otherTeacherCourse = offerings.find(
      (o) => o.teacherId !== teacherCtx.id,
    )!;
    expect(otherTeacherCourse).toBeDefined();

    // 6.1 Un docente no puede consultar la planilla de otro docente
    await expect(
      gradingService.getCourseGradebook(otherTeacherCourse.id, teacherCtx),
    ).rejects.toThrow(/No tiene permisos para consultar la planilla/);

    // 6.2 Un docente no puede modificar el esquema de evaluaciones de otro docente
    await expect(
      offeringsService.updateCourseEvaluations(
        otherTeacherCourse.id,
        {
          evaluations: [
            { name: 'Examen 1', weightPercentage: 50 },
            { name: 'Examen 2', weightPercentage: 50 },
          ],
        },
        teacherCtx,
      ),
    ).rejects.toThrow(/No tiene permisos para modificar el esquema evaluativo/);
  });
});
