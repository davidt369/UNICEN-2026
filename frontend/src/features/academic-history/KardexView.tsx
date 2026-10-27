import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import {
  Badge,
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
        Consultando Kardex Académico Oficial en SIIA UNICEN...
      </Card>
    );
  }

  if (error || !kardex) {
    return (
      <Card className="p-6 text-red-700 text-xs font-medium">
        No se pudo recuperar el historial académico: {error}
      </Card>
    );
  }

  const { summary, records } = kardex;

  return (
    <div className="space-y-6">
      {/* Ficha Institucional de Kardex Estudiantil */}
      <div className="bg-white border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="bg-[#002B49] text-white px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight">
              Kardex Académico Oficial — {kardex.studentName}
            </h2>
            <p className="text-xs text-sky-100/85 tabular-nums">
              Registro Universitario:{' '}
              <strong className="font-mono text-white">
                {kardex.registrationNumber}
              </strong>{' '}
              • Programa:{' '}
              <strong className="text-white">
                {kardex.careerName || 'Tronco Común UNICEN'}
              </strong>{' '}
              • {kardex.campusName}
            </p>
          </div>

          <div className="bg-[#003865] border border-white/15 rounded-md px-4 py-2.5 text-right tabular-nums">
            <p className="text-[11px] font-medium text-sky-200">
              Promedio General Ponderado
            </p>
            <p className="text-2xl font-bold text-white">
              {summary.generalAverage}{' '}
              <span className="text-xs font-normal text-sky-200">/ 100 pts</span>
            </p>
          </div>
        </div>

        {/* Cinta de Resumen Curricular */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border bg-white">
          <div className="p-4">
            <p className="text-xs font-medium text-slate-500">
              Asignaturas Aprobadas
            </p>
            <p className="text-xl font-bold text-[#002B49] mt-1 tabular-nums">
              {summary.approvedCourses}{' '}
              <span className="text-xs font-normal text-slate-500">
                de {summary.totalEnrolledCourses} cursadas
              </span>
            </p>
          </div>

          <div className="p-4">
            <p className="text-xs font-medium text-slate-500">
              Créditos Académicos Vencidos
            </p>
            <p className="text-xl font-bold text-emerald-700 mt-1 tabular-nums">
              {summary.approvedCredits} Cr.
            </p>
          </div>

          <div className="p-4">
            <p className="text-xs font-medium text-slate-500">
              Asignaturas en Curso
            </p>
            <p className="text-xl font-bold text-[#002B49] mt-1 tabular-nums">
              {summary.inProgressCourses}
            </p>
          </div>

          <div className="p-4">
            <p className="text-xs font-medium text-slate-500">
              Escala Reglamentaria UNICEN
            </p>
            <p className="text-xl font-bold text-slate-800 mt-1 tabular-nums">
              ≥ 51.0 pts{' '}
              <span className="text-xs font-normal text-slate-500">
                (Aprobación)
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Detalle de Materias y Desglose de Evaluaciones Dinámicas */}
      <div className="space-y-4">
        {records.map((rec: any) => (
          <Card key={rec.enrollmentId}>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="navy" className="tabular-nums">
                    {rec.periodCode}
                  </Badge>
                  <span className="font-mono text-xs font-bold text-[#002B49] bg-slate-100 px-1.5 py-0.5 rounded tabular-nums">
                    {rec.subjectCode}
                  </span>
                  <CardTitle className="text-sm font-bold text-[#002B49]">
                    {rec.subjectName}
                  </CardTitle>
                </div>
                <CardDescription className="tabular-nums">
                  {rec.groupCode} • Docente: {rec.teacherName} • Semestre{' '}
                  {rec.semesterLevel} ({rec.credits} Créditos)
                </CardDescription>
              </div>

              <div className="flex items-center gap-3 tabular-nums">
                <div className="text-right">
                  <p className="text-[11px] font-medium text-slate-500">
                    Nota Ponderada ({rec.evaluatedWeightPercentage}% evaluado)
                  </p>
                  <p className="text-lg font-bold text-[#002B49]">
                    {rec.finalScore} / 100
                  </p>
                </div>
                <Badge
                  variant={
                    rec.status === 'APROBADA'
                      ? 'success'
                      : rec.status === 'REPROBADA'
                        ? 'danger'
                        : 'navy'
                  }
                >
                  {rec.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evaluación Parcial / Final</TableHead>
                    <TableHead className="text-right">Ponderación</TableHead>
                    <TableHead className="text-right">
                      Calificación (/100)
                    </TableHead>
                    <TableHead className="text-right">
                      Aporte Ponderado
                    </TableHead>
                    <TableHead>Observación Docente</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rec.evaluationsBreakdown.map((ev: any) => (
                    <TableRow key={ev.evaluationId}>
                      <TableCell className="font-semibold text-xs text-slate-800">
                        {ev.evaluationName}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-slate-600 tabular-nums">
                        {ev.weightPercentage}%
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums">
                        {ev.score !== null ? (
                          <span
                            className={`font-semibold ${
                              ev.score >= 51
                                ? 'text-emerald-700'
                                : 'text-red-600'
                            }`}
                          >
                            {ev.score} pts
                          </span>
                        ) : (
                          <span className="text-slate-400">Pendiente</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-[#002B49] tabular-nums">
                        {ev.score !== null ? `+${ev.weightedPoints} pts` : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {ev.feedback || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
