import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm';
import {
  DRIZZLE_DB,
  DrizzleDb,
} from '../../../core/database/database.module';
import {
  academicPeriodsTable,
  campusesTable,
  careersTable,
  courseEvaluationsTable,
  courseOfferingsTable,
  enrollmentsTable,
  studentGradesTable,
  subjectsTable,
  usersTable,
} from '../../../database/schema';
import {
  EVALUATION_STRATEGY,
  IEvaluationStrategy,
} from '../domain/evaluation-strategy.interface';
import {
  AcademicKardexResponse,
  CourseGradebookResponse,
  IGradingRepository,
  KardexCourseRecord,
  StudentGradebookRow,
} from '../domain/grading.repository.interface';

@Injectable()
export class DrizzleGradingRepository implements IGradingRepository {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: DrizzleDb,
    @Inject(EVALUATION_STRATEGY)
    private readonly evaluationStrategy: IEvaluationStrategy,
  ) {}

  async recordGradeTransactional(params: {
    enrollmentId: number;
    evaluationId: number;
    score: number;
    feedback?: string;
    gradedById: number;
    userRole?: string;
  }): Promise<StudentGradebookRow> {
    const courseOfferingId = await this.db.transaction(async (tx) => {
      const [enrollment] = await tx
        .select()
        .from(enrollmentsTable)
        .where(
          and(
            eq(enrollmentsTable.id, params.enrollmentId),
            eq(enrollmentsTable.isActive, true),
            isNull(enrollmentsTable.deletedAt),
          ),
        )
        .for('update');

      if (!enrollment) {
        throw new NotFoundException(
          'La inscripción no existe o fue retirada.',
        );
      }

      if (params.userRole === 'DOCENTE') {
        const [offering] = await tx
          .select({ teacherId: courseOfferingsTable.teacherId })
          .from(courseOfferingsTable)
          .where(eq(courseOfferingsTable.id, enrollment.courseOfferingId))
          .limit(1);

        if (!offering || offering.teacherId !== params.gradedById) {
          throw new ForbiddenException(
            'Acceso denegado: No tiene permisos para registrar calificaciones en un curso asignado a otro docente.',
          );
        }
      }

      const [evaluation] = await tx
        .select()
        .from(courseEvaluationsTable)
        .where(
          and(
            eq(courseEvaluationsTable.id, params.evaluationId),
            eq(courseEvaluationsTable.isActive, true),
            isNull(courseEvaluationsTable.deletedAt),
          ),
        );

      if (
        !evaluation ||
        evaluation.courseOfferingId !== enrollment.courseOfferingId
      ) {
        throw new BadRequestException(
          'La evaluación seleccionada no pertenece al curso de esta inscripción.',
        );
      }

      // Verificar si ya existe una nota activa para esta evaluación e inscripción
      const [existingGrade] = await tx
        .select()
        .from(studentGradesTable)
        .where(
          and(
            eq(studentGradesTable.enrollmentId, params.enrollmentId),
            eq(studentGradesTable.evaluationId, params.evaluationId),
            eq(studentGradesTable.isActive, true),
            isNull(studentGradesTable.deletedAt),
          ),
        )
        .limit(1);

      if (existingGrade) {
        await tx
          .update(studentGradesTable)
          .set({
            score: String(params.score),
            feedback: params.feedback ?? existingGrade.feedback,
            gradedById: params.gradedById,
            updatedAt: new Date(),
          })
          .where(eq(studentGradesTable.id, existingGrade.id));
      } else {
        await tx.insert(studentGradesTable).values({
          enrollmentId: params.enrollmentId,
          evaluationId: params.evaluationId,
          score: String(params.score),
          feedback: params.feedback ?? null,
          gradedById: params.gradedById,
        });
      }

      // Recalcular nota final y estado mediante el Patrón Strategy (WeightedEvaluationStrategy)
      const allEvaluations = await tx
        .select()
        .from(courseEvaluationsTable)
        .where(
          and(
            eq(
              courseEvaluationsTable.courseOfferingId,
              enrollment.courseOfferingId,
            ),
            eq(courseEvaluationsTable.isActive, true),
            isNull(courseEvaluationsTable.deletedAt),
          ),
        );

      const allGrades = await tx
        .select()
        .from(studentGradesTable)
        .where(
          and(
            eq(studentGradesTable.enrollmentId, params.enrollmentId),
            eq(studentGradesTable.isActive, true),
            isNull(studentGradesTable.deletedAt),
          ),
        );

      const calc = this.evaluationStrategy.calculate(
        allEvaluations.map((e) => ({
          id: e.id,
          name: e.name,
          weightPercentage: Number(e.weightPercentage),
        })),
        allGrades.map((g) => ({
          evaluationId: g.evaluationId,
          score: Number(g.score),
        })),
      );

      await tx
        .update(enrollmentsTable)
        .set({
          finalScore: String(calc.accumulatedScore),
          status: calc.academicStatus,
          updatedAt: new Date(),
        })
        .where(eq(enrollmentsTable.id, params.enrollmentId));

      return enrollment.courseOfferingId;
    });

    const gradebook = await this.getCourseGradebook(courseOfferingId);
    const studentRow = gradebook.students.find(
      (s) => s.enrollmentId === params.enrollmentId,
    );
    return studentRow!;
  }

  async getCourseGradebook(
    courseOfferingId: number,
  ): Promise<CourseGradebookResponse> {
    const [courseInfo] = await this.db
      .select({
        offering: courseOfferingsTable,
        subject: subjectsTable,
        period: academicPeriodsTable,
        teacher: usersTable,
      })
      .from(courseOfferingsTable)
      .innerJoin(
        subjectsTable,
        eq(courseOfferingsTable.subjectId, subjectsTable.id),
      )
      .innerJoin(
        academicPeriodsTable,
        eq(courseOfferingsTable.periodId, academicPeriodsTable.id),
      )
      .innerJoin(usersTable, eq(courseOfferingsTable.teacherId, usersTable.id))
      .where(
        and(
          eq(courseOfferingsTable.id, courseOfferingId),
          eq(courseOfferingsTable.isActive, true),
          isNull(courseOfferingsTable.deletedAt),
        ),
      )
      .limit(1);

    if (!courseInfo) {
      throw new NotFoundException('El curso solicitado no existe.');
    }

    const evaluations = await this.db
      .select()
      .from(courseEvaluationsTable)
      .where(
        and(
          eq(courseEvaluationsTable.courseOfferingId, courseOfferingId),
          eq(courseEvaluationsTable.isActive, true),
          isNull(courseEvaluationsTable.deletedAt),
        ),
      )
      .orderBy(asc(courseEvaluationsTable.orderIndex));

    const enrolledStudents = await this.db
      .select({
        enrollment: enrollmentsTable,
        student: usersTable,
      })
      .from(enrollmentsTable)
      .innerJoin(usersTable, eq(enrollmentsTable.studentId, usersTable.id))
      .where(
        and(
          eq(enrollmentsTable.courseOfferingId, courseOfferingId),
          eq(enrollmentsTable.isActive, true),
          isNull(enrollmentsTable.deletedAt),
        ),
      )
      .orderBy(asc(usersTable.lastName), asc(usersTable.firstName));

    const enrollmentIds = enrolledStudents.map((e) => e.enrollment.id);
    const grades =
      enrollmentIds.length > 0
        ? await this.db
            .select()
            .from(studentGradesTable)
            .where(
              and(
                inArray(studentGradesTable.enrollmentId, enrollmentIds),
                eq(studentGradesTable.isActive, true),
                isNull(studentGradesTable.deletedAt),
              ),
            )
        : [];

    const evalWeights = evaluations.map((ev) => ({
      id: ev.id,
      name: ev.name,
      weightPercentage: Number(ev.weightPercentage),
      orderIndex: ev.orderIndex,
    }));

    const students: StudentGradebookRow[] = enrolledStudents.map((es) => {
      const studentGrades = grades.filter(
        (g) => g.enrollmentId === es.enrollment.id,
      );

      const calc = this.evaluationStrategy.calculate(
        evalWeights,
        studentGrades.map((g) => ({
          evaluationId: g.evaluationId,
          score: Number(g.score),
        })),
      );

      const gradeEntries = evalWeights.map((ev) => {
        const found = studentGrades.find((g) => g.evaluationId === ev.id);
        const rawScore = found ? Number(found.score) : 0;
        const weighted = Math.round(((rawScore * ev.weightPercentage) / 100) * 100) / 100;
        return {
          id: found?.id ?? 0,
          evaluationId: ev.id,
          evaluationName: ev.name,
          weightPercentage: ev.weightPercentage,
          score: found ? Number(found.score) : -1, // -1 indica pendiente de calificar
          weightedContribution: found ? weighted : 0,
          feedback: found?.feedback ?? null,
        };
      });

      return {
        enrollmentId: es.enrollment.id,
        studentId: es.student.id,
        studentName: `${es.student.firstName} ${es.student.lastName}`,
        studentRegistrationNumber: es.student.registrationNumber,
        studentEmail: es.student.email,
        status: es.enrollment.status,
        finalScore: calc.accumulatedScore,
        evaluatedWeightPercentage: calc.evaluatedWeightPercentage,
        grades: gradeEntries,
      };
    });

    return {
      courseOfferingId: courseInfo.offering.id,
      subjectCode: courseInfo.subject.code,
      subjectName: courseInfo.subject.name,
      groupCode: courseInfo.offering.groupCode,
      periodCode: courseInfo.period.code,
      teacherId: courseInfo.teacher.id,
      teacherName: `${courseInfo.teacher.firstName} ${courseInfo.teacher.lastName}`,
      evaluations: evalWeights,
      students,
    };
  }

  async getStudentKardex(studentId: number): Promise<AcademicKardexResponse> {
    const [studentInfo] = await this.db
      .select({
        user: usersTable,
        careerName: careersTable.name,
        campusName: campusesTable.name,
      })
      .from(usersTable)
      .leftJoin(careersTable, eq(usersTable.careerId, careersTable.id))
      .leftJoin(campusesTable, eq(usersTable.campusId, campusesTable.id))
      .where(
        and(
          eq(usersTable.id, studentId),
          eq(usersTable.isActive, true),
          isNull(usersTable.deletedAt),
        ),
      )
      .limit(1);

    if (!studentInfo) {
      throw new NotFoundException('El estudiante solicitado no existe.');
    }

    const enrollments = await this.db
      .select({
        enrollment: enrollmentsTable,
        offering: courseOfferingsTable,
        subject: subjectsTable,
        period: academicPeriodsTable,
        teacher: usersTable,
      })
      .from(enrollmentsTable)
      .innerJoin(
        courseOfferingsTable,
        eq(enrollmentsTable.courseOfferingId, courseOfferingsTable.id),
      )
      .innerJoin(
        subjectsTable,
        eq(courseOfferingsTable.subjectId, subjectsTable.id),
      )
      .innerJoin(
        academicPeriodsTable,
        eq(enrollmentsTable.periodId, academicPeriodsTable.id),
      )
      .innerJoin(usersTable, eq(courseOfferingsTable.teacherId, usersTable.id))
      .where(
        and(
          eq(enrollmentsTable.studentId, studentId),
          eq(enrollmentsTable.isActive, true),
          isNull(enrollmentsTable.deletedAt),
        ),
      )
      .orderBy(desc(academicPeriodsTable.id), asc(subjectsTable.semesterLevel));

    if (!enrollments.length) {
      return {
        studentId: studentInfo.user.id,
        studentName: `${studentInfo.user.firstName} ${studentInfo.user.lastName}`,
        registrationNumber: studentInfo.user.registrationNumber,
        careerName: studentInfo.careerName,
        campusName: studentInfo.campusName,
        summary: {
          totalEnrolledCourses: 0,
          approvedCourses: 0,
          failedCourses: 0,
          inProgressCourses: 0,
          approvedCredits: 0,
          generalAverage: 0,
        },
        records: [],
      };
    }

    const offeringIds = [...new Set(enrollments.map((e) => e.offering.id))];
    const enrollmentIds = enrollments.map((e) => e.enrollment.id);

    const allEvaluations = await this.db
      .select()
      .from(courseEvaluationsTable)
      .where(
        and(
          inArray(courseEvaluationsTable.courseOfferingId, offeringIds),
          eq(courseEvaluationsTable.isActive, true),
          isNull(courseEvaluationsTable.deletedAt),
        ),
      )
      .orderBy(asc(courseEvaluationsTable.orderIndex));

    const allGrades = await this.db
      .select()
      .from(studentGradesTable)
      .where(
        and(
          inArray(studentGradesTable.enrollmentId, enrollmentIds),
          eq(studentGradesTable.isActive, true),
          isNull(studentGradesTable.deletedAt),
        ),
      );

    const records: KardexCourseRecord[] = enrollments.map((e) => {
      const courseEvals = allEvaluations
        .filter((ev) => ev.courseOfferingId === e.offering.id)
        .map((ev) => ({
          id: ev.id,
          name: ev.name,
          weightPercentage: Number(ev.weightPercentage),
        }));

      const courseGrades = allGrades.filter(
        (g) => g.enrollmentId === e.enrollment.id,
      );

      const calc = this.evaluationStrategy.calculate(
        courseEvals,
        courseGrades.map((g) => ({
          evaluationId: g.evaluationId,
          score: Number(g.score),
        })),
      );

      const evaluationsBreakdown = courseEvals.map((ev) => {
        const gradeObj = courseGrades.find((g) => g.evaluationId === ev.id);
        const score = gradeObj ? Number(gradeObj.score) : null;
        return {
          evaluationId: ev.id,
          evaluationName: ev.name,
          weightPercentage: ev.weightPercentage,
          score,
          weightedPoints:
            score !== null
              ? Math.round(((score * ev.weightPercentage) / 100) * 100) / 100
              : 0,
          feedback: gradeObj?.feedback ?? null,
        };
      });

      return {
        enrollmentId: e.enrollment.id,
        courseOfferingId: e.offering.id,
        periodId: e.period.id,
        periodCode: e.period.code,
        periodName: e.period.name,
        subjectCode: e.subject.code,
        subjectName: e.subject.name,
        credits: e.subject.credits,
        semesterLevel: e.subject.semesterLevel,
        groupCode: e.offering.groupCode,
        teacherName: `${e.teacher.firstName} ${e.teacher.lastName}`,
        status: calc.academicStatus,
        finalScore: calc.accumulatedScore,
        evaluatedWeightPercentage: calc.evaluatedWeightPercentage,
        evaluationsBreakdown,
      };
    });

    const approvedCourses = records.filter(
      (r) => r.status === 'APROBADA',
    ).length;
    const failedCourses = records.filter(
      (r) => r.status === 'REPROBADA',
    ).length;
    const inProgressCourses = records.filter(
      (r) => r.status === 'ACTIVA',
    ).length;
    const approvedCredits = records
      .filter((r) => r.status === 'APROBADA')
      .reduce((acc, r) => acc + r.credits, 0);

    const scoredRecords = records.filter((r) => r.evaluatedWeightPercentage > 0);
    const generalAverage =
      scoredRecords.length > 0
        ? Math.round(
            (scoredRecords.reduce((acc, r) => acc + (r.finalScore ?? 0), 0) /
              scoredRecords.length) *
              100,
          ) / 100
        : 0;

    return {
      studentId: studentInfo.user.id,
      studentName: `${studentInfo.user.firstName} ${studentInfo.user.lastName}`,
      registrationNumber: studentInfo.user.registrationNumber,
      careerName: studentInfo.careerName,
      campusName: studentInfo.campusName,
      summary: {
        totalEnrolledCourses: records.length,
        approvedCourses,
        failedCourses,
        inProgressCourses,
        approvedCredits,
        generalAverage,
      },
      records,
    };
  }
}
