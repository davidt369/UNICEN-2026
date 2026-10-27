export const GRADING_REPOSITORY = 'GRADING_REPOSITORY';

export interface GradeEntryItem {
  id: number;
  evaluationId: number;
  evaluationName: string;
  weightPercentage: number;
  score: number;
  weightedContribution: number;
  feedback: string | null;
}

export interface StudentGradebookRow {
  enrollmentId: number;
  studentId: number;
  studentName: string;
  studentRegistrationNumber: string;
  studentEmail: string;
  status: 'ACTIVA' | 'RETIRADA' | 'APROBADA' | 'REPROBADA';
  finalScore: number | null;
  evaluatedWeightPercentage: number;
  grades: GradeEntryItem[];
}

export interface CourseGradebookResponse {
  courseOfferingId: number;
  subjectCode: string;
  subjectName: string;
  groupCode: string;
  periodCode: string;
  teacherId: number;
  teacherName: string;
  evaluations: Array<{
    id: number;
    name: string;
    weightPercentage: number;
    orderIndex: number;
  }>;
  students: StudentGradebookRow[];
}

export interface KardexCourseRecord {
  enrollmentId: number;
  courseOfferingId: number;
  periodId: number;
  periodCode: string;
  periodName: string;
  subjectCode: string;
  subjectName: string;
  credits: number;
  semesterLevel: number;
  groupCode: string;
  teacherName: string;
  status: 'ACTIVA' | 'RETIRADA' | 'APROBADA' | 'REPROBADA';
  finalScore: number | null;
  evaluatedWeightPercentage: number;
  evaluationsBreakdown: Array<{
    evaluationId: number;
    evaluationName: string;
    weightPercentage: number;
    score: number | null;
    weightedPoints: number;
    feedback: string | null;
  }>;
}

export interface AcademicKardexResponse {
  studentId: number;
  studentName: string;
  registrationNumber: string;
  careerName: string | null;
  campusName: string | null;
  summary: {
    totalEnrolledCourses: number;
    approvedCourses: number;
    failedCourses: number;
    inProgressCourses: number;
    approvedCredits: number;
    generalAverage: number;
  };
  records: KardexCourseRecord[];
}

export interface IGradingRepository {
  recordGradeTransactional(params: {
    enrollmentId: number;
    evaluationId: number;
    score: number;
    feedback?: string;
    gradedById: number;
  }): Promise<StudentGradebookRow>;
  getCourseGradebook(courseOfferingId: number): Promise<CourseGradebookResponse>;
  getStudentKardex(studentId: number): Promise<AcademicKardexResponse>;
}
