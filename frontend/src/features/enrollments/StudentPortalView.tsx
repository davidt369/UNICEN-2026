import React, { useEffect, useState } from 'react';
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  Trash2,
  PlusCircle,
  Lock,
  ArrowLeft,
  Eye,
} from 'lucide-react';
import { apiRequest, getStoredUser } from '../../lib/api';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/primitives';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Progress } from '../../components/ui/progress';

export const StudentPortalView: React.FC = () => {
  const currentUser = getStoredUser();
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [careers, setCareers] = useState<any[]>([]);
  const [selectedCareerId, setSelectedCareerId] = useState<number | 'ALL'>(
    () => currentUser?.careerId || 'ALL',
  );
  const [offerings, setOfferings] = useState<any[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const loadData = async (periodId?: number) => {
    setLoading(true);
    try {
      const [periodsList, careersList] = await Promise.all([
        apiRequest<any[]>('/course-offerings/periods'),
        apiRequest<any[]>('/catalog/careers').catch(() => []),
      ]);
      setPeriods(periodsList);
      setCareers(careersList);

      const activePeriod =
        periodId ||
        periodsList.find((p) => p.isCurrent)?.id ||
        periodsList[0]?.id;
      if (activePeriod) {
        setSelectedPeriodId(activePeriod);
        const [offs, enrs] = await Promise.all([
          apiRequest<any[]>(`/course-offerings?periodId=${activePeriod}`),
          apiRequest<any[]>(`/enrollments/my?periodId=${activePeriod}`),
        ]);
        setOfferings(offs);
        setMyEnrollments(enrs);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEnroll = async (courseOfferingId: number) => {
    setFeedback(null);
    setActionLoadingId(courseOfferingId);
    try {
      await apiRequest('/enrollments', {
        method: 'POST',
        body: JSON.stringify({ courseOfferingId }),
      });
      setFeedback({
        type: 'success',
        text: 'Inscripción registrada exitosamente bajo transacción ACID en Sede Cochabamba.',
      });
      if (selectedPeriodId) await loadData(selectedPeriodId);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleWithdraw = async (enrollmentId: number) => {
    setFeedback(null);
    setActionLoadingId(enrollmentId);
    try {
      const res = await apiRequest<{ message: string }>(
        `/enrollments/${enrollmentId}`,
        { method: 'DELETE' },
      );
      setFeedback({ type: 'success', text: res.message });
      if (selectedPeriodId) await loadData(selectedPeriodId);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setActionLoadingId(null);
    }
  };

  const enrolledMap = new Map<number, any>(
    myEnrollments.map((e) => [e.courseOfferingId, e]),
  );
  const currentPeriodObj = periods.find((p) => p.id === selectedPeriodId);
  const selectedCourse = offerings.find((o) => o.id === selectedCourseId);

  // PÁGINA DE DETALLE DEL CURSO SELECCIONADO (Master-Detail)
  if (selectedCourse) {
    const activeEnrollment = enrolledMap.get(selectedCourse.id);
    const isEnrolled = Boolean(activeEnrollment);
    const isFull = selectedCourse.availableQuota <= 0;
    const quotaPercent = Math.min(
      100,
      Math.round(
        (selectedCourse.enrolledCount / selectedCourse.maxQuota) * 100,
      ),
    );

    return (
      <div className="space-y-6">
        <div className="bg-white border border-border rounded-lg p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#002B49] bg-slate-100 px-2 py-0.5 rounded">
                {selectedCourse.subjectCode}
              </span>
              <h2 className="text-lg font-bold text-[#002B49]">
                {selectedCourse.subjectName}
              </h2>
              <Badge
                variant={isEnrolled ? 'success' : isFull ? 'danger' : 'navy'}
              >
                {isEnrolled
                  ? 'INSCRITO'
                  : isFull
                    ? 'CUPO AGOTADO'
                    : `${selectedCourse.availableQuota} PLAZAS LIBRES`}
              </Badge>
            </div>
            <p className="text-xs text-slate-600 tabular-nums">
              {selectedCourse.careerName} • Semestre{' '}
              {selectedCourse.semesterLevel} ({selectedCourse.credits} Créditos)
              • Sede Central Cochabamba
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedCourseId(null);
              setFeedback(null);
            }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al Catálogo de Oferta
          </Button>
        </div>

        {feedback && (
          <div
            role="alert"
            className={`p-4 rounded-lg border flex items-start gap-3 text-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            )}
            <div className="font-medium leading-relaxed">{feedback.text}</div>
          </div>
        )}

        {/* Cinta de Ficha Técnica del Paralelo */}
        <div className="bg-white border border-border rounded-lg shadow-sm grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
          <div className="p-5 space-y-1">
            <span className="text-xs font-medium text-slate-500">
              Paralelo y Modalidad
            </span>
            <p className="text-sm font-bold text-[#002B49]">
              {selectedCourse.groupCode} ({selectedCourse.modality})
            </p>
            <p className="text-xs text-slate-500">
              {selectedCourse.campusName}
            </p>
          </div>

          <div className="p-5 space-y-1">
            <span className="text-xs font-medium text-slate-500">
              Docente Titular Asignado
            </span>
            <p className="text-sm font-bold text-[#002B49]">
              {selectedCourse.teacherName}
            </p>
            <p className="text-xs font-mono text-slate-500">
              {selectedCourse.teacherEmail}
            </p>
          </div>

          <div className="p-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold tabular-nums">
              <span className="text-slate-600">Control de Cupos</span>
              <span className="text-[#002B49]">
                {selectedCourse.enrolledCount} / {selectedCourse.maxQuota} (
                {quotaPercent}%)
              </span>
            </div>
            <Progress
              value={quotaPercent}
              className="h-2"
              indicatorClassName={isFull ? 'bg-red-600' : 'bg-[#002B49]'}
            />
            <div className="pt-1 flex justify-end gap-2">
              {!selectedCourse.enrollmentsOpen ? (
                <Button variant="outline" size="sm" disabled>
                  <Lock className="w-3.5 h-3.5" />
                  Período Cerrado
                </Button>
              ) : (
                <>
                  {isEnrolled && activeEnrollment && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-200 text-red-700 hover:bg-red-50"
                      disabled={actionLoadingId === activeEnrollment.id}
                      onClick={() => handleWithdraw(activeEnrollment.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Retirar Materia
                    </Button>
                  )}
                  <Button
                    variant={isEnrolled || isFull ? 'outline' : 'orange'}
                    size="sm"
                    disabled={actionLoadingId === selectedCourse.id}
                    onClick={() => handleEnroll(selectedCourse.id)}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    {actionLoadingId === selectedCourse.id
                      ? 'Validando...'
                      : isEnrolled
                        ? 'Probar No Duplicidad'
                        : isFull
                          ? 'Probar Límite de Cupo'
                          : 'Confirmar Inscripción'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Dos Tablas Limpias: Horarios de Clases y Ponderación Evaluativa */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Bloques Horarios Asignados</CardTitle>
              <CardDescription>
                El motor valida que ningún bloque se solape con sus materias ya
                inscritas.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Día</TableHead>
                    <TableHead>Horario</TableHead>
                    <TableHead>Aula (Sede Cochabamba)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedCourse.schedules?.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-semibold text-xs text-[#002B49]">
                        {s.dayOfWeek}
                      </TableCell>
                      <TableCell className="font-mono text-xs tabular-nums">
                        {s.startTime} – {s.endTime}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {s.classroom}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Esquema de Evaluación Ponderada (100%)</CardTitle>
              <CardDescription>
                Ponderación oficial configurada para el cálculo de la nota final
                del curso.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Orden</TableHead>
                    <TableHead>Rubro de Evaluación</TableHead>
                    <TableHead className="text-right">Ponderación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedCourse.evaluations?.map((ev: any, idx: number) => (
                    <TableRow key={ev.id}>
                      <TableCell className="font-mono text-xs text-slate-500 tabular-nums">
                        #{ev.orderIndex || idx + 1}
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-slate-800">
                        {ev.name}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-[#002B49] tabular-nums">
                        {ev.weightPercentage}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // VISTA PRINCIPAL: LISTADO LIMPIO CON PESTAÑAS (Sin sobrecarga visual)
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-lg border border-border shadow-sm">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#002B49] tracking-tight">
            Oferta e Inscripción de Cursos — Sede Central Cochabamba
          </h2>
          <p className="text-xs text-slate-600">
            Seleccione cualquier paralelo para abrir su ficha detallada de
            horarios, ponderaciones e inscripción transaccional.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {currentPeriodObj && (
            <Badge
              variant={currentPeriodObj.enrollmentsOpen ? 'success' : 'danger'}
            >
              {currentPeriodObj.enrollmentsOpen
                ? 'Inscripciones Abiertas'
                : 'Inscripciones Cerradas'}
            </Badge>
          )}
          <select
            aria-label="Seleccionar Gestión Académica"
            className="h-9 rounded-md border border-input bg-background px-3 text-xs font-semibold text-[#002B49] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={selectedPeriodId ?? ''}
            onChange={(e) => {
              const id = Number(e.target.value);
              setSelectedPeriodId(id);
              loadData(id);
            }}
          >
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {feedback && (
        <div
          role="alert"
          className={`p-4 rounded-lg border flex items-start gap-3 text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          )}
          <div className="font-medium leading-relaxed">{feedback.text}</div>
        </div>
      )}

      <Tabs defaultValue="catalog" className="w-full space-y-4">
        <TabsList className="bg-slate-200/70 p-1 h-auto flex flex-wrap justify-start gap-1">
          <TabsTrigger
            value="catalog"
            className="data-[state=active]:bg-[#002B49] data-[state=active]:text-white py-2 px-4 text-xs font-semibold"
          >
            Catálogo de Oferta Disponible ({offerings.length})
          </TabsTrigger>
          <TabsTrigger
            value="enrolled"
            className="data-[state=active]:bg-[#002B49] data-[state=active]:text-white py-2 px-4 text-xs font-semibold"
          >
            Mis Asignaturas Inscritas ({myEnrollments.length})
          </TabsTrigger>
        </TabsList>

        {/* PESTAÑA 1: CATÁLOGO LIMPIO EN TABLA CON NAVEGACIÓN A PÁGINA DE DETALLE */}
        <TabsContent value="catalog">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div className="space-y-0.5">
                <CardTitle>
                  Catálogo de Paralelos Ofertados ({currentPeriodObj?.code})
                </CardTitle>
                <CardDescription>
                  Haga clic en &ldquo;Ver Ficha&rdquo; para inspeccionar aulas,
                  bloques horarios y ponderación antes de inscribirse.
                </CardDescription>
              </div>
              <Badge variant="navy" className="tabular-nums">
                Sede Cochabamba
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Cargando oferta académica...
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sigla & Asignatura</TableHead>
                      <TableHead>Paralelo & Docente</TableHead>
                      <TableHead>Horario Principal</TableHead>
                      <TableHead className="text-right">Cupos</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offerings.map((off) => {
                      const isEnrolled = enrolledMap.has(off.id);
                      const isFull = off.availableQuota <= 0;
                      const firstSchedule = off.schedules?.[0];
                      return (
                        <TableRow key={off.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-[#002B49] bg-slate-100 px-1.5 py-0.5 rounded tabular-nums">
                                {off.subjectCode}
                              </span>
                              <span className="font-semibold text-xs text-slate-900">
                                {off.subjectName}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {off.careerName}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs font-semibold text-slate-800">
                              {off.groupCode}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {off.teacherName}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 tabular-nums">
                            {firstSchedule ? (
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3 text-[#002B49]" />
                                {firstSchedule.dayOfWeek}{' '}
                                {firstSchedule.startTime}–
                                {firstSchedule.endTime}
                                {off.schedules.length > 1 &&
                                  ` (+${off.schedules.length - 1})`}
                              </span>
                            ) : (
                              'Por definir'
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            <Badge
                              variant={
                                isEnrolled
                                  ? 'success'
                                  : isFull
                                    ? 'danger'
                                    : 'neutral'
                              }
                            >
                              {isEnrolled
                                ? 'Inscrito'
                                : isFull
                                  ? 'Agotado (0)'
                                  : `${off.availableQuota} / ${off.maxQuota}`}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedCourseId(off.id)}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Ver Ficha
                              </Button>
                              {off.enrollmentsOpen && !isEnrolled && !isFull && (
                                <Button
                                  variant="orange"
                                  size="sm"
                                  disabled={actionLoadingId === off.id}
                                  onClick={() => handleEnroll(off.id)}
                                >
                                  <PlusCircle className="w-3.5 h-3.5" />
                                  Inscribir
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PESTAÑA 2: MIS ASIGNATURAS INSCRITAS */}
        <TabsContent value="enrolled">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div className="space-y-0.5">
                <CardTitle>
                  Mis Asignaturas Inscritas ({currentPeriodObj?.code})
                </CardTitle>
                <CardDescription>
                  El retiro aplica baja lógica auditable y libera el cupo en la
                  Sede Central Cochabamba.
                </CardDescription>
              </div>
              <Badge variant="navy" className="tabular-nums">
                {myEnrollments.length} Materias Activas
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              {myEnrollments.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  No tiene asignaturas inscritas activas en esta gestión.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sigla & Asignatura</TableHead>
                      <TableHead>Paralelo & Docente</TableHead>
                      <TableHead className="text-right">
                        Nota Acumulada
                      </TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Operación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myEnrollments.map((enr) => (
                      <TableRow key={enr.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#002B49] bg-slate-100 px-1.5 py-0.5 rounded tabular-nums">
                              {enr.subjectCode}
                            </span>
                            <span className="font-semibold text-xs text-slate-900">
                              {enr.subjectName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-semibold text-slate-800">
                            {enr.groupCode}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {enr.teacherName}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold text-[#002B49] tabular-nums">
                          {enr.finalScore !== null
                            ? `${enr.finalScore} / 100`
                            : 'En evaluación'}
                        </TableCell>
                        <TableCell>
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
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setSelectedCourseId(enr.courseOfferingId)
                              }
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Ver Ficha
                            </Button>
                            {currentPeriodObj?.enrollmentsOpen && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-200 text-red-700 hover:bg-red-50"
                                disabled={actionLoadingId === enr.id}
                                onClick={() => handleWithdraw(enr.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Retirar
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
