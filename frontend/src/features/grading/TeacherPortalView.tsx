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
import { Badge, Button, Card, Input } from '../../components/ui/primitives';

export const TeacherPortalView: React.FC<{ user: AuthUser }> = ({ user }) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [gradebook, setGradebook] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Estado de edición de evaluaciones dinámicas
  const [editingEvals, setEditingEvals] = useState(false);
  const [evalDrafts, setEvalDrafts] = useState<
    Array<{ name: string; weightPercentage: number }>
  >([]);

  // Estado temporal de notas en la planilla: clave `${enrollmentId}_${evaluationId}`
  const [scoreInputs, setScoreInputs] = useState<Record<string, string>>({});
  const [feedbackInputs, setFeedbackInputs] = useState<Record<string, string>>(
    {},
  );
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const query =
        user.role === 'DOCENTE' ? `?teacherId=${user.id}` : '';
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
        text: 'Debe ingresar una calificación numérica entre 0 y 100.',
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
        text: 'Calificación registrada y nota acumulada recalculada mediante Patrón Strategy.',
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
        text: 'Estructura de evaluaciones dinámicas actualizada (100% verificado).',
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
      {/* Selector de Curso Docente */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#002B49]">
            Planilla Docente de Calificaciones y Evaluaciones Dinámicas
          </h2>
          <p className="text-xs text-slate-500">
            Cálculo automático mediante WeightedEvaluationStrategy (Aprobación &gt;= 51.0 pts)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-[#002B49]"
            value={selectedCourseId ?? ''}
            onChange={(e) => {
              const id = Number(e.target.value);
              setSelectedCourseId(id);
              loadGradebook(id);
            }}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                [{c.periodCode}] {c.subjectCode} - {c.subjectName} ({c.groupCode})
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingEvals(!editingEvals)}
          >
            <Sliders className="w-4 h-4 text-[#E05A1B]" />
            Configurar Ponderaciones (%)
          </Button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          )}
          <div className="text-sm font-medium">{feedback.text}</div>
        </div>
      )}

      {/* Panel de Configuración de Evaluaciones Dinámicas */}
      {editingEvals && (
        <Card className="p-5 border-2 border-[#E05A1B]/40 bg-orange-50/20 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#002B49]">
                Estructura Dinámica de Evaluaciones del Curso
              </h3>
              <p className="text-xs text-slate-600">
                La suma total de las ponderaciones debe ser exactamente 100%.
              </p>
            </div>
            <Badge
              variant={
                Math.abs(totalDraftWeight - 100) < 0.01 ? 'success' : 'danger'
              }
            >
              Suma actual: {totalDraftWeight}% / 100%
            </Badge>
          </div>

          <div className="space-y-2">
            {evalDrafts.map((ev, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <Input
                  placeholder="Nombre de la evaluación (ej. 1er Parcial)"
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
                  variant="danger"
                  size="sm"
                  disabled={evalDrafts.length <= 1}
                  onClick={() =>
                    setEvalDrafts(evalDrafts.filter((_, i) => i !== idx))
                  }
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setEvalDrafts([
                  ...evalDrafts,
                  { name: 'Nueva Evaluación', weightPercentage: 10 },
                ])
              }
            >
              <Plus className="w-4 h-4" />
              Añadir Rubro de Evaluación
            </Button>
            <Button
              variant="orange"
              size="sm"
              onClick={handleSaveEvaluationsConfig}
            >
              <Save className="w-4 h-4" />
              Guardar Ponderaciones del Curso
            </Button>
          </div>
        </Card>
      )}

      {/* Planilla de Estudiantes Inscritos y Registro de Notas */}
      {loading || !gradebook ? (
        <Card className="p-8 text-center text-sm text-slate-500">
          Cargando planilla docente...
        </Card>
      ) : gradebook.students.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-500">
          Este curso aún no tiene estudiantes inscritos activos.
        </Card>
      ) : (
        <div className="space-y-4">
          {gradebook.students.map((st: any) => (
            <Card key={st.enrollmentId} className="p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-[#002B49]">
                      {st.studentRegistrationNumber}
                    </span>
                    <h4 className="font-bold text-[#002B49] text-base">
                      {st.studentName}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500">{st.studentEmail}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[11px] uppercase font-bold text-slate-400">
                      Nota Final Ponderada ({st.evaluatedWeightPercentage}% eval.)
                    </p>
                    <p className="text-xl font-black text-[#002B49]">
                      {st.finalScore ?? 0} / 100
                    </p>
                  </div>
                  <Badge
                    variant={
                      st.status === 'APROBADA'
                        ? 'success'
                        : st.status === 'REPROBADA'
                          ? 'danger'
                          : 'orange'
                    }
                  >
                    {st.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {st.grades.map((g: any) => {
                  const key = `${st.enrollmentId}_${g.evaluationId}`;
                  return (
                    <div
                      key={g.evaluationId}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#002B49]">
                          {g.evaluationName}
                        </span>
                        <Badge variant="navy">{g.weightPercentage}%</Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.5"
                          placeholder="0 - 100"
                          value={scoreInputs[key] ?? ''}
                          onChange={(e) =>
                            setScoreInputs({
                              ...scoreInputs,
                              [key]: e.target.value,
                            })
                          }
                          className="w-24 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-bold text-[#002B49]"
                        />
                        <span className="text-xs text-slate-500">
                          {g.score >= 0
                            ? `(${g.weightedContribution} pts)`
                            : '(Sin nota)'}
                        </span>
                      </div>

                      <input
                        type="text"
                        placeholder="Observación / retroalimentación..."
                        value={feedbackInputs[key] ?? ''}
                        onChange={(e) =>
                          setFeedbackInputs({
                            ...feedbackInputs,
                            [key]: e.target.value,
                          })
                        }
                        className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                      />

                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full"
                        disabled={savingKey === key}
                        onClick={() =>
                          handleSaveGrade(st.enrollmentId, g.evaluationId)
                        }
                      >
                        <Save className="w-3.5 h-3.5" />
                        {savingKey === key ? 'Guardando...' : 'Guardar Nota'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
