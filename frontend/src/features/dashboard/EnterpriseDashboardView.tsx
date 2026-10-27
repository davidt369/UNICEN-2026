import React, { useEffect, useState } from 'react';
import {
  Building2,
  GraduationCap,
  Layers,
  Users,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
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

  // Agrupación de métricas por carrera
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
        Cargando métricas ejecutivas del Dashboard Institucional SIIA UNICEN...
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner Ejecutivo Institucional UNICEN */}
      <div className="rounded-2xl bg-gradient-to-r from-[#002B49] via-[#003865] to-[#002B49] text-white p-6 lg:p-8 shadow-lg border-b-4 border-b-[#E05A1B] flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5 text-[#E05A1B]" />
            <span>
              Panel Ejecutivo SIIA 2026 • Universidad Central (UNICEN)
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
            Bienvenido,{' '}
            <span className="text-[#E05A1B]">{user.fullName}</span>
          </h1>
          <p className="text-xs lg:text-sm text-slate-200 leading-relaxed">
            Monitoreo en tiempo real de oferta académica, control transaccional
            de cupos, validación de horarios y rendimiento estudiantil en las
            sedes de Cochabamba, La Paz y Santa Cruz.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {user.role === 'ESTUDIANTE' && (
            <>
              <Button
                variant="orange"
                onClick={() => onNavigate('enrollments')}
              >
                <GraduationCap className="w-4 h-4" />
                Inscribir Materias
                <ArrowUpRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                className="bg-white/10 text-white border-white/25 hover:bg-white/20"
                onClick={() => onNavigate('kardex')}
              >
                Ver Kardex Oficial
              </Button>
            </>
          )}
          {user.role === 'DOCENTE' && (
            <Button variant="orange" onClick={() => onNavigate('grading')}>
              <BookOpen className="w-4 h-4" />
              Abrir Planilla de Calificaciones
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          )}
          {user.role === 'ADMINISTRADOR' && (
            <Button variant="orange" onClick={() => onNavigate('admin')}>
              <Layers className="w-4 h-4" />
              Administrar Gestiones y Oferta
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* 4 Tarjetas KPI Empresariales (shadcn/ui Card) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-t-4 border-t-[#002B49]">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Gestión Académica Vigente
            </CardTitle>
            <Calendar className="w-4 h-4 text-[#002B49]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-[#002B49]">
              {currentPeriod?.code || 'I-2026'}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Badge
                variant={currentPeriod?.enrollmentsOpen ? 'success' : 'danger'}
              >
                {currentPeriod?.enrollmentsOpen
                  ? 'Inscripciones Abiertas'
                  : 'Inscripciones Cerradas'}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              {currentPeriod?.startDate} al {currentPeriod?.endDate}
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-[#E05A1B]">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ocupación de Cupos ({currentPeriod?.code})
            </CardTitle>
            <Users className="w-4 h-4 text-[#E05A1B]" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-[#002B49]">
                {totalEnrolled} / {totalQuota}
              </span>
              <span className="text-xs font-bold text-[#E05A1B]">
                {occupancyRate}% ocupado
              </span>
            </div>
            <Progress value={occupancyRate} className="mt-2.5" />
            <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
              {fullCoursesCount > 0 ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>{fullCoursesCount} curso(s) con cupo agotado</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Todos los cursos con cupo disponible</span>
                </>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-[#003865]">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Catálogo y Oferta Activa
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-[#003865]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-[#002B49]">
              {currentOfferings.length} Cursos
            </div>
            <p className="text-xs font-semibold text-slate-700 mt-1">
              {subjects.length} Materias en {careers.length} Carreras
            </p>
            <p className="text-[11px] text-slate-500 mt-1.5">
              {campuses.length} Sedes Nacionales (CBBA • LPZ • SCZ)
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-emerald-600">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Integridad & Seguridad SIIA
            </CardTitle>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-extrabold text-[#002B49]">
              PASETO v4.public
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              <Badge variant="success">Soft Delete Activo</Badge>
              <Badge variant="navy">ACID Lock</Badge>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Firma asimétrica Ed25519 + Estrategia Ponderada
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sección Intermedia: Distribución por Carrera y Sedes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="text-base">
              Demanda Académica por Carrera de Licenciatura
            </CardTitle>
            <CardDescription>
              Porcentaje de ocupación de matrícula en los programas oficiales de
              UNICEN ({currentPeriod?.code})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {careerStats.map((car) => (
              <div key={car.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Badge variant="navy">{car.code}</Badge>
                    <span className="font-bold text-slate-800">{car.name}</span>
                  </div>
                  <span className="text-slate-600 font-semibold">
                    {car.enrolled}/{car.quota} cupos ({car.pct}%)
                  </span>
                </div>
                <Progress
                  value={car.pct}
                  indicatorClassName={
                    car.pct >= 90 ? 'bg-red-600' : 'bg-[#002B49]'
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="text-base">
              Infraestructura de Sedes UNICEN
            </CardTitle>
            <CardDescription>
              Sedes habilitadas en el Sistema Integrado de Información Académica
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {campuses.map((camp) => (
              <div
                key={camp.id}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#002B49]">
                    {camp.name}
                  </span>
                  <Badge variant="orange">{camp.city}</Badge>
                </div>
                <p className="text-xs text-slate-600">{camp.address}</p>
                <p className="text-[11px] font-mono text-slate-400">
                  Código SIIA: {camp.code}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Tabla Ejecutiva shadcn/ui de Oferta Académica y Cupos en Tiempo Real */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">
              Matriz de Cursos Ofertados, Horarios y Control de Cupos ({currentPeriod?.code})
            </CardTitle>
            <CardDescription>
              Vista consolidada con estado de cupos en tiempo real y bloques de
              horario validados contra colisiones.
            </CardDescription>
          </div>
          <Badge variant="navy">{currentOfferings.length} Cursos Activos</Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sigla & Materia</TableHead>
                <TableHead>Paralelo / Modalidad</TableHead>
                <TableHead>Docente Titular</TableHead>
                <TableHead>Bloques Horarios</TableHead>
                <TableHead>Ocupación de Cupo</TableHead>
                <TableHead className="text-right">Estado</TableHead>
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
                      <div className="font-bold text-[#002B49]">
                        {off.subjectCode} — {off.subjectName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {off.careerName} • Semestre {off.semesterLevel} ({off.credits} Cr.)
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-xs text-slate-800">
                        {off.groupCode}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {off.modality} • {off.campusName.split('(')[0]}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-semibold text-slate-800">
                        {off.teacherName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {off.teacherEmail}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {off.schedules?.map((s: any) => (
                          <span
                            key={s.id}
                            className="inline-flex items-center gap-1 text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 w-fit"
                          >
                            <Clock className="w-3 h-3 text-[#E05A1B]" />
                            <strong>{s.dayOfWeek}:</strong> {s.startTime}-
                            {s.endTime} ({s.classroom})
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="w-48">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>
                            {off.enrolledCount} / {off.maxQuota}
                          </span>
                          <span>{pct}%</span>
                        </div>
                        <Progress
                          value={pct}
                          indicatorClassName={
                            isFull ? 'bg-red-600' : 'bg-[#E05A1B]'
                          }
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={isFull ? 'danger' : 'success'}>
                        {isFull
                          ? 'CUPO AGOTADO'
                          : `${off.availableQuota} DISPONIBLES`}
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
};
