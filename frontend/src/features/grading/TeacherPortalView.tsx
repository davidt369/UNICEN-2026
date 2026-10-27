import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Save,
  Sliders,
  Plus,
  Trash2,
} from 'lucide-react';
import { apiRequest, AuthUser } from '../../lib/api';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from '../../components/ui/primitives';

export const TeacherPortalView: React.FC<{ user: AuthUser }> = ({ user }) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [gradebook, setGradebook] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [editingEvals, setEditingEvals] = useState(false);
  const [evalDrafts, setEvalDrafts] = useState<
    Array<{ name: string; weightPercentage: number }>
  >([]);

  const [scoreInputs, setScoreInputs] = useState<Record<string, string>>({});
  const [feedbackInputs, setFeedbackInputs] = useState<Record<string, string>>(
    {},
  );
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const query = user.role === 'DOCENTE' ? `?teacherId=${user.id}` : '';
      const list = await apiRequest<any[]>(`/course-offerings${query}`);
      setCourses(list);
      if (list.length > 0) {
        const firstId = selectedCourseId || list[0].id;
        setSelectedCourseId(firstId);
        await loadGradebook(firstId);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const loadGradebook = async (courseId: number) => {
    try {
      const gb = await apiRequest<any>(`/grading/course/${courseId}/gradebook`);
      setGradebook(gb);
      setEvalDrafts(
        gb.evaluations.map((e: any) => ({
          name: e.name,
          weightPercentage: Number(e.weightPercentage),
        })),
      );

      const initialScores: Record<string, string> = {};
      const initialFb: Record<string, string> = {};
      for (const st of gb.students) {
        for (const g of st.grades) {
          const key = `${st.enrollmentId}_${g.evaluationId}`;
          initialScores[key] = g.score >= 0 ? String(g.score) : '';
          initialFb[key] = g.feedback || '';
        }
      }
      setScoreInputs(initialScores);
      setFeedbackInputs(initialFb);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleSaveGrade = async (enrollmentId: number, evaluationId: number) => {
    const key = `${enrollmentId}_${evaluationId}`;
    const rawVal = scoreInputs[key];
    if (rawVal === undefined || rawVal === '') {
      setFeedback({
        type: 'error',
        text: 'Ingrese una calificación numérica válida entre 0 y 100 puntos.',
      });
      return;
    }

    setFeedback(null);
    setSavingKey(key);
    try {
      await apiRequest('/grading/record', {
        method: 'POST',
        body: JSON.stringify({
          enrollmentId,
          evaluationId,
          score: Number(rawVal),
          feedback: feedbackInputs[key] || undefined,
        }),
      });
      setFeedback({
        type: 'success',
        text: 'Calificación registrada y nota acumulada recalculada mediante WeightedEvaluationStrategy.',
      });
      if (selectedCourseId) await loadGradebook(selectedCourseId);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveEvaluationsConfig = async () => {
    if (!selectedCourseId) return;
    setFeedback(null);
    try {
      await apiRequest(`/course-offerings/${selectedCourseId}/evaluations`, {
        method: 'PUT',
        body: JSON.stringify({
          evaluations: evalDrafts.map((ev, i) => ({
            name: ev.name,
            weightPercentage: Number(ev.weightPercentage),
            orderIndex: i + 1,
          })),
        }),
      });
      setEditingEvals(false);
      setFeedback({
        type: 'success',
        text: 'Esquema de evaluaciones ponderadas actualizado (100% verificado).',
      });
      await loadGradebook(selectedCourseId);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const totalDraftWeight = evalDrafts.reduce(
    (acc, curr) => acc + Number(curr.weightPercentage || 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Barra Superior de Selección de Curso Docente */}
      <div className="bg-white p-5 rounded-lg border border-border shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#002B49] tracking-tight">
            Planilla Docente de Calificaciones y Ponderación Dinámica
          </h2>
          <p className="text-xs text-slate-600">
            Cálculo automático de nota acumulada mediante el patrón{' '}
            <code className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">
              WeightedEvaluationStrategy
            </code>{' '}
            (nota mínima de aprobación: 51.0 / 100 pts).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Seleccionar Paralelo Docente"
            className="h-9 rounded-md border border-input bg-background px-3 text-xs font-semibold text-[#002B49] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={selectedCourseId ?? ''}
            onChange={(e) => {
              const id = Number(e.target.value);
              setSelectedCourseId(id);
              loadGradebook(id);
            }}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                [{c.periodCode}] {c.subjectCode} — {c.subjectName} ({c.groupCode})
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingEvals(!editingEvals)}
          >
            <Sliders className="w-3.5 h-3.5 text-[#002B49]" />
            Configurar Ponderaciones (%)
          </Button>
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

      {/* Panel de Configuración de Evaluaciones Dinámicas */}
      {editingEvals && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="space-y-0.5">
              <CardTitle>
                Configuración de Evaluaciones Ponderadas del Paralelo
              </CardTitle>
              <CardDescription>
                La suma exacta de todos los rubros evaluativos del curso debe
                totalizar 100%.
              </CardDescription>
            </div>
            <Badge
              variant={
                Math.abs(totalDraftWeight - 100) < 0.01 ? 'success' : 'danger'
              }
              className="tabular-nums"
            >
              Total configurado: {totalDraftWeight}% / 100%
            </Badge>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2.5">
              {evalDrafts.map((ev, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Input
                    placeholder="Nombre del rubro (ej. Primer Parcial)"
                    value={ev.name}
                    onChange={(e) => {
                      const copy = [...evalDrafts];
                      copy[idx].name = e.target.value;
                      setEvalDrafts(copy);
                    }}
                    className="flex-1"
                  />
                  <div className="w-32">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={ev.weightPercentage}
                      onChange={(e) => {
                        const copy = [...evalDrafts];
                        copy[idx].weightPercentage = Number(e.target.value);
                        setEvalDrafts(copy);
                      }}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-700 hover:bg-red-50"
                    disabled={evalDrafts.length <= 1}
                    onClick={() =>
                      setEvalDrafts(evalDrafts.filter((_, i) => i !== idx))
                    }
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setEvalDrafts([
                    ...evalDrafts,
                    { name: 'Evaluación Adicional', weightPercentage: 10 },
                  ])
                }
              >
                <Plus className="w-3.5 h-3.5" />
                Añadir Rubro Evaluativo
              </Button>
              <Button
                variant="orange"
                size="sm"
                onClick={handleSaveEvaluationsConfig}
              >
                <Save className="w-3.5 h-3.5" />
                Guardar Esquema de Ponderación
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Planilla de Estudiantes Inscritos y Registro de Notas */}
      {loading || !gradebook ? (
        <Card className="p-8 text-center text-sm text-slate-500">
          Cargando planilla oficial de calificaciones...
        </Card>
      ) : gradebook.students.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-500">
          Este paralelo no registra estudiantes inscritos activos en la gestión.
        </Card>
      ) : (
        <div className="space-y-4">
          {gradebook.students.map((st: any) => (
            <Card key={st.enrollmentId}>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-slate-100 px-1.5 py-0.5 rounded text-[#002B49] tabular-nums">
                      {st.studentRegistrationNumber}
                    </span>
                    <CardTitle className="text-sm font-bold text-[#002B49]">
                      {st.studentName}
                    </CardTitle>
                  </div>
                  <CardDescription className="font-mono text-xs">
                    {st.studentEmail}
                  </CardDescription>
                </div>

                <div className="flex items-center gap-3 tabular-nums">
                  <div className="text-right">
                    <p className="text-[11px] font-medium text-slate-500">
                      Nota Acumulada ({st.evaluatedWeightPercentage}% evaluado)
                    </p>
                    <p className="text-lg font-bold text-[#002B49]">
                      {st.finalScore ?? 0} / 100
                    </p>
                  </div>
                  <Badge
                    variant={
                      st.status === 'APROBADA'
                        ? 'success'
                        : st.status === 'REPROBADA'
                          ? 'danger'
                          : 'navy'
                    }
                  >
                    {st.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {st.grades.map((g: any) => {
                  const key = `${st.enrollmentId}_${g.evaluationId}`;
                  return (
                    <div
                      key={g.evaluationId}
                      className="p-3.5 rounded-md border border-border bg-slate-50/70 space-y-2.5 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[#002B49]">
                            {g.evaluationName}
                          </span>
                          <Badge variant="navy" className="tabular-nums">
                            {g.weightPercentage}%
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step="0.5"
                            placeholder="0 - 100"
                            aria-label={`Nota ${g.evaluationName} para ${st.studentName}`}
                            value={scoreInputs[key] ?? ''}
                            onChange={(e) =>
                              setScoreInputs({
                                ...scoreInputs,
                                [key]: e.target.value,
                              })
                            }
                            className="w-24 h-8 rounded-md border border-input bg-white px-2.5 text-xs font-bold text-[#002B49] tabular-nums focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          />
                          <span className="text-[11px] font-mono text-slate-600 tabular-nums">
                            {g.score >= 0
                              ? `+${g.weightedContribution} pts`
                              : 'Sin registro'}
                          </span>
                        </div>

                        <input
                          type="text"
                          placeholder="Observación docente..."
                          aria-label={`Observación ${g.evaluationName} para ${st.studentName}`}
                          value={feedbackInputs[key] ?? ''}
                          onChange={(e) =>
                            setFeedbackInputs({
                              ...feedbackInputs,
                              [key]: e.target.value,
                            })
                          }
                          className="w-full h-8 rounded-md border border-input bg-white px-2.5 text-xs text-slate-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full h-8 text-xs"
                        disabled={savingKey === key}
                        onClick={() =>
                          handleSaveGrade(st.enrollmentId, g.evaluationId)
                        }
                      >
                        <Save className="w-3.5 h-3.5" />
                        {savingKey === key ? 'Guardando...' : 'Registrar Nota'}
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
