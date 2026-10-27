import React, { useEffect, useState } from 'react';
import {
  GraduationCap,
  Layers,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Building2,
  Calendar,
  Award,
  Users,
  BookMarked,
  Sparkles,
} from 'lucide-react';
import { apiRequest, AuthUser } from '../../lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Progress } from '../../components/ui/progress';
import { Badge, Button } from '../../components/ui/primitives';

interface EnterpriseDashboardViewProps {
  user: AuthUser;
  onNavigate: (tab: string) => void;
}

export const EnterpriseDashboardView: React.FC<EnterpriseDashboardViewProps> = ({
  user,
  onNavigate,
}) => {
  const [loading, setLoading] = useState(true);

  // Estados comunes y específicos
  const [periods, setPeriods] = useState<any[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<any>(null);

  // Estados para Estudiante
  const [studentEnrollments, setStudentEnrollments] = useState<any[]>([]);
  const [studentKardex, setStudentKardex] = useState<any | null>(null);
  const [careerOfferings, setCareerOfferings] = useState<any[]>([]);

  // Estados para Docente
  const [teacherOfferings, setTeacherOfferings] = useState<any[]>([]);

  // Estados para Administrador
  const [campuses, setCampuses] = useState<any[]>([]);
  const [careers, setCareers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [allOfferings, setAllOfferings] = useState<any[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const pers = await apiRequest<any[]>('/course-offerings/periods');
        setPeriods(pers);
        const curr = pers.find((p) => p.isCurrent) || pers[0];
        setCurrentPeriod(curr);

        if (user.role === 'ESTUDIANTE') {
          const [enrs, kard, offs] = await Promise.all([
            apiRequest<any[]>(
              curr
                ? `/enrollments/my?periodId=${curr.id}`
                : '/enrollments/my',
            ).catch(() => []),
            apiRequest<any>('/grading/my-kardex').catch(() => null),
            apiRequest<any[]>(
              curr && user.careerId
                ? `/course-offerings?periodId=${curr.id}&careerId=${user.careerId}`
                : curr
                  ? `/course-offerings?periodId=${curr.id}`
                  : '/course-offerings',
            ).catch(() => []),
          ]);
          setStudentEnrollments(enrs);
          setStudentKardex(kard);
          setCareerOfferings(offs);
        } else if (user.role === 'DOCENTE') {
          const teacherCourses = await apiRequest<any[]>(
            `/course-offerings?teacherId=${user.id}`,
          ).catch(() => []);
          setTeacherOfferings(teacherCourses);
        } else if (user.role === 'ADMINISTRADOR') {
          const [camps, cars, subs, offs] = await Promise.all([
            apiRequest<any[]>('/catalog/campuses').catch(() => []),
            apiRequest<any[]>('/catalog/careers').catch(() => []),
            apiRequest<any[]>('/catalog/subjects').catch(() => []),
            apiRequest<any[]>('/course-offerings').catch(() => []),
          ]);
          setCampuses(camps);
          setCareers(cars);
          setSubjects(subs);
          setAllOfferings(offs);
        }
      } catch (err) {
        console.error('Error cargando panel de control:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user.id, user.role, user.careerId]);

  if (loading) {
    return (
      <Card className="p-10 text-center text-sm text-slate-500">
        Consultando información académica en tiempo real desde la base de datos...
      </Card>
    );
  }

  // =========================================================================
  // VISTA 1: DASHBOARD PARA ESTUDIANTE (Solo datos académicos propios)
  // =========================================================================
  if (user.role === 'ESTUDIANTE') {
    const totalCredits = studentEnrollments.reduce(
      (acc, e) => acc + (e.credits || 0),
      0,
    );
    const kardexSummary = studentKardex?.summary || {
      generalAverage: 0,
      approvedCourses: 0,
      totalEnrolledCourses: 0,
      approvedCredits: 0,
    };
    const enrolledIds = new Set(
      studentEnrollments.map((e) => e.courseOfferingId),
    );

    return (
      <div className="space-y-6">
        {/* Cabecera Estudiantil Personalizada */}
        <div className="bg-white border border-border rounded-lg p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-lg font-bold text-[#002B49] tracking-tight">
                Mi Portal Académico — {user.fullName}
              </h2>
              <Badge variant="navy">{user.careerName || 'Plan Regular'}</Badge>
              <Badge
                variant={currentPeriod?.enrollmentsOpen ? 'success' : 'danger'}
              >
                {currentPeriod?.code}:{' '}
                {currentPeriod?.enrollmentsOpen
                  ? 'Matrícula Abierta'
                  : 'Matrícula Cerrada'}
              </Badge>
            </div>
            <p className="text-xs text-slate-600">
              Registro Universitario (R.U.):{' '}
              <span className="font-mono font-semibold text-slate-800">
                {user.registrationNumber}
              </span>{' '}
              • {user.campusName} • Gestión:{' '}
              <span className="font-semibold">{currentPeriod?.name}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="orange"
              size="sm"
              onClick={() => onNavigate('enrollments')}
            >
              <GraduationCap className="w-4 h-4" />
              Inscribir Materias
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('kardex')}
            >
              <Award className="w-4 h-4 text-[#002B49]" />
              Ver Mi Kardex Oficial
            </Button>
          </div>
        </div>

        {/* Cinta de Indicadores Académicos del Estudiante */}
        <div className="bg-white border border-border rounded-lg shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
          <div className="p-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                Materias en Curso ({currentPeriod?.code})
              </span>
              <BookOpen className="w-4 h-4 text-[#002B49]" />
            </div>
            <div className="text-2xl font-bold text-[#002B49] tabular-nums">
              {studentEnrollments.length}{' '}
              <span className="text-sm font-normal text-slate-500">
                asignaturas
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {totalCredits} créditos académicos cursados
            </p>
          </div>

          <div className="p-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                Promedio General Ponderado
              </span>
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-[#002B49] tabular-nums">
              {kardexSummary.generalAverage}{' '}
              <span className="text-sm font-normal text-slate-500">/ 100</span>
            </div>
            <p className="text-xs text-slate-500">
              {kardexSummary.generalAverage >= 51
                ? 'Rendimiento Aprobatorio'
                : 'Sin promedio registrado'}
            </p>
          </div>

          <div className="p-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                Avance Curricular
              </span>
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-[#002B49] tabular-nums">
              {kardexSummary.approvedCourses}{' '}
              <span className="text-sm font-normal text-slate-500">
                aprobadas
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {kardexSummary.approvedCredits} créditos acumulados
            </p>
          </div>

          <div className="p-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                Estado de Matrícula
              </span>
              <Badge variant="success" className="text-[10px] py-0 px-1.5">
                REGULAR
              </Badge>
            </div>
            <div className="text-sm font-bold text-[#002B49]">
              Estudiante Habilitado
            </div>
            <p className="text-xs text-slate-500">
              {user.campusName?.split('(')[0] || 'UNICEN Central'}
            </p>
          </div>
        </div>

        {/* Sección 1: Mis Asignaturas Inscritas y Horarios */}
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
            <div className="space-y-0.5">
              <CardTitle>
                Mis Asignaturas Inscritas ({currentPeriod?.code})
              </CardTitle>
              <CardDescription>
                Cursos con matrícula activa en el período actual y sus horarios
                programados.
              </CardDescription>
            </div>
            <Badge variant="navy" className="tabular-nums">
              {studentEnrollments.length} Inscritas
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {studentEnrollments.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <p className="text-xs text-slate-500">
                  Aún no tienes asignaturas inscritas en la gestión{' '}
                  {currentPeriod?.code}.
                </p>
                <Button
                  variant="orange"
                  size="sm"
                  onClick={() => onNavigate('enrollments')}
                >
                  <GraduationCap className="w-4 h-4" />
                  Ir a Inscripción de Cursos
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sigla & Asignatura</TableHead>
                    <TableHead>Paralelo & Docente</TableHead>
                    <TableHead>Horario y Aula</TableHead>
                    <TableHead>Nota Ponderada</TableHead>
                    <TableHead className="text-right">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentEnrollments.map((enr) => (
                    <TableRow key={enr.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#002B49] bg-slate-100 px-1.5 py-0.5 rounded">
                            {enr.subjectCode}
                          </span>
                          <span className="font-semibold text-slate-900">
                            {enr.subjectName}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {enr.credits} Créditos Académicos
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-xs text-slate-800">
                          {enr.groupCode}
                        </div>
                        <div className="text-xs text-slate-500">
                          {enr.teacherName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {enr.schedules?.map((s: any) => (
                            <span
                              key={s.id}
                              className="inline-flex items-center gap-1.5 text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 w-fit"
                            >
                              <Clock className="w-3 h-3 text-[#002B49]" />
                              <strong>{s.dayOfWeek}:</strong> {s.startTime}–
                              {s.endTime} ({s.classroom})
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-[#002B49]">
                        {enr.finalScore !== null
                          ? `${enr.finalScore} / 100`
                          : 'En evaluación'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            enr.status === 'APROBADA'
                              ? 'success'
                              : enr.status === 'REPROBADA'
                                ? 'danger'
                                : 'navy'
                          }
                        >
                          {enr.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Sección 2: Oferta Curricular para Mi Carrera */}
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
            <div className="space-y-0.5">
              <CardTitle>
                Oferta Académica Habilitada para tu Carrera ({user.careerName})
              </CardTitle>
              <CardDescription>
                Paralelos ofertados en {currentPeriod?.code} con plazas
                disponibles en tiempo real.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('enrollments')}
            >
              Ver Módulo de Inscripción Completo
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sigla & Materia</TableHead>
                  <TableHead>Paralelo / Docente</TableHead>
                  <TableHead>Horarios</TableHead>
                  <TableHead>Plazas Disponibles</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {careerOfferings.map((off) => {
                  const isEnrolled = enrolledIds.has(off.id);
                  const isFull = off.availableQuota <= 0;
                  return (
                    <TableRow key={off.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#002B49] bg-slate-100 px-1.5 py-0.5 rounded">
                            {off.subjectCode}
                          </span>
                          <span className="font-semibold text-slate-900">
                            {off.subjectName}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Semestre {off.semesterLevel} • {off.credits} Créditos
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-xs text-slate-800">
                          {off.groupCode}
                        </div>
                        <div className="text-xs text-slate-500">
                          {off.teacherName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {off.schedules?.map((s: any) => (
                            <span
                              key={s.id}
                              className="text-[11px] text-slate-600 font-mono"
                            >
                              {s.dayOfWeek}: {s.startTime}–{s.endTime} (
                              {s.classroom})
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={isFull ? 'danger' : 'success'}>
                          {isFull
                            ? 'CUPO AGOTADO'
                            : `${off.availableQuota} plazas libres`}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {isEnrolled ? (
                          <Badge variant="navy">INSCRITO</Badge>
                        ) : (
                          <Button
                            variant="orange"
                            size="sm"
                            disabled={isFull || !currentPeriod?.enrollmentsOpen}
                            onClick={() => onNavigate('enrollments')}
                          >
                            Inscribirme
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  // =========================================================================
  // VISTA 2: DASHBOARD PARA DOCENTE (Solo cursos a su cargo y planillas)
  // =========================================================================
  if (user.role === 'DOCENTE') {
    const totalStudentsInCharge = teacherOfferings.reduce(
      (acc, o) => acc + o.enrolledCount,
      0,
    );
    const totalMaxQuota = teacherOfferings.reduce(
      (acc, o) => acc + o.maxQuota,
      0,
    );

    return (
      <div className="space-y-6">
        {/* Cabecera Docente Personalizada */}
        <div className="bg-white border border-border rounded-lg p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-lg font-bold text-[#002B49] tracking-tight">
                Portal Académico Docente — {user.fullName}
              </h2>
              <Badge variant="navy">Cátedra Titular UNICEN</Badge>
              <Badge variant="success">Gestión {currentPeriod?.code}</Badge>
            </div>
            <p className="text-xs text-slate-600">
              Legajo Docente:{' '}
              <span className="font-mono font-semibold text-slate-800">
                {user.registrationNumber}
              </span>{' '}
              • {user.email} • {user.campusName || 'Cochabamba Sede Central'}
            </p>
          </div>

          <Button
            variant="orange"
            size="sm"
            onClick={() => onNavigate('grading')}
          >
            <BookOpen className="w-4 h-4" />
            Abrir Planilla de Calificaciones
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Cinta de Indicadores del Docente */}
        <div className="bg-white border border-border rounded-lg shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
          <div className="p-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                Cursos Asignados
              </span>
              <BookMarked className="w-4 h-4 text-[#002B49]" />
            </div>
            <div className="text-2xl font-bold text-[#002B49] tabular-nums">
              {teacherOfferings.length}{' '}
              <span className="text-sm font-normal text-slate-500">
                paralelos
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Gestión activa {currentPeriod?.code}
            </p>
          </div>

          <div className="p-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                Estudiantes a Cargo
              </span>
              <Users className="w-4 h-4 text-[#002B49]" />
            </div>
            <div className="text-2xl font-bold text-[#002B49] tabular-nums">
              {totalStudentsInCharge}{' '}
              <span className="text-sm font-normal text-slate-500">
                matriculados
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Sobre {totalMaxQuota} plazas habilitadas
            </p>
          </div>

          <div className="p-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                Esquema de Evaluación
              </span>
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-base font-bold text-emerald-700">
              100% Ponderado
            </div>
            <p className="text-xs text-slate-500">
              WeightedEvaluationStrategy activo
            </p>
          </div>

          <div className="p-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                Planilla Oficial
              </span>
              <Badge variant="navy" className="text-[10px] py-0 px-1.5">
                HABILITADA
              </Badge>
            </div>
            <div className="text-sm font-bold text-[#002B49]">
              Cálculo Automático
            </div>
            <p className="text-xs text-slate-500">
              Nota mínima de aprobación: 51.0 pts
            </p>
          </div>
        </div>

        {/* Sección: Mis Paralelos Asignados */}
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
            <div className="space-y-0.5">
              <CardTitle>
                Mis Paralelos Asignados y Planillas de Evaluación (
                {currentPeriod?.code})
              </CardTitle>
              <CardDescription>
                Acceda directamente a la planilla de calificaciones de cada
                curso para registrar notas y configurar evaluaciones.
              </CardDescription>
            </div>
            <Badge variant="navy" className="tabular-nums">
              {teacherOfferings.length} Cursos
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {teacherOfferings.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No tiene cursos asignados como docente titular en este período.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sigla & Asignatura</TableHead>
                    <TableHead>Paralelo / Carrera</TableHead>
                    <TableHead>Horarios y Aula</TableHead>
                    <TableHead>Estudiantes Inscritos</TableHead>
                    <TableHead className="text-right">Operación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teacherOfferings.map((off) => {
                    const pct =
                      off.maxQuota > 0
                        ? Math.round((off.enrolledCount / off.maxQuota) * 100)
                        : 0;
                    return (
                      <TableRow key={off.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#002B49] bg-slate-100 px-1.5 py-0.5 rounded">
                              {off.subjectCode}
                            </span>
                            <span className="font-semibold text-slate-900">
                              {off.subjectName}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {off.modality} • {off.campusName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-xs text-slate-800">
                            {off.groupCode}
                          </div>
                          <div className="text-xs text-slate-500">
                            {off.careerName} (Sem. {off.semesterLevel})
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {off.schedules?.map((s: any) => (
                              <span
                                key={s.id}
                                className="inline-flex items-center gap-1.5 text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 w-fit"
                              >
                                <Clock className="w-3 h-3 text-[#002B49]" />
                                <strong>{s.dayOfWeek}:</strong> {s.startTime}–
                                {s.endTime} ({s.classroom})
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="w-48">
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span>
                                {off.enrolledCount} / {off.maxQuota} alumnos
                              </span>
                              <span className="text-slate-500">{pct}%</span>
                            </div>
                            <Progress value={pct} className="h-1.5" />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="orange"
                            size="sm"
                            onClick={() => onNavigate('grading')}
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            Planilla de Notas
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // =========================================================================
  // VISTA 3: DASHBOARD INSTITUCIONAL PARA ADMINISTRADOR
  // =========================================================================
  const currentOfferings = currentPeriod
    ? allOfferings.filter((o) => o.periodId === currentPeriod.id)
    : allOfferings;

  const totalQuota = currentOfferings.reduce((acc, o) => acc + o.maxQuota, 0);
  const totalEnrolled = currentOfferings.reduce(
    (acc, o) => acc + o.enrolledCount,
    0,
  );
  const occupancyRate =
    totalQuota > 0 ? Math.round((totalEnrolled / totalQuota) * 100) : 0;
  const fullCoursesCount = currentOfferings.filter(
    (o) => o.availableQuota <= 0,
  ).length;

  const careerStats = careers.map((car) => {
    const carOfferings = currentOfferings.filter((o) => o.careerId === car.id);
    const carQuota = carOfferings.reduce((a, b) => a + b.maxQuota, 0);
    const carEnrolled = carOfferings.reduce((a, b) => a + b.enrolledCount, 0);
    const pct = carQuota > 0 ? Math.round((carEnrolled / carQuota) * 100) : 0;
    return {
      ...car,
      coursesCount: carOfferings.length,
      quota: carQuota,
      enrolled: carEnrolled,
      pct,
    };
  });

  return (
    <div className="space-y-6">
      {/* Cabecera Ejecutiva de Dirección Académica */}
      <div className="bg-white border border-border rounded-lg p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-lg font-bold text-[#002B49] tracking-tight">
              Centro de Mando y Dirección Académica — {user.fullName}
            </h2>
            <Badge
              variant={currentPeriod?.enrollmentsOpen ? 'success' : 'danger'}
            >
              {currentPeriod?.code}:{' '}
              {currentPeriod?.enrollmentsOpen
                ? 'Inscripciones Abiertas'
                : 'Inscripciones Cerradas'}
            </Badge>
          </div>
          <p className="text-xs text-slate-600">
            Control institucional nacional de oferta curricular, cupos
            transaccionales ACID, docentes y registro de estudiantes.
          </p>
        </div>

        <Button variant="orange" size="sm" onClick={() => onNavigate('admin')}>
          <Layers className="w-4 h-4" />
          Gestionar Catálogo y Períodos
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Cinta de Indicadores Institucionales */}
      <div className="bg-white border border-border rounded-lg shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
        <div className="p-5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              Gestión Académica Activa
            </span>
            <span className="text-[11px] font-mono text-slate-500 tabular-nums">
              {currentPeriod?.startDate} — {currentPeriod?.endDate}
            </span>
          </div>
          <div className="text-2xl font-bold text-[#002B49] tabular-nums">
            {currentPeriod?.code || 'I-2026'}
          </div>
          <p className="text-xs text-slate-500 truncate">
            {currentPeriod?.name}
          </p>
        </div>

        <div className="p-5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              Ocupación de Cupos ({currentPeriod?.code})
            </span>
            <span className="text-xs font-bold text-[#002B49] tabular-nums">
              {occupancyRate}%
            </span>
          </div>
          <div className="text-2xl font-bold text-[#002B49] tabular-nums">
            {totalEnrolled}{' '}
            <span className="text-sm font-normal text-slate-500">
              / {totalQuota} plazas
            </span>
          </div>
          <div className="pt-1">
            <Progress value={occupancyRate} className="h-1.5" />
          </div>
          <p className="text-[11px] text-slate-600 flex items-center gap-1 pt-0.5">
            {fullCoursesCount > 0 ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="tabular-nums">
                  {fullCoursesCount} paralelo(s) sin cupo disponible
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Todos los paralelos con plazas abiertas</span>
              </>
            )}
          </p>
        </div>

        <div className="p-5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              Oferta Académica Habilitada
            </span>
            <span className="text-[11px] font-mono text-slate-500 tabular-nums">
              {campuses.length} Sedes
            </span>
          </div>
          <div className="text-2xl font-bold text-[#002B49] tabular-nums">
            {currentOfferings.length}{' '}
            <span className="text-sm font-normal text-slate-500">
              paralelos activos
            </span>
          </div>
          <p className="text-xs text-slate-500 tabular-nums">
            {subjects.length} asignaturas en {careers.length} carreras
          </p>
        </div>

        <div className="p-5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              Seguridad & Aislamiento
            </span>
            <Badge variant="success" className="text-[10px] py-0 px-1.5">
              Control RBAC
            </Badge>
          </div>
          <div className="text-base font-bold text-[#002B49] font-mono">
            PASETO v4.public
          </div>
          <p className="text-xs text-slate-500">
            Aislamiento estricto de roles por contexto
          </p>
        </div>
      </div>

      {/* Matriz Completa de Cursos Institucionales */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <div className="space-y-0.5">
            <CardTitle>
              Matriz Institucional de Cursos Ofertados, Horarios y Cupos (
              {currentPeriod?.code})
            </CardTitle>
            <CardDescription>
              Monitoreo centralizado de la oferta de todas las sedes y
              carreras de la Universidad Central.
            </CardDescription>
          </div>
          <Badge variant="navy" className="tabular-nums">
            {currentOfferings.length} Paralelos Publicados
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sigla & Asignatura</TableHead>
                <TableHead>Paralelo / Sede</TableHead>
                <TableHead>Docente Titular</TableHead>
                <TableHead>Horario de Clases</TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead className="text-right">Disponibilidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentOfferings.map((off) => {
                const isFull = off.availableQuota <= 0;
                const pct = Math.min(
                  100,
                  Math.round((off.enrolledCount / off.maxQuota) * 100),
                );
                return (
                  <TableRow key={off.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#002B49] bg-slate-100 px-1.5 py-0.5 rounded">
                          {off.subjectCode}
                        </span>
                        <span className="font-semibold text-slate-900">
                          {off.subjectName}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {off.careerName} • Semestre {off.semesterLevel} (
                        {off.credits} Cr.)
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-xs text-slate-800">
                        {off.groupCode}
                      </div>
                      <div className="text-xs text-slate-500">
                        {off.modality} • {off.campusName.split('(')[0]}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-semibold text-slate-800">
                        {off.teacherName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {off.teacherEmail}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {off.schedules?.map((s: any) => (
                          <span
                            key={s.id}
                            className="inline-flex items-center gap-1.5 text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 w-fit"
                          >
                            <Clock className="w-3 h-3 text-[#002B49]" />
                            <strong>{s.dayOfWeek}:</strong> {s.startTime}–
                            {s.endTime} ({s.classroom})
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="w-44">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-800">
                            {off.enrolledCount} / {off.maxQuota}
                          </span>
                          <span className="text-slate-500">{pct}%</span>
                        </div>
                        <Progress
                          value={pct}
                          className="h-1.5"
                          indicatorClassName={
                            isFull ? 'bg-red-600' : 'bg-[#002B49]'
                          }
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={isFull ? 'danger' : 'success'}>
                        {isFull
                          ? 'CUPO AGOTADO'
                          : `${off.availableQuota} PLAZAS LIBRES`}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Distribución por Carrera y Sedes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>
              Distribución de Oferta por Carrera ({currentPeriod?.code})
            </CardTitle>
            <CardDescription>
              Programas oficiales del catálogo curricular UNICEN.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Carrera</TableHead>
                  <TableHead className="text-right">Paralelos</TableHead>
                  <TableHead className="text-right">Matrícula</TableHead>
                  <TableHead className="text-right">Ocupación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {careerStats.map((car) => (
                  <TableRow key={car.id}>
                    <TableCell>
                      <span className="font-mono text-xs font-bold text-[#002B49] bg-slate-100 px-1.5 py-0.5 rounded">
                        {car.code}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-xs text-slate-900">
                        {car.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {car.area}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-xs font-semibold">
                      {car.coursesCount}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">
                      {car.quota > 0 ? `${car.enrolled} / ${car.quota}` : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {car.quota > 0 ? (
                        <Badge
                          variant={car.pct >= 90 ? 'danger' : 'navy'}
                          className="tabular-nums"
                        >
                          {car.pct}% ocupado
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Sin apertura
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle>Sedes Nacionales UNICEN</CardTitle>
            <CardDescription>
              Infraestructura académica conectada al sistema SIIA 2026.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {campuses.map((camp) => (
              <div
                key={camp.id}
                className="px-5 py-3.5 flex items-start justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-[#002B49]" />
                    <span className="font-semibold text-xs text-[#002B49]">
                      {camp.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 pl-5">{camp.address}</p>
                </div>
                <Badge variant="neutral" className="shrink-0">
                  {camp.city}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default EnterpriseDashboardView;
