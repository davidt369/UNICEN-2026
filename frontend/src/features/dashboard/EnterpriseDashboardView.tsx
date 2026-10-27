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
  const [periods, setPeriods] = useState<any[]>([]);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [careers, setCareers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiRequest<any[]>('/course-offerings/periods'),
      apiRequest<any[]>('/catalog/campuses'),
      apiRequest<any[]>('/catalog/careers'),
      apiRequest<any[]>('/catalog/subjects'),
      apiRequest<any[]>('/course-offerings'),
    ])
      .then(([per, camp, car, sub, off]) => {
        setPeriods(per);
        setCampuses(camp);
        setCareers(car);
        setSubjects(sub);
        setOfferings(off);
      })
      .finally(() => setLoading(false));
  }, []);

  const currentPeriod = periods.find((p) => p.isCurrent) || periods[0];
  const currentOfferings = currentPeriod
    ? offerings.filter((o) => o.periodId === currentPeriod.id)
    : offerings;

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

  if (loading) {
    return (
      <Card className="p-10 text-center text-sm text-slate-500">
        Consultando estado operativo del Sistema Integrado de Información Académica...
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabecera Ejecutiva de Espacio de Trabajo */}
      <div className="bg-white border border-border rounded-lg p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-lg font-bold text-[#002B49] tracking-tight">
              Centro de Operaciones Académicas — {user.fullName}
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
            Registro institucional{' '}
            <span className="font-mono font-semibold text-slate-800 tabular-nums">
              {user.registrationNumber}
            </span>{' '}
            • Control de oferta curricular, cupos transaccionales y evaluación
            ponderada en tiempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {user.role === 'ESTUDIANTE' && (
            <>
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
                Consultar Kardex Oficial
              </Button>
            </>
          )}
          {user.role === 'DOCENTE' && (
            <Button
              variant="orange"
              size="sm"
              onClick={() => onNavigate('grading')}
            >
              <BookOpen className="w-4 h-4" />
              Abrir Planilla Docente
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          )}
          {user.role === 'ADMINISTRADOR' && (
            <Button
              variant="orange"
              size="sm"
              onClick={() => onNavigate('admin')}
            >
              <Layers className="w-4 h-4" />
              Gestionar Catálogo y Períodos
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Cinta Unificada de Indicadores Operativos (Sin tarjetas flotantes decorativas) */}
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
              Integridad Transaccional
            </span>
            <Badge variant="success" className="text-[10px] py-0 px-1.5">
              ACID Activo
            </Badge>
          </div>
          <div className="text-base font-bold text-[#002B49] font-mono">
            PASETO v4.public
          </div>
          <p className="text-xs text-slate-500">
            Bloqueo pesimista de cupos + Baja lógica auditable
          </p>
        </div>
      </div>

      {/* Tabla Principal: Matriz de Cursos Ofertados, Horarios y Cupos en Tiempo Real */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <div className="space-y-0.5">
            <CardTitle>
              Matriz de Cursos Ofertados, Horarios y Control de Cupos (
              {currentPeriod?.code})
            </CardTitle>
            <CardDescription>
              Estado de matrícula en tiempo real y bloques horarios verificados
              contra solapamientos.
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
                        <span className="font-mono text-xs font-bold text-[#002B49] bg-slate-100 px-1.5 py-0.5 rounded tabular-nums">
                          {off.subjectCode}
                        </span>
                        <span className="font-semibold text-slate-900">
                          {off.subjectName}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
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
                            className="inline-flex items-center gap-1.5 text-[11px] bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded text-slate-700 w-fit tabular-nums"
                          >
                            <Clock className="w-3 h-3 text-[#002B49]" />
                            <strong className="font-semibold">
                              {s.dayOfWeek}:
                            </strong>{' '}
                            {s.startTime}–{s.endTime} ({s.classroom})
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="w-44">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold tabular-nums">
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
                    <TableCell className="text-right tabular-nums">
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

      {/* Sección Inferior: Programas de Licenciatura y Sedes Nacionales */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>
              Distribución de Oferta por Carrera de Licenciatura (
              {currentPeriod?.code})
            </CardTitle>
            <CardDescription>
              Programas oficiales del catálogo curricular UNICEN y su ocupación
              de matrícula vigente.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Programa de Licenciatura</TableHead>
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
                    <TableCell className="text-right text-xs font-semibold tabular-nums">
                      {car.coursesCount}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono tabular-nums">
                      {car.quota > 0 ? `${car.enrolled} / ${car.quota}` : '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {car.quota > 0 ? (
                        <Badge
                          variant={car.pct >= 90 ? 'danger' : 'navy'}
                          className="tabular-nums"
                        >
                          {car.pct}% ocupado
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Sin apertura en {currentPeriod?.code}
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
                  <p className="text-[11px] font-mono text-slate-400 pl-5">
                    Código SIIA: {camp.code}
                  </p>
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
