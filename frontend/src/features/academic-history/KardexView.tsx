import React, { useEffect, useState } from 'react';
import {
  Award,
  BookCheck,
  TrendingUp,
  Clock,
  FileSpreadsheet,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { Badge, Card } from '../../components/ui/primitives';

export const KardexView: React.FC = () => {
  const [kardex, setKardex] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest('/grading/my-kardex')
      .then((res) => setKardex(res))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="p-8 text-center text-sm text-slate-500">
        Consultando Kardex Académico SIIA UNICEN...
      </Card>
    );
  }

  if (error || !kardex) {
    return (
      <Card className="p-6 text-red-600 text-sm">
        Error al cargar el historial académico: {error}
      </Card>
    );
  }

  const { summary, records } = kardex;

  return (
    <div className="space-y-6">
      {/* Encabezado de Kardex */}
      <div className="bg-[#002B49] text-white p-6 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#E05A1B] uppercase tracking-wider">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Historial Académico Oficial (Kardex Estudiantil)</span>
          </div>
          <h2 className="text-2xl font-extrabold mt-1">{kardex.studentName}</h2>
          <p className="text-xs text-slate-300 mt-1">
            Código R.U.: <strong>{kardex.registrationNumber}</strong> • Carrera:{' '}
            <strong>{kardex.careerName || 'Tronco Común UNICEN'}</strong> •{' '}
            {kardex.campusName}
          </p>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-center">
          <p className="text-[11px] uppercase tracking-wider text-slate-300">
            Promedio General Ponderado
          </p>
          <p className="text-3xl font-black text-[#E05A1B]">
            {summary.generalAverage}{' '}
            <span className="text-sm font-normal text-white">/ 100</span>
          </p>
        </div>
      </div>

      {/* Indicadores Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3 border-l-4 border-l-[#002B49]">
          <div className="p-2.5 rounded-lg bg-[#002B49]/10 text-[#002B49]">
            <BookCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">
              Materias Aprobadas
            </p>
            <p className="text-xl font-extrabold text-[#002B49]">
              {summary.approvedCourses} / {summary.totalEnrolledCourses}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-l-4 border-l-emerald-600">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">
              Créditos Aprobados
            </p>
            <p className="text-xl font-extrabold text-emerald-700">
              {summary.approvedCredits} Cr.
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-l-4 border-l-[#E05A1B]">
          <div className="p-2.5 rounded-lg bg-[#E05A1B]/10 text-[#E05A1B]">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">
              Materias en Curso
            </p>
            <p className="text-xl font-extrabold text-[#E05A1B]">
              {summary.inProgressCourses}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-l-4 border-l-slate-600">
          <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">
              Nota Mínima Aprobación
            </p>
            <p className="text-xl font-extrabold text-slate-800">51.0 pts</p>
          </div>
        </Card>
      </div>

      {/* Detalle de Materias y Desglose de Evaluaciones Dinámicas */}
      <div className="space-y-4">
        {records.map((rec: any) => (
          <Card key={rec.enrollmentId} className="p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="navy">{rec.periodCode}</Badge>
                  <Badge variant="neutral">{rec.subjectCode}</Badge>
                  <span className="text-xs text-slate-500 font-semibold">
                    Semestre {rec.semesterLevel} • {rec.credits} Créditos
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#002B49] mt-1">
                  {rec.subjectName}
                </h3>
                <p className="text-xs text-slate-500">
                  {rec.groupCode} • Docente: {rec.teacherName}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[11px] uppercase font-bold text-slate-400">
                    Nota Acumulada ({rec.evaluatedWeightPercentage}% eval.)
                  </p>
                  <p className="text-xl font-extrabold text-[#002B49]">
                    {rec.finalScore} / 100
                  </p>
                </div>
                <Badge
                  variant={
                    rec.status === 'APROBADA'
                      ? 'success'
                      : rec.status === 'REPROBADA'
                        ? 'danger'
                        : 'orange'
                  }
                >
                  {rec.status}
                </Badge>
              </div>
            </div>

            {/* Tabla de Evaluaciones Dinámicas Ponderadas */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase">
                    <th className="py-2 pr-3">Evaluación del Curso</th>
                    <th className="py-2 px-3">Ponderación (%)</th>
                    <th className="py-2 px-3">Nota Obtenida (/100)</th>
                    <th className="py-2 px-3">Puntos Ponderados</th>
                    <th className="py-2 pl-3">Observación Docente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rec.evaluationsBreakdown.map((ev: any) => (
                    <tr key={ev.evaluationId}>
                      <td className="py-2.5 pr-3 font-semibold text-slate-800">
                        {ev.evaluationName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {ev.weightPercentage}%
                      </td>
                      <td className="py-2.5 px-3">
                        {ev.score !== null ? (
                          <span
                            className={`font-bold ${
                              ev.score >= 51
                                ? 'text-emerald-700'
                                : 'text-red-600'
                            }`}
                          >
                            {ev.score} pts
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[#002B49]">
                        {ev.score !== null ? `+${ev.weightedPoints} pts` : '—'}
                      </td>
                      <td className="py-2.5 pl-3 text-slate-500">
                        {ev.feedback || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
