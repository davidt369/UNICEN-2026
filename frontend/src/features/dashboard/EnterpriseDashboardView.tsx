import React, { useEffect, useState } from 'react';
import {
  GraduationCap,
  Layers,
  ArrowUpRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Award,
  Eye,
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
  const [currentPeriod, setCurrentPeriod] = useState<any>(null);
  const [studentEnrollments, setStudentEnrollments] = useState<any[]>([]);
  const [studentKardex, setStudentKardex] = useState<any | null>(null);
  const [teacherOfferings, setTeacherOfferings] = useState<any[]>([]);
  const [careers, setCareers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [allOfferings, setAllOfferings] = useState<any[]>([]);
  const [selectedCareerId, setSelectedCareerId] = useState<number | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const pers = await apiRequest<any[]>('/course-offerings/periods');
        const curr = pers.find((p) => p.isCurrent) || pers[0];
        setCurrentPeriod(curr);

        if (user.role === 'ESTUDIANTE') {
          const [enrs, kard] = await Promise.all([
            apiRequest<any[]>(
              curr ? `/enrollments/my?periodId=${curr.id}` : '/enrollments/my',
            ).catch(() => []),
            apiRequest<any>('/grading/my-kardex').catch(() => null),
          ]);
          setStudentEnrollments(enrs);
          setStudentKardex(kard);
        } else if (user.role === 'DOCENTE') {
          const teacherCourses = await apiRequest<any[]>(
            `/course-offerings?teacherId=${user.id}`,
          ).catch(() => []);
          setTeacherOfferings(teacherCourses);
        } else {
          const [cars, subs, offs] = await Promise.all([
            apiRequest<any[]>('/catalog/careers').catch(() => []),
            apiRequest<any[]>('/catalog/subjects').catch(() => []),
            apiRequest<any[]>('/course-offerings').catch(() => []),
          ]);
          setCareers(cars);
          setSubjects(subs);
          setAllOfferings(offs);
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user.id, user.role]);

  if (loading) {
    return (
      <Card className="p-8 text-center text-xs sm:text-sm text-slate-500">
        Cargando resumen académico de la Sede Central Cochabamba...
      </Card>
    );
  }

  // 1. VISTA RESUMEN MOBILE-FIRST PARA ESTUDIANTE
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

    return (
      <div className="space-y-4 sm:space-y-6 min-w-0">
        <div className="bg-white border border-border rounded-lg p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 min-w-0">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#002B49] tracking-tight">
                Portal Estudiantil — {user.fullName}
              </h2>
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
              R.U.:{' '}
              <span className="font-mono font-semibold text-slate-800 tabular-nums">
                {user.registrationNumber}
              </span>{' '}
              • {user.careerName || 'Plan Regular'} • Sede Cochabamba
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Button
              variant="orange"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => onNavigate('enrollments')}
            >
              <GraduationCap className="w-4 h-4" />
              Inscribir
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => onNavigate('kardex')}
            >
              <Award className="w-4 h-4 text-[#002B49]" />
              Mi Kardex
            </Button>
          </div>
        </div>

        <div className="bg-white border border-border rounded-lg shadow-sm grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
          <div className="p-4 sm:p-5 space-y-1">
            <span className="text-xs font-semibold text-slate-600">
              Materias ({currentPeriod?.code})
            </span>
            <div className="text-xl sm:text-2xl font-bold text-[#002B49] tabular-nums">
              {studentEnrollments.length}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 tabular-nums">
              {totalCredits} créditos en curso
            </p>
          </div>

          <div className="p-4 sm:p-5 space-y-1">
            <span className="text-xs font-semibold text-slate-600">
              Promedio General
            </span>
            <div className="text-xl sm:text-2xl font-bold text-[#002B49] tabular-nums">
              {kardexSummary.generalAverage}{' '}
              <span className="text-xs font-normal text-slate-500">/ 100</span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Mínimo aprobación: 51 pts
            </p>
          </div>

          <div className="p-4 sm:p-5 space-y-1">
            <span className="text-xs font-semibold text-slate-600">
              Aprobadas
            </span>
            <div className="text-xl sm:text-2xl font-bold text-[#002B49] tabular-nums">
              {kardexSummary.approvedCourses} /{' '}
              {kardexSummary.totalEnrolledCourses}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 tabular-nums">
              {kardexSummary.approvedCredits} créditos vencidos
            </p>
          </div>

          <div className="p-4 sm:p-5 space-y-1">
            <span className="text-xs font-semibold text-slate-600">
              Sede Académica
            </span>
            <div className="text-sm sm:text-base font-bold text-[#002B49]">
              Cochabamba Central
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Torre Empresarial & Salud
            </p>
          </div>
        </div>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <CardTitle>
                Mis Asignaturas en Curso ({currentPeriod?.code})
              </CardTitle>
              <CardDescription>
                Materias activas en el semestre vigente.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => onNavigate('enrollments')}
            >
              Ver Oferta e Inscripciones
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {studentEnrollments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No tiene asignaturas inscritas en la gestión actual.
              </div>
            ) : (
              <>
                <div className="md:hidden divide-y divide-border">
                  {studentEnrollments.map((enr) => (
                    <div key={enr.id} className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <span className="font-mono text-xs font-bold text-[#002B49] bg-slate-100 px-1.5 py-0.5 rounded">
                            {enr.subjectCode}
                          </span>
                          <h3 className="font-semibold text-sm text-slate-900 leading-snug">
                            {enr.subjectName}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {enr.groupCode} • {enr.teacherName}
                          </p>
                        </div>
                        <Badge variant="navy" className="shrink-0">
                          {enr.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 text-slate-600">
                        <span>Nota Acumulada:</span>
                        <strong className="font-mono text-[#002B49] tabular-nums">
                          {enr.finalScore !== null
                            ? `${enr.finalScore} / 100`
                            : 'En evaluación'}
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sigla & Asignatura</TableHead>
                        <TableHead>Paralelo</TableHead>
                        <TableHead>Docente Titular</TableHead>
                        <TableHead className="text-right">
                          Nota Acumulada
                        </TableHead>
                        <TableHead className="text-right">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentEnrollments.map((enr) => (
                        <TableRow key={enr.id}>
                          <TableCell>
                            <span className="font-mono text-xs font-bold text-[#002B49] bg-slate-100 px-1.5 py-0.5 rounded mr-2">
                              {enr.subjectCode}
                            </span>
                            <span className="font-semibold text-xs text-slate-900">
                              {enr.subjectName}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-slate-700">
                            {enr.groupCode}
                          </TableCell>
                          <TableCell className="text-xs text-slate-700">
                            {enr.teacherName}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-bold text-[#002B49] tabular-nums">
                            {enr.finalScore !== null
                              ? `${enr.finalScore} / 100`
                              : 'En evaluación'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="navy">{enr.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // 2. VISTA RESUMEN MOBILE-FIRST PARA DOCENTE
  if (user.role === 'DOCENTE') {
    const activeCourses = currentPeriod
      ? teacherOfferings.filter((o) => o.periodId === currentPeriod.id)
      : teacherOfferings;
    const totalStudents = activeCourses.reduce(
      (acc, c) => acc + (c.enrolledCount || 0),
      0,
    );

    return (
      <div className="space-y-4 sm:space-y-6 min-w-0">
        <div className="bg-white border border-border rounded-lg p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-[#002B49] tracking-tight">
              Portal de Cátedra Docente — {user.fullName}
            </h2>
            <p className="text-xs text-slate-600">
              Legajo:{' '}
              <span className="font-mono font-semibold text-slate-800 tabular-nums">
                {user.registrationNumber}
              </span>{' '}
              • Sede Central Cochabamba ({currentPeriod?.code})
            </p>
          </div>
          <Button
            variant="orange"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => onNavigate('grading')}
          >
            <BookOpen className="w-4 h-4" />
            Abrir Planilla de Calificaciones
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="bg-white border border-border rounded-lg shadow-sm grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
          <div className="p-4 sm:p-5 space-y-1">
            <span className="text-xs font-semibold text-slate-600">
              Paralelos Asignados ({currentPeriod?.code})
            </span>
            <div className="text-xl sm:text-2xl font-bold text-[#002B49] tabular-nums">
              {activeCourses.length} cursos
            </div>
          </div>
          <div className="p-4 sm:p-5 space-y-1">
            <span className="text-xs font-semibold text-slate-600">
              Estudiantes Inscritos
            </span>
            <div className="text-xl sm:text-2xl font-bold text-[#002B49] tabular-nums">
              {totalStudents} alumnos
            </div>
          </div>
          <div className="p-4 sm:p-5 space-y-1">
            <span className="text-xs font-semibold text-slate-600">
              Sede Académica
            </span>
            <div className="text-base font-bold text-[#002B49]">
              Cochabamba Central
            </div>
          </div>
        </div>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <CardTitle>Mis Paralelos bajo Regencia Docente</CardTitle>
              <CardDescription>
                Cursos asignados en la Sede Central Cochabamba.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => onNavigate('grading')}
            >
              Calificar Estudiantes
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="md:hidden divide-y divide-border">
              {teacherOfferings.map((c) => (
                <div key={c.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="navy">{c.periodCode}</Badge>
                      <span className="font-mono text-xs font-bold text-[#002B49]">
                        {c.subjectCode}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#002B49] tabular-nums">
                      {c.enrolledCount} / {c.maxQuota} inscritos
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-slate-900">
                    {c.subjectName}
                  </h3>
                  <p className="text-xs text-slate-500">{c.groupCode}</p>
                </div>
              ))}
            </div>

            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gestión</TableHead>
                    <TableHead>Sigla & Asignatura</TableHead>
                    <TableHead>Paralelo</TableHead>
                    <TableHead className="text-right">Inscritos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teacherOfferings.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Badge variant="navy">{c.periodCode}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs font-bold text-[#002B49] mr-2">
                          {c.subjectCode}
                        </span>
                        <span className="font-semibold text-xs text-slate-900">
                          {c.subjectName}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">
                        {c.groupCode}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-[#002B49] tabular-nums">
                        {c.enrolledCount} / {c.maxQuota}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 3. VISTA RESUMEN MOBILE-FIRST PARA ADMINISTRADOR
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
      offerings: carOfferings,
    };
  });

  const selectedCareer = careerStats.find((c) => c.id === selectedCareerId);

  if (selectedCareer) {
    return (
      <div className="space-y-4 sm:space-y-6 min-w-0">
        <div className="bg-white border border-border rounded-lg p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#002B49] bg-slate-100 px-2 py-0.5 rounded">
                {selectedCareer.code}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-[#002B49]">
                {selectedCareer.name}
              </h2>
            </div>
            <p className="text-xs text-slate-600">
              {selectedCareer.area} • Sede Central Cochabamba (
              {currentPeriod?.code})
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => setSelectedCareerId(null)}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al Resumen Ejecutivo
          </Button>
        </div>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="space-y-0.5">
              <CardTitle>
                Paralelos Habilitados en {selectedCareer.name}
              </CardTitle>
              <CardDescription>
                Oferta académica publicada en la Sede Central Cochabamba.
              </CardDescription>
            </div>
            <Badge variant="navy" className="tabular-nums shrink-0">
              {selectedCareer.offerings.length} Paralelos
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="md:hidden divide-y divide-border">
              {selectedCareer.offerings.map((off: any) => {
                const isFull = off.availableQuota <= 0;
                return (
                  <div key={off.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-[#002B49] bg-slate-100 px-1.5 py-0.5 rounded">
                        {off.subjectCode}
                      </span>
                      <Badge variant={isFull ? 'danger' : 'success'}>
                        {isFull
                          ? 'Cupo Agotado'
                          : `${off.availableQuota} Disponibles`}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-sm text-slate-900">
                      {off.subjectName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {off.groupCode} • Docente: {off.teacherName} (
                      {off.enrolledCount}/{off.maxQuota})
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sigla & Asignatura</TableHead>
                    <TableHead>Paralelo</TableHead>
                    <TableHead>Docente Titular</TableHead>
                    <TableHead className="text-right">Ocupación</TableHead>
                    <TableHead className="text-right">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedCareer.offerings.map((off: any) => {
                    const isFull = off.availableQuota <= 0;
                    return (
                      <TableRow key={off.id}>
                        <TableCell>
                          <span className="font-mono text-xs font-bold text-[#002B49] bg-slate-100 px-1.5 py-0.5 rounded mr-2">
                            {off.subjectCode}
                          </span>
                          <span className="font-semibold text-xs text-slate-900">
                            {off.subjectName}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-700">
                          {off.groupCode}
                        </TableCell>
                        <TableCell className="text-xs text-slate-700">
                          {off.teacherName}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-semibold tabular-nums">
                          {off.enrolledCount} / {off.maxQuota}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          <Badge variant={isFull ? 'danger' : 'success'}>
                            {isFull
                              ? 'Cupo Agotado'
                              : `${off.availableQuota} Disponibles`}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      <div className="bg-white border border-border rounded-lg p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-[#002B49] tracking-tight">
              Resumen Operativo SIIA — Sede Central Cochabamba
            </h2>
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
            Dirección Académica: <strong>{user.fullName}</strong> • Torre
            Empresarial & Campus Salud, Cochabamba.
          </p>
        </div>

        <Button
          variant="orange"
          size="sm"
          className="w-full sm:w-auto"
          onClick={() => onNavigate('admin')}
        >
          <Layers className="w-4 h-4" />
          Administrar Catálogo y Oferta
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="bg-white border border-border rounded-lg shadow-sm grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
        <div className="p-4 sm:p-5 space-y-1">
          <span className="text-xs font-semibold text-slate-600">
            Gestión Vigente
          </span>
          <div className="text-xl sm:text-2xl font-bold text-[#002B49] tabular-nums">
            {currentPeriod?.code || 'I-2026'}
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500">
            Sede Central Cochabamba
          </p>
        </div>

        <div className="p-4 sm:p-5 space-y-1">
          <span className="text-xs font-semibold text-slate-600">
            Matrícula ({currentPeriod?.code})
          </span>
          <div className="text-xl sm:text-2xl font-bold text-[#002B49] tabular-nums">
            {totalEnrolled} / {totalQuota}
          </div>
          <p className="text-[11px] sm:text-xs text-slate-600 flex items-center gap-1">
            {fullCoursesCount > 0 ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="tabular-nums">
                  {fullCoursesCount} curso(s) llenos
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Cupos disponibles</span>
              </>
            )}
          </p>
        </div>

        <div className="p-4 sm:p-5 space-y-1">
          <span className="text-xs font-semibold text-slate-600">
            Oferta Activa
          </span>
          <div className="text-xl sm:text-2xl font-bold text-[#002B49] tabular-nums">
            {currentOfferings.length} cursos
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 tabular-nums">
            {subjects.length} materias en {careers.length} carreras
          </p>
        </div>

        <div className="p-4 sm:p-5 space-y-1">
          <span className="text-xs font-semibold text-slate-600">
            Plazas Libres
          </span>
          <div className="text-xl sm:text-2xl font-bold text-[#002B49] tabular-nums">
            {Math.max(0, totalQuota - totalEnrolled)}
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500">
            Ocupación global: {occupancyRate}%
          </p>
        </div>
      </div>

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="space-y-0.5">
            <CardTitle>
              Programas de Licenciatura — Sede Central Cochabamba
            </CardTitle>
            <CardDescription>
              Seleccione una carrera para ver el detalle de sus paralelos y
              docentes.
            </CardDescription>
          </div>
          <Badge variant="navy" className="tabular-nums shrink-0">
            {careers.length} Carreras
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="md:hidden divide-y divide-border">
            {careerStats.map((car) => (
              <div key={car.id} className="p-4 space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[#002B49] bg-slate-100 px-1.5 py-0.5 rounded">
                      {car.code}
                    </span>
                    <span className="text-xs text-slate-500">{car.area}</span>
                  </div>
                  <h3 className="font-semibold text-sm text-slate-900">
                    {car.name}
                  </h3>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold tabular-nums">
                    <span className="text-slate-700">
                      {car.enrolled} / {car.quota} plazas ({car.coursesCount}{' '}
                      cur.)
                    </span>
                    <span className="text-slate-500">{car.pct}%</span>
                  </div>
                  <Progress value={car.pct} className="h-1.5" />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setSelectedCareerId(car.id)}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Ver Paralelos de {car.code}
                </Button>
              </div>
            ))}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Carrera de Licenciatura</TableHead>
                  <TableHead>Área Académica</TableHead>
                  <TableHead>Ocupación de Cupos</TableHead>
                  <TableHead className="text-right">Detalle</TableHead>
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
                    <TableCell className="font-semibold text-xs text-slate-900">
                      {car.name}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {car.area}
                    </TableCell>
                    <TableCell className="w-56">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold tabular-nums">
                          <span className="text-slate-700">
                            {car.enrolled} / {car.quota} plazas (
                            {car.coursesCount} cur.)
                          </span>
                          <span className="text-slate-500">{car.pct}%</span>
                        </div>
                        <Progress value={car.pct} className="h-1.5" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCareerId(car.id)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver Paralelos
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default EnterpriseDashboardView;
