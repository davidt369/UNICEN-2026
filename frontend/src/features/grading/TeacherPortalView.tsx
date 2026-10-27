import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Save,
  Sliders,
  Plus,
  Trash2,
  ArrowLeft,
  Edit3,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';

export const TeacherPortalView: React.FC<{ user: AuthUser }> = ({ user }) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [gradebook, setGradebook] = useState<any | null>(null);
  const [selectedStudentEnrollmentId, setSelectedStudentEnrollmentId] =
    useState<number | null>(null);
  const [editingEvals, setEditingEvals] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

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
        text: 'Calificación registrada y nota acumulada actualizada.',
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

  const selectedCourseObj = courses.find((c) => c.id === selectedCourseId);
  const selectedStudent = gradebook?.students?.find(
    (s: any) => s.enrollmentId === selectedStudentEnrollmentId,
  );

  // PÁGINA DE DETALLE 1: CONFIGURACIÓN DE PONDERACIONES DEL CURSO (100%)
  if (editingEvals) {
    return (
      <div className="space-y-4 sm:space-y-6 w-full min-w-0">
        <div className="bg-white border border-border rounded-lg p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-[#002B49]">
              Configuración de Evaluaciones Ponderadas —{' '}
              {selectedCourseObj?.subjectName}
            </h2>
            <p className="text-xs text-slate-600">
              Paralelo: {selectedCourseObj?.groupCode} • La suma de todos los
              rubros debe ser exactamente 100%.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto shrink-0"
            onClick={() => {
              setEditingEvals(false);
              setFeedback(null);
            }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a la Nómina del Curso
          </Button>
        </div>

        {feedback && (
          <div
            role="alert"
            className={`p-3.5 sm:p-4 rounded-lg border flex items-start gap-2.5 text-xs ${
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
            <div className="font-medium">{feedback.text}</div>
          </div>
        )}

        <Card className="overflow-hidden">
          <CardHeader className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <CardTitle>Rubros de Evaluación del Paralelo</CardTitle>
              <CardDescription>
                Defina el nombre y porcentaje de cada parcial o proyecto final.
              </CardDescription>
            </div>
            <Badge
              variant={
                Math.abs(totalDraftWeight - 100) < 0.01 ? 'success' : 'danger'
              }
              className="tabular-nums self-start sm:self-auto"
            >
              Suma actual: {totalDraftWeight}% / 100%
            </Badge>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
            <div className="space-y-3">
              {evalDrafts.map((ev, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center gap-2.5 p-3 sm:p-0 rounded-md bg-slate-50 sm:bg-transparent border border-slate-200 sm:border-0"
                >
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
                  <div className="flex items-center gap-2">
                    <div className="flex-1 sm:w-32">
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
                      className="border-red-200 text-red-700 hover:bg-red-50 shrink-0"
                      disabled={evalDrafts.length <= 1}
                      onClick={() =>
                        setEvalDrafts(evalDrafts.filter((_, i) => i !== idx))
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-border/60">
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
                Añadir Rubro
              </Button>
              <Button
                variant="orange"
                size="sm"
                onClick={handleSaveEvaluationsConfig}
              >
                <Save className="w-3.5 h-3.5" />
                Guardar Ponderaciones (100%)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // PÁGINA DE DETALLE 2: FICHA INDIVIDUAL DE CALIFICACIÓN DEL ESTUDIANTE
  if (selectedStudent) {
    return (
      <div className="space-y-4 sm:space-y-6 w-full min-w-0">
        <div className="bg-white border border-border rounded-lg p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#002B49] bg-slate-100 px-2 py-0.5 rounded tabular-nums">
                {selectedStudent.studentRegistrationNumber}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-[#002B49]">
                {selectedStudent.studentName}
              </h2>
              <Badge
                variant={
                  selectedStudent.status === 'APROBADA'
                    ? 'success'
                    : selectedStudent.status === 'REPROBADA'
                      ? 'danger'
                      : 'navy'
                }
              >
                {selectedStudent.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-600">
              Asignatura:{' '}
              <strong>
                {selectedCourseObj?.subjectCode} —{' '}
                {selectedCourseObj?.subjectName}
              </strong>{' '}
              ({selectedCourseObj?.groupCode}) •{' '}
              <span className="font-mono">{selectedStudent.studentEmail}</span>
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto shrink-0"
            onClick={() => {
              setSelectedStudentEnrollmentId(null);
              setFeedback(null);
            }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a la Nómina del Curso
          </Button>
        </div>

        {feedback && (
          <div
            role="alert"
            className={`p-3.5 sm:p-4 rounded-lg border flex items-start gap-2.5 text-xs ${
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
            <div className="font-medium">{feedback.text}</div>
          </div>
        )}

        <Card className="overflow-hidden">
          <CardHeader className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <CardTitle>
                Registro de Calificaciones por Rubro Ponderado
              </CardTitle>
              <CardDescription>
                Ingrese la calificación sobre 100 puntos. El sistema recalcula
                la nota ponderada y el estado de aprobación (≥ 51.0 pts).
              </CardDescription>
            </div>
            <div className="sm:text-right tabular-nums bg-slate-50 sm:bg-transparent p-2.5 sm:p-0 rounded-md border border-slate-200 sm:border-0">
              <p className="text-[11px] text-slate-500">
                Nota Acumulada ({selectedStudent.evaluatedWeightPercentage}%
                evaluado)
              </p>
              <p className="text-base sm:text-lg font-bold text-[#002B49]">
                {selectedStudent.finalScore ?? 0} / 100 pts
              </p>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* VISTA MÓVIL: TARJETAS DE CALIFICACIÓN POR RUBRO */}
            <div className="md:hidden divide-y divide-border">
              {selectedStudent.grades.map((g: any) => {
                const key = `${selectedStudent.enrollmentId}_${g.evaluationId}`;
                return (
                  <div key={g.evaluationId} className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-slate-900">
                        {g.evaluationName}
                      </span>
                      <div className="flex items-center gap-2 font-mono text-xs tabular-nums">
                        <Badge variant="default">{g.weightPercentage}%</Badge>
                        <span className="font-bold text-[#002B49]">
                          {g.score >= 0
                            ? `+${g.weightedContribution} pts`
                            : '—'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Calificación (0–100 pts)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.5"
                          placeholder="0 - 100"
                          aria-label={`Nota ${g.evaluationName}`}
                          value={scoreInputs[key] ?? ''}
                          onChange={(e) =>
                            setScoreInputs({
                              ...scoreInputs,
                              [key]: e.target.value,
                            })
                          }
                          className="w-full h-9 rounded-md border border-input bg-white px-3 text-xs font-bold text-[#002B49] tabular-nums focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Observación / Retroalimentación
                        </label>
                        <input
                          type="text"
                          placeholder="Observación docente..."
                          aria-label={`Observación ${g.evaluationName}`}
                          value={feedbackInputs[key] ?? ''}
                          onChange={(e) =>
                            setFeedbackInputs({
                              ...feedbackInputs,
                              [key]: e.target.value,
                            })
                          }
                          className="w-full h-9 rounded-md border border-input bg-white px-3 text-xs text-slate-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      disabled={savingKey === key}
                      onClick={() =>
                        handleSaveGrade(
                          selectedStudent.enrollmentId,
                          g.evaluationId,
                        )
                      }
                    >
                      <Save className="w-3.5 h-3.5" />
                      {savingKey === key ? 'Guardando...' : 'Guardar Calificación'}
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* VISTA ESCRITORIO: TABLA DE RUBROS */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rubro de Evaluación</TableHead>
                    <TableHead className="text-right">Ponderación</TableHead>
                    <TableHead>Calificación (0–100)</TableHead>
                    <TableHead className="text-right">Puntos Ganados</TableHead>
                    <TableHead>Observación / Retroalimentación</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedStudent.grades.map((g: any) => {
                    const key = `${selectedStudent.enrollmentId}_${g.evaluationId}`;
                    return (
                      <TableRow key={g.evaluationId}>
                        <TableCell className="font-semibold text-xs text-slate-800">
                          {g.evaluationName}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-slate-600 tabular-nums">
                          {g.weightPercentage}%
                        </TableCell>
                        <TableCell className="w-32">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step="0.5"
                            placeholder="0 - 100"
                            aria-label={`Nota ${g.evaluationName}`}
                            value={scoreInputs[key] ?? ''}
                            onChange={(e) =>
                              setScoreInputs({
                                ...scoreInputs,
                                [key]: e.target.value,
                              })
                            }
                            className="w-24 h-8 rounded-md border border-input bg-white px-2.5 text-xs font-bold text-[#002B49] tabular-nums focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          />
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold text-[#002B49] tabular-nums">
                          {g.score >= 0
                            ? `+${g.weightedContribution} pts`
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <input
                            type="text"
                            placeholder="Observación docente..."
                            aria-label={`Observación ${g.evaluationName}`}
                            value={feedbackInputs[key] ?? ''}
                            onChange={(e) =>
                              setFeedbackInputs({
                                ...feedbackInputs,
                                [key]: e.target.value,
                              })
                            }
                            className="w-full h-8 rounded-md border border-input bg-white px-2.5 text-xs text-slate-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={savingKey === key}
                            onClick={() =>
                              handleSaveGrade(
                                selectedStudent.enrollmentId,
                                g.evaluationId,
                              )
                            }
                          >
                            <Save className="w-3.5 h-3.5" />
                            {savingKey === key ? 'Guardando...' : 'Guardar'}
                          </Button>
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

  // VISTA PRINCIPAL: NÓMINA LIMPIA DE ESTUDIANTES DEL PARALELO
  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      <div className="bg-white p-4 sm:p-5 rounded-lg border border-border shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-[#002B49] tracking-tight">
            Planilla Docente de Calificaciones — Sede Central Cochabamba
          </h2>
          <p className="text-xs text-slate-600">
            Seleccione un estudiante de la nómina para abrir su ficha individual
            de calificación por rubros ponderados.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto min-w-0">
          <select
            aria-label="Seleccionar Paralelo Docente"
            className="h-9 w-full sm:w-80 max-w-full min-w-0 truncate rounded-md border border-input bg-background px-3 text-xs font-semibold text-[#002B49] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={selectedCourseId ?? ''}
            onChange={(e) => {
              const id = Number(e.target.value);
              setSelectedCourseId(id);
              setSelectedStudentEnrollmentId(null);
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
            className="w-full sm:w-auto shrink-0"
            onClick={() => setEditingEvals(true)}
          >
            <Sliders className="w-3.5 h-3.5 text-[#002B49]" />
            Configurar Ponderaciones (100%)
          </Button>
        </div>
      </div>

      {feedback && (
        <div
          role="alert"
          className={`p-3.5 sm:p-4 rounded-lg border flex items-start gap-2.5 text-xs ${
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
          <div className="font-medium">{feedback.text}</div>
        </div>
      )}

      <Card className="overflow-hidden">
        <CardHeader className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <CardTitle>
              Nómina Oficial de Estudiantes Inscritos (
              {selectedCourseObj?.subjectCode} — {selectedCourseObj?.groupCode})
            </CardTitle>
            <CardDescription>
              Toque &ldquo;Calificar Estudiante&rdquo; para registrar o
              actualizar sus notas parciales.
            </CardDescription>
          </div>
          <Badge variant="navy" className="tabular-nums self-start sm:self-auto">
            {gradebook?.students?.length || 0} Estudiantes
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          {loading || !gradebook ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Cargando nómina de estudiantes...
            </div>
          ) : gradebook.students.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Este paralelo no registra estudiantes inscritos activos.
            </div>
          ) : (
            <>
              {/* VISTA MÓVIL: LISTA DE ESTUDIANTES DEL PARALELO */}
              <div className="md:hidden divide-y divide-border">
                {gradebook.students.map((st: any) => (
                  <div key={st.enrollmentId} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-mono text-[11px] font-bold bg-slate-100 px-1.5 py-0.5 rounded text-[#002B49] tabular-nums">
                          {st.studentRegistrationNumber}
                        </span>
                        <h3 className="font-semibold text-sm text-slate-900 mt-1">
                          {st.studentName}
                        </h3>
                        <p className="text-[11px] font-mono text-slate-500 truncate">
                          {st.studentEmail}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono text-sm font-bold text-[#002B49] tabular-nums">
                          {st.finalScore ?? 0} / 100
                        </div>
                        <Badge
                          variant={
                            st.status === 'APROBADA'
                              ? 'success'
                              : st.status === 'REPROBADA'
                                ? 'danger'
                                : 'navy'
                          }
                          className="mt-1"
                        >
                          {st.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-[11px] text-slate-500 tabular-nums">
                        Avance evaluado: {st.evaluatedWeightPercentage}%
                      </span>
                      <Button
                        variant="orange"
                        size="sm"
                        onClick={() =>
                          setSelectedStudentEnrollmentId(st.enrollmentId)
                        }
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Calificar Estudiante
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* VISTA ESCRITORIO: TABLA CLÁSICA */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Registro (R.U.)</TableHead>
                      <TableHead>Estudiante</TableHead>
                      <TableHead className="text-right">
                        Avance Evaluado
                      </TableHead>
                      <TableHead className="text-right">
                        Nota Acumulada
                      </TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Operación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gradebook.students.map((st: any) => (
                      <TableRow key={st.enrollmentId}>
                        <TableCell>
                          <span className="font-mono text-xs font-bold bg-slate-100 px-1.5 py-0.5 rounded text-[#002B49] tabular-nums">
                            {st.studentRegistrationNumber}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-xs text-slate-900">
                            {st.studentName}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {st.studentEmail}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-slate-600 tabular-nums">
                          {st.evaluatedWeightPercentage}%
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold text-[#002B49] tabular-nums">
                          {st.finalScore ?? 0} / 100
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="orange"
                            size="sm"
                            onClick={() =>
                              setSelectedStudentEnrollmentId(st.enrollmentId)
                            }
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Calificar Estudiante
                          </Button>
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
};
