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
      <Card className="p-10 text-center text-sm text-slate-500">
        Cargando resumen académico de la Sede Central Cochabamba...
      </Card>
    );
  }

  // 1. VISTA RESUMEN PARA ESTUDIANTE
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
      <div className="space-y-6">
        <div className="bg-white border border-border rounded-lg p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-lg font-bold text-[#002B49] tracking-tight">
                Portal Estudiantil — {user.fullName}
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
              Registro Universitario:{' '}
              <span className="font-mono font-semibold text-slate-800 tabular-nums">
                {user.registrationNumber}
              </span>{' '}
              • Sede Central Cochabamba
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
              Consultar Kardex
            </Button>
          </div>
        </div>

        <div className="bg-white border border-border rounded-lg shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
          <div className="p-5 space-y-1">
            <span className="text-xs font-semibold text-slate-600">
              Materias Inscritas ({currentPeriod?.code})
            </span>
            <div className="text-2xl font-bold text-[#002B49] tabular-nums">
              {studentEnrollments.length}{' '}
              <span className="text-sm font-normal text-slate-500">
                asignaturas
              </span>
            </div>
            <p className="text-xs text-slate-500 tabular-nums">
              {totalCredits} créditos en curso
            </p>
          </div>

          <div className="p-5 space-y-1">
            <span className="text-xs font-semibold text-slate-600">
              Promedio General Ponderado
            </span>
            <div className="text-2xl font-bold text-[#002B49] tabular-nums">
              {kardexSummary.generalAverage}{' '}
              <span className="text-sm font-normal text-slate-500">/ 100</span>
            </div>
            <p className="text-xs text-slate-500">
              Escala oficial de aprobación ≥ 51 pts
            </p>
          </div>

          <div className="p-5 space-y-1">
            <span className="text-xs font-semibold text-slate-600">
              Asignaturas Aprobadas
            </span>
            <div className="text-2xl font-bold text-[#002B49] tabular-nums">
              {kardexSummary.approvedCourses}{' '}
              <span className="text-sm font-normal text-slate-500">
                de {kardexSummary.totalEnrolledCourses}
              </span>
            </div>
            <p className="text-xs text-slate-500 tabular-nums">
              {kardexSummary.approvedCredits} créditos vencidos
            </p>
          </div>

          <div className="p-5 space-y-1">
            <span className="text-xs font-semibold text-slate-600">
              Sede Académica
            </span>
            <div className="text-base font-bold text-[#002B49]">
              Cochabamba Central
            </div>
            <p className="text-xs text-slate-500">
              Torre Empresarial & Campus Salud
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="space-y-0.5">
              <CardTitle>
                Mis Asignaturas en Curso ({currentPeriod?.code})
              </CardTitle>
              <CardDescription>
                Resumen de materias activas en el semestre vigente.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('enrollments')}
            >
              Gestionar Inscripciones
            </Button>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {studentEnrollments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No tiene asignaturas inscritas en la gestión actual.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sigla & Asignatura</TableHead>
                    <TableHead>Paralelo</TableHead>
                    <TableHead>Docente Titular</TableHead>
                    <TableHead className="text-right">Nota Acumulada</TableHead>
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
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // 2. VISTA RESUMEN PARA DOCENTE
  if (user.role === 'DOCENTE') {
    const activeCourses = currentPeriod
      ? teacherOfferings.filter((o) => o.periodId === currentPeriod.id)
      : teacherOfferings;
    const totalStudents = activeCourses.reduce(
      (acc, c) => acc + (c.enrolledCount || 0),
      0,
    );

    return (
      <div className="space-y-6">
        <div className="bg-white border border-border rounded-lg p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#002B49] tracking-tight">
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
            onClick={() => onNavigate('grading')}
          >
            <BookOpen className="w-4 h-4" />
            Abrir Planilla de Calificaciones
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="bg-white border border-border rounded-lg shadow-sm grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
          <div className="p-5 space-y-1">
            <span className="text-xs font-semibold text-slate-600">
              Paralelos Asignados ({currentPeriod?.code})
            </span>
            <div className="text-2xl font-bold text-[#002B49] tabular-nums">
              {activeCourses.length} cursos
            </div>
          </div>
          <div className="p-5 space-y-1">
            <span className="text-xs font-semibold text-slate-600">
              Estudiantes Inscritos
            </span>
            <div className="text-2xl font-bold text-[#002B49] tabular-nums">
              {totalStudents} alumnos
            </div>
          </div>
          <div className="p-5 space-y-1">
            <span className="text-xs font-semibold text-slate-600">
              Sede Académica
            </span>
            <div className="text-base font-bold text-[#002B49]">
              Cochabamba Central
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="space-y-0.5">
              <CardTitle>Mis Paralelos bajo Regencia Docente</CardTitle>
              <CardDescription>
                Cursos asignados en la Sede Central Cochabamba.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('grading')}
            >
              Calificar Estudiantes
            </Button>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
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
          </CardContent>
        </Card>
      </div>
    );
  }

  // 3. VISTA RESUMEN PARA ADMINISTRADOR (Con Detalle por Carrera)
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
      <div className="space-y-6">
        <div className="bg-white border border-border rounded-lg p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#002B49] bg-slate-100 px-2 py-0.5 rounded">
                {selectedCareer.code}
              </span>
              <h2 className="text-lg font-bold text-[#002B49]">
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
            onClick={() => setSelectedCareerId(null)}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al Resumen Ejecutivo
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="space-y-0.5">
              <CardTitle>
                Paralelos Habilitados en {selectedCareer.name}
              </CardTitle>
              <CardDescription>
                Oferta académica publicada en la Sede Central Cochabamba.
              </CardDescription>
            </div>
            <Badge variant="navy" className="tabular-nums">
              {selectedCareer.offerings.length} Paralelos
            </Badge>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-border rounded-lg p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-lg font-bold text-[#002B49] tracking-tight">
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
          onClick={() => onNavigate('admin')}
        >
          <Layers className="w-4 h-4" />
          Administrar Catálogo y Oferta
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="bg-white border border-border rounded-lg shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
        <div className="p-5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              Gestión Académica Vigente
            </span>
            <span className="text-[11px] font-mono text-slate-500 tabular-nums">
              {currentPeriod?.startDate}
            </span>
          </div>
          <div className="text-2xl font-bold text-[#002B49] tabular-nums">
            {currentPeriod?.code || 'I-2026'}
          </div>
          <p className="text-xs text-slate-500">Sede Central Cochabamba</p>
        </div>

        <div className="p-5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              Matrícula Registrada ({currentPeriod?.code})
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
          <p className="text-[11px] text-slate-600 flex items-center gap-1 pt-0.5">
            {fullCoursesCount > 0 ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="tabular-nums">
                  {fullCoursesCount} paralelo(s) con cupo lleno
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Plazas habilitadas en todos los cursos</span>
              </>
            )}
          </p>
        </div>

        <div className="p-5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              Oferta Académica Cochabamba
            </span>
            <span className="text-[11px] font-mono text-slate-500 tabular-nums">
              {careers.length} Carreras
            </span>
          </div>
          <div className="text-2xl font-bold text-[#002B49] tabular-nums">
            {currentOfferings.length}{' '}
            <span className="text-sm font-normal text-slate-500">
              paralelos activos
            </span>
          </div>
          <p className="text-xs text-slate-500 tabular-nums">
            {subjects.length} asignaturas en catálogo
          </p>
        </div>

        <div className="p-5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              Plazas Disponibles ({currentPeriod?.code})
            </span>
            <Badge variant="success" className="text-[10px] py-0 px-1.5">
              Habilitado
            </Badge>
          </div>
          <div className="text-2xl font-bold text-[#002B49] tabular-nums">
            {Math.max(0, totalQuota - totalEnrolled)}{' '}
            <span className="text-sm font-normal text-slate-500">
              cupos libres
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Torre Empresarial & Campus Salud
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="space-y-0.5">
            <CardTitle>
              Programas de Licenciatura — Sede Central Cochabamba (
              {currentPeriod?.code})
            </CardTitle>
            <CardDescription>
              Seleccione una carrera para ver el detalle de sus paralelos y
              docentes.
            </CardDescription>
          </div>
          <Badge variant="navy" className="tabular-nums">
            {careers.length} Carreras Activas
          </Badge>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
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
                          {car.enrolled} / {car.quota} plazas ({car.coursesCount}{' '}
                          cur.)
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
        </CardContent>
      </Card>
    </div>
  );
};
export default EnterpriseDashboardView;
