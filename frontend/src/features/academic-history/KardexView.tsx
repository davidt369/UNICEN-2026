import React, { useEffect, useState } from 'react';
import { ArrowLeft, Eye } from 'lucide-react';
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

export const KardexView: React.FC = () => {
  const [kardex, setKardex] = useState<any | null>(null);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<
    number | null
  >(null);
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
        Consultando Kardex Académico Oficial en Sede Central Cochabamba...
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
  const selectedRecord = records.find(
    (r: any) => r.enrollmentId === selectedEnrollmentId,
  );

  // PÁGINA DE DETALLE DE DESGLOSE DE EVALUACIONES POR MATERIA (Master-Detail)
  if (selectedRecord) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-border rounded-lg p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="navy">{selectedRecord.periodCode}</Badge>
              <span className="font-mono text-xs font-bold text-[#002B49] bg-slate-100 px-2 py-0.5 rounded">
                {selectedRecord.subjectCode}
              </span>
              <h2 className="text-lg font-bold text-[#002B49]">
                {selectedRecord.subjectName}
              </h2>
              <Badge
                variant={
                  selectedRecord.status === 'APROBADA'
                    ? 'success'
                    : selectedRecord.status === 'REPROBADA'
                      ? 'danger'
                      : 'navy'
                }
              >
                {selectedRecord.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-600 tabular-nums">
              {selectedRecord.groupCode} • Docente:{' '}
              <strong>{selectedRecord.teacherName}</strong> • Semestre{' '}
              {selectedRecord.semesterLevel} ({selectedRecord.credits} Créditos)
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedEnrollmentId(null)}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al Kardex General
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="space-y-0.5">
              <CardTitle>
                Desglose de Calificaciones Ponderadas ({selectedRecord.subjectCode})
              </CardTitle>
              <CardDescription>
                Calificaciones parciales y nota final ponderada (Sede Central
                Cochabamba).
              </CardDescription>
            </div>
            <div className="text-right tabular-nums">
              <p className="text-[11px] text-slate-500">
                Nota Acumulada ({selectedRecord.evaluatedWeightPercentage}%
                evaluado)
              </p>
              <p className="text-lg font-bold text-[#002B49]">
                {selectedRecord.finalScore} / 100 pts
              </p>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rubro de Evaluación</TableHead>
                  <TableHead className="text-right">Ponderación</TableHead>
                  <TableHead className="text-right">
                    Nota Obtenida (/100)
                  </TableHead>
                  <TableHead className="text-right">
                    Puntos Ponderados
                  </TableHead>
                  <TableHead>Observación Docente</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedRecord.evaluationsBreakdown.map((ev: any) => (
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
                            ev.score >= 51 ? 'text-emerald-700' : 'text-red-600'
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
      </div>
    );
  }

  // VISTA PRINCIPAL: KARDEX GENERAL RESUMIDO EN UNA SOLA TABLA LIMPIA
  return (
    <div className="space-y-6">
      <div className="bg-white border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="bg-[#002B49] text-white px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight">
              Kardex Académico Oficial — {kardex.studentName}
            </h2>
            <p className="text-xs text-sky-100/85 tabular-nums">
              R.U.:{' '}
              <strong className="font-mono text-white">
                {kardex.registrationNumber}
              </strong>{' '}
              • Carrera:{' '}
              <strong className="text-white">
                {kardex.careerName || 'Tronco Común'}
              </strong>{' '}
              • Sede Central Cochabamba
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

        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border bg-white">
          <div className="p-4">
            <p className="text-xs font-medium text-slate-500">
              Asignaturas Aprobadas
            </p>
            <p className="text-xl font-bold text-[#002B49] mt-1 tabular-nums">
              {summary.approvedCourses} / {summary.totalEnrolledCourses}
            </p>
          </div>

          <div className="p-4">
            <p className="text-xs font-medium text-slate-500">
              Créditos Vencidos
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
              Nota Mínima Aprobación
            </p>
            <p className="text-xl font-bold text-slate-800 mt-1 tabular-nums">
              51.0 pts
            </p>
          </div>
        </div>
      </div>

      {/* Tabla Resumen de Materias Cursadas (Clic en Ver Desglose para ir a Página de Detalle) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="space-y-0.5">
            <CardTitle>
              Historial de Asignaturas Cursadas — Sede Cochabamba
            </CardTitle>
            <CardDescription>
              Seleccione &ldquo;Ver Desglose&rdquo; en cualquier materia para
              consultar sus notas parciales, ponderaciones y retroalimentación
              docente.
            </CardDescription>
          </div>
          <Badge variant="navy" className="tabular-nums">
            {records.length} Registros
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gestión</TableHead>
                <TableHead>Sigla & Asignatura</TableHead>
                <TableHead>Docente Titular</TableHead>
                <TableHead className="text-right">Avance</TableHead>
                <TableHead className="text-right">Nota Final</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((rec: any) => (
                <TableRow key={rec.enrollmentId}>
                  <TableCell>
                    <Badge variant="navy" className="tabular-nums">
                      {rec.periodCode}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#002B49] bg-slate-100 px-1.5 py-0.5 rounded tabular-nums">
                        {rec.subjectCode}
                      </span>
                      <span className="font-semibold text-xs text-slate-900">
                        {rec.subjectName}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                      {rec.groupCode} • {rec.credits} Créditos
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-700">
                    {rec.teacherName}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-slate-600 tabular-nums">
                    {rec.evaluatedWeightPercentage}%
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold text-[#002B49] tabular-nums">
                    {rec.finalScore} / 100
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEnrollmentId(rec.enrollmentId)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Ver Desglose
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
