import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Trash2,
  PlusCircle,
  Users,
  Lock,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { Badge, Button, Card } from '../../components/ui/primitives';

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
      {/* Selector de Gestión Académica */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-[#002B49]">
            Oferta de Cursos e Inscripción Estudiantil
          </h2>
          <p className="text-xs text-slate-500">
            Validación transaccional de cupos disponibles, no duplicidad y choque
            de horarios.
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
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-[#002B49]"
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
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          )}
          <div className="text-sm font-medium">{feedback.text}</div>
        </div>
      )}

      {/* Mis Materias Inscritas en la Gestión */}
      <Card className="p-5 border-t-4 border-t-[#002B49]">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#002B49] mb-4 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-[#E05A1B]" />
          Mis Cursos Inscritos ({myEnrollments.length})
        </h3>

        {myEnrollments.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">
            No tienes cursos inscritos activos en esta gestión.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myEnrollments.map((enr) => (
              <div
                key={enr.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="navy">{enr.subjectCode}</Badge>
                    <Badge
                      variant={
                        enr.status === 'APROBADA'
                          ? 'success'
                          : enr.status === 'REPROBADA'
                            ? 'danger'
                            : 'orange'
                      }
                    >
                      {enr.status}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-[#002B49] mt-2">
                    {enr.subjectName}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {enr.groupCode} • Docente: {enr.teacherName} • {enr.credits}{' '}
                    Créditos
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {enr.schedules?.map((s: any) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1 text-xs bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700"
                      >
                        <Clock className="w-3 h-3 text-[#E05A1B]" />
                        {s.dayOfWeek} {s.startTime}-{s.endTime} ({s.classroom})
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <span className="text-xs font-semibold text-slate-600">
                    Nota Acumulada:{' '}
                    <strong className="text-[#002B49]">
                      {enr.finalScore !== null ? `${enr.finalScore} / 100` : 'En evaluación'}
                    </strong>
                  </span>
                  {currentPeriodObj?.enrollmentsOpen && (
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={actionLoadingId === enr.id}
                      onClick={() => handleWithdraw(enr.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Retirar Curso (Baja Lógica)
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Catálogo de Oferta de Cursos de la Gestión */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
          Catálogo de Cursos Ofertados ({offerings.length})
        </h3>

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
                  className="p-5 flex flex-col justify-between hover:border-[#002B49]/40 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="navy">{off.subjectCode}</Badge>
                          <Badge variant="neutral">{off.careerName}</Badge>
                          <span className="text-xs font-semibold text-slate-500">
                            Sem. {off.semesterLevel} • {off.credits} Cr.
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-[#002B49] mt-1.5">
                          {off.subjectName}
                        </h4>
                      </div>
                      <Badge
                        variant={
                          isEnrolled
                            ? 'success'
                            : isFull
                              ? 'danger'
                              : 'orange'
                        }
                      >
                        {isEnrolled
                          ? 'YA INSCRITO'
                          : isFull
                            ? 'CUPO AGOTADO'
                            : `${off.availableQuota} CUPOS DISP.`}
                      </Badge>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <p>
                        <strong>Paralelo:</strong> {off.groupCode} ({off.modality}) •{' '}
                        <strong>Docente:</strong> {off.teacherName}
                      </p>
                      <p className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-[#002B49]" />
                        {off.campusName}
                      </p>
                    </div>

                    {/* Horarios del curso */}
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold uppercase text-slate-500">
                        Horarios de Clases:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {off.schedules?.map((s: any) => (
                          <span
                            key={s.id}
                            className="inline-flex items-center gap-1 text-xs bg-slate-100 px-2.5 py-1 rounded-md font-medium text-slate-800"
                          >
                            <Calendar className="w-3 h-3 text-[#E05A1B]" />
                            {s.dayOfWeek} {s.startTime} - {s.endTime} ({s.classroom})
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Evaluaciones dinámicas ponderadas */}
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold uppercase text-slate-500">
                        Ponderación Dinámica de Evaluaciones (100%):
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {off.evaluations?.map((ev: any) => (
                          <span
                            key={ev.id}
                            className="text-[11px] bg-[#002B49]/5 text-[#002B49] border border-[#002B49]/15 px-2 py-0.5 rounded font-semibold"
                          >
                            {ev.name}: {ev.weightPercentage}%
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Barra de Cupos y Acción */}
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="flex items-center gap-1 text-slate-600">
                          <Users className="w-3.5 h-3.5" />
                          Ocupación de Cupo
                        </span>
                        <span
                          className={
                            isFull ? 'text-red-600 font-bold' : 'text-[#002B49]'
                          }
                        >
                          {off.enrolledCount} / {off.maxQuota} inscritos ({quotaPercent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            isFull ? 'bg-red-600' : 'bg-[#E05A1B]'
                          }`}
                          style={{ width: `${quotaPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      {!off.enrollmentsOpen ? (
                        <Button variant="outline" size="sm" disabled>
                          <Lock className="w-3.5 h-3.5" />
                          Período Cerrado
                        </Button>
                      ) : (
                        <Button
                          variant={isEnrolled ? 'outline' : 'orange'}
                          size="sm"
                          disabled={actionLoadingId === off.id}
                          onClick={() => handleEnroll(off.id)}
                        >
                          <PlusCircle className="w-4 h-4" />
                          {actionLoadingId === off.id
                            ? 'Validando...'
                            : isEnrolled
                              ? 'Probar Inscripción Duplicada'
                              : isFull
                                ? 'Probar Cupo Agotado'
                                : 'Inscribirme al Curso'}
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
