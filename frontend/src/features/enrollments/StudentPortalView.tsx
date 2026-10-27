import React, { useEffect, useState } from 'react';
import {
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Trash2,
  PlusCircle,
  Lock,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
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
import { Progress } from '../../components/ui/progress';

export const StudentPortalView: React.FC = () => {
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const loadData = async (periodId?: number) => {
    setLoading(true);
    try {
      const periodsList = await apiRequest<any[]>('/course-offerings/periods');
      setPeriods(periodsList);

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
        text: 'Inscripción registrada exitosamente bajo transacción ACID.',
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

  const enrolledCourseIds = new Set(
    myEnrollments.map((e) => e.courseOfferingId),
  );
  const currentPeriodObj = periods.find((p) => p.id === selectedPeriodId);

  return (
    <div className="space-y-6">
      {/* Barra de Control de Gestión Académica */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-lg border border-border shadow-sm">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#002B49] tracking-tight">
            Matrícula Estudiantil y Oferta de Cursos
          </h2>
          <p className="text-xs text-slate-600">
            Validación transaccional de cupos disponibles (bloqueo pesimista{' '}
            <code className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">
              FOR UPDATE
            </code>
            ), prevención de duplicidad y verificación de colisión horaria.
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

      {/* Mensajes de Validación de Dominio */}
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

      {/* Tabla de Materias Inscritas en la Gestión */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="space-y-0.5">
            <CardTitle>
              Mis Asignaturas Inscritas ({currentPeriodObj?.code})
            </CardTitle>
            <CardDescription>
              Cursos con matrícula activa. El retiro aplica baja lógica y libera
              inmediatamente el cupo para otros estudiantes.
            </CardDescription>
          </div>
          <Badge variant="navy" className="tabular-nums">
            {myEnrollments.length} Inscritas
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          {myEnrollments.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">
              No registra asignaturas inscritas activas en esta gestión
              académica.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sigla & Asignatura</TableHead>
                  <TableHead>Paralelo & Docente</TableHead>
                  <TableHead>Horario Asignado</TableHead>
                  <TableHead>Nota Acumulada</TableHead>
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
                        <span className="font-semibold text-slate-900">
                          {enr.subjectName}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
                        {enr.credits} Créditos Académicos
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-semibold text-slate-800">
                        {enr.groupCode}
                      </div>
                      <div className="text-xs text-slate-500">
                        {enr.teacherName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {enr.schedules?.map((s: any) => (
                          <span
                            key={s.id}
                            className="inline-flex items-center gap-1 text-[11px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-700 tabular-nums"
                          >
                            <Clock className="w-3 h-3 text-[#002B49]" />
                            <strong>{s.dayOfWeek}:</strong> {s.startTime}–
                            {s.endTime} ({s.classroom})
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-[#002B49] tabular-nums">
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
                      {currentPeriodObj?.enrollmentsOpen ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                          disabled={actionLoadingId === enr.id}
                          onClick={() => handleWithdraw(enr.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Retirar Curso
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400">Cerrado</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Catálogo de Oferta de Cursos de la Gestión */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#002B49]">
            Catálogo de Paralelos Ofertados ({offerings.length})
          </h3>
          <span className="text-xs text-slate-500">
            Seleccione un paralelo para ejecutar la validación de inscripción
          </span>
        </div>

        {loading ? (
          <Card className="p-8 text-center text-sm text-slate-500">
            Cargando oferta académica de SIIA UNICEN...
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {offerings.map((off) => {
              const isEnrolled = enrolledCourseIds.has(off.id);
              const isFull = off.availableQuota <= 0;
              const quotaPercent = Math.min(
                100,
                Math.round((off.enrolledCount / off.maxQuota) * 100),
              );

              return (
                <Card
                  key={off.id}
                  className="p-5 flex flex-col justify-between hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#002B49] bg-slate-100 px-1.5 py-0.5 rounded tabular-nums">
                            {off.subjectCode}
                          </span>
                          <Badge variant="neutral">{off.careerName}</Badge>
                          <span className="text-xs text-slate-500 tabular-nums">
                            Sem. {off.semesterLevel} • {off.credits} Cr.
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-[#002B49]">
                          {off.subjectName}
                        </h4>
                      </div>
                      <Badge
                        variant={
                          isEnrolled
                            ? 'success'
                            : isFull
                              ? 'danger'
                              : 'navy'
                        }
                        className="shrink-0 tabular-nums"
                      >
                        {isEnrolled
                          ? 'INSCRITO'
                          : isFull
                            ? 'CUPO AGOTADO'
                            : `${off.availableQuota} PLAZAS`}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-500">Paralelo:</span>{' '}
                        <strong className="text-slate-800">
                          {off.groupCode}
                        </strong>{' '}
                        ({off.modality})
                      </div>
                      <div>
                        <span className="text-slate-500">Docente:</span>{' '}
                        <strong className="text-slate-800">
                          {off.teacherName}
                        </strong>
                      </div>
                      <div className="sm:col-span-2 flex items-center gap-1.5 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-[#002B49] shrink-0" />
                        <span>{off.campusName}</span>
                      </div>
                    </div>

                    {/* Horarios del curso */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-slate-700">
                        Bloques Horarios:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {off.schedules?.map((s: any) => (
                          <span
                            key={s.id}
                            className="inline-flex items-center gap-1.5 text-xs bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded font-medium text-slate-800 tabular-nums"
                          >
                            <Clock className="w-3 h-3 text-[#002B49]" />
                            {s.dayOfWeek} {s.startTime}–{s.endTime} (
                            {s.classroom})
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Evaluaciones dinámicas ponderadas */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-slate-700">
                        Esquema de Evaluación Ponderada (100%):
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {off.evaluations?.map((ev: any) => (
                          <span
                            key={ev.id}
                            className="text-[11px] bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-medium tabular-nums"
                          >
                            {ev.name}: <strong>{ev.weightPercentage}%</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Barra de Cupos y Acción */}
                  <div className="mt-4 pt-3.5 border-t border-border/60 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex-1 min-w-[160px] space-y-1">
                      <div className="flex justify-between text-xs font-semibold tabular-nums">
                        <span className="text-slate-600">Ocupación</span>
                        <span
                          className={
                            isFull ? 'text-red-600 font-bold' : 'text-[#002B49]'
                          }
                        >
                          {off.enrolledCount} / {off.maxQuota} ({quotaPercent}%)
                        </span>
                      </div>
                      <Progress
                        value={quotaPercent}
                        className="h-1.5"
                        indicatorClassName={
                          isFull ? 'bg-red-600' : 'bg-[#002B49]'
                        }
                      />
                    </div>

                    <div>
                      {!off.enrollmentsOpen ? (
                        <Button variant="outline" size="sm" disabled>
                          <Lock className="w-3.5 h-3.5" />
                          Período Cerrado
                        </Button>
                      ) : (
                        <Button
                          variant={isEnrolled || isFull ? 'outline' : 'orange'}
                          size="sm"
                          disabled={actionLoadingId === off.id}
                          onClick={() => handleEnroll(off.id)}
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          {actionLoadingId === off.id
                            ? 'Procesando...'
                            : isEnrolled
                              ? 'Verificar No Duplicidad'
                              : isFull
                                ? 'Verificar Límite de Cupo'
                                : 'Inscribir Asignatura'}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
