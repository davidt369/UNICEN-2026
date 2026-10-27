import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Lock,
  Unlock,
  Plus,
  Trash2,
  BookOpen,
  Calendar,
  Users,
  Layers,
  ArrowLeft,
  Eye,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
} from '@/components/ui/primitives';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type AdminSubView =
  | 'LIST'
  | 'CREATE_SUBJECT'
  | 'CREATE_COURSE'
  | 'CREATE_USER'
  | 'STUDENT_KARDEX';

export const AdminPortalView: React.FC = () => {
  const [periods, setPeriods] = useState<any[]>([]);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [careers, setCareers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [subView, setSubView] = useState<AdminSubView>('LIST');
  const [inspectedKardex, setInspectedKardex] = useState<any | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [newSubject, setNewSubject] = useState({
    code: '',
    name: '',
    credits: 5,
    semesterLevel: 1,
    hoursPerWeek: 6,
    careerId: 0,
    description: '',
  });

  const [newCourse, setNewCourse] = useState({
    subjectId: 0,
    periodId: 0,
    teacherId: 0,
    campusId: 0,
    groupCode: 'Paralelo A',
    maxQuota: 25,
    dayOfWeek: 'LUNES',
    startTime: '08:00',
    endTime: '10:00',
    classroom: 'Torre Empresarial CBBA - Aula 205',
  });

  const [newUser, setNewUser] = useState({
    registrationNumber: '',
    dni: '',
    email: '',
    password: 'Unicen2026!',
    firstName: '',
    lastName: '',
    role: 'ESTUDIANTE',
    careerId: 0,
    campusId: 0,
  });

  const loadAll = async () => {
    try {
      const [per, camp, car, sub, off, usr] = await Promise.all([
        apiRequest<any[]>('/course-offerings/periods'),
        apiRequest<any[]>('/catalog/campuses'),
        apiRequest<any[]>('/catalog/careers'),
        apiRequest<any[]>('/catalog/subjects'),
        apiRequest<any[]>('/course-offerings'),
        apiRequest<any[]>('/auth/users'),
      ]);
      setPeriods(per);
      setCampuses(camp);
      setCareers(car);
      setSubjects(sub);
      setOfferings(off);
      setUsers(usr);

      if (car.length && !newSubject.careerId) {
        setNewSubject((s) => ({ ...s, careerId: car[0].id }));
      }
      const teachers = usr.filter((u) => u.role === 'DOCENTE');
      if (sub.length && per.length && teachers.length && camp.length) {
        setNewCourse((c) => ({
          ...c,
          subjectId: c.subjectId || sub[0].id,
          periodId:
            c.periodId || per.find((p) => p.isCurrent)?.id || per[0].id,
          teacherId: c.teacherId || teachers[0].id,
          campusId: c.campusId || camp[0].id,
        }));
      }
      if (car.length && camp.length) {
        setNewUser((u) => ({
          ...u,
          careerId: u.careerId || car[0].id,
          campusId: u.campusId || camp[0].id,
        }));
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleTogglePeriod = async (id: number, currentOpen: boolean) => {
    setFeedback(null);
    try {
      await apiRequest(`/course-offerings/periods/${id}/enrollments-status`, {
        method: 'PATCH',
        body: JSON.stringify({ enrollmentsOpen: !currentOpen }),
      });
      setFeedback({
        type: 'success',
        text: `Estado de inscripciones actualizado a ${!currentOpen ? 'ABIERTAS' : 'CERRADAS'}.`,
      });
      await loadAll();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      await apiRequest('/catalog/subjects', {
        method: 'POST',
        body: JSON.stringify({
          ...newSubject,
          credits: Number(newSubject.credits),
          semesterLevel: Number(newSubject.semesterLevel),
          hoursPerWeek: Number(newSubject.hoursPerWeek),
          careerId: Number(newSubject.careerId),
        }),
      });
      setNewSubject({
        ...newSubject,
        code: '',
        name: '',
        description: '',
      });
      setSubView('LIST');
      setFeedback({
        type: 'success',
        text: 'Asignatura registrada correctamente en el catálogo de Sede Cochabamba.',
      });
      await loadAll();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleDeleteSubject = async (id: number) => {
    setFeedback(null);
    try {
      const res = await apiRequest<{ message: string }>(
        `/catalog/subjects/${id}`,
        { method: 'DELETE' },
      );
      setFeedback({ type: 'success', text: res.message });
      await loadAll();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleCreateOffering = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      await apiRequest('/course-offerings', {
        method: 'POST',
        body: JSON.stringify({
          subjectId: Number(newCourse.subjectId),
          periodId: Number(newCourse.periodId),
          teacherId: Number(newCourse.teacherId),
          campusId: Number(newCourse.campusId),
          groupCode: newCourse.groupCode,
          maxQuota: Number(newCourse.maxQuota),
          modality: 'PRESENCIAL',
          schedules: [
            {
              dayOfWeek: newCourse.dayOfWeek,
              startTime: newCourse.startTime,
              endTime: newCourse.endTime,
              classroom: newCourse.classroom,
            },
          ],
        }),
      });
      setSubView('LIST');
      setFeedback({
        type: 'success',
        text: 'Paralelo ofertado creado en Sede Cochabamba con su horario y evaluaciones dinámicas.',
      });
      await loadAll();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleDeleteOffering = async (id: number) => {
    setFeedback(null);
    try {
      const res = await apiRequest<{ message: string }>(
        `/course-offerings/${id}`,
        { method: 'DELETE' },
      );
      setFeedback({ type: 'success', text: res.message });
      await loadAll();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      await apiRequest('/auth/users', {
        method: 'POST',
        body: JSON.stringify({
          ...newUser,
          careerId: Number(newUser.careerId),
          campusId: Number(newUser.campusId),
        }),
      });
      setNewUser({
        ...newUser,
        registrationNumber: '',
        dni: '',
        email: '',
        firstName: '',
        lastName: '',
      });
      setSubView('LIST');
      setFeedback({
        type: 'success',
        text: 'Usuario registrado exitosamente en el padrón de Sede Cochabamba.',
      });
      await loadAll();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleDeleteUser = async (id: number) => {
    setFeedback(null);
    try {
      const res = await apiRequest<{ message: string }>(`/auth/users/${id}`, {
        method: 'DELETE',
      });
      setFeedback({ type: 'success', text: res.message });
      await loadAll();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleInspectStudentKardex = async (studentId: number) => {
    setFeedback(null);
    try {
      const kdx = await apiRequest<any>(`/grading/student/${studentId}/kardex`);
      setInspectedKardex(kdx);
      setSubView('STUDENT_KARDEX');
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const teachers = users.filter((u) => u.role === 'DOCENTE');

  // SUB-PÁGINA 1: FORMULARIO DEDICADO PARA NUEVA MATERIA
  if (subView === 'CREATE_SUBJECT') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white border border-border rounded-lg p-5 shadow-sm flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#002B49]">
              Registrar Nueva Asignatura en Catálogo
            </h2>
            <p className="text-xs text-slate-600">
              Plan curricular oficial — Sede Central Cochabamba
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSubView('LIST')}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al Catálogo
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Datos Curriculares de la Asignatura</CardTitle>
            <CardDescription>
              Complete la sigla, carrera, nivel semestral y créditos académicos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Sigla / Código (ej. IIA-501)"
                  placeholder="IIA-501"
                  required
                  value={newSubject.code}
                  onChange={(e) =>
                    setNewSubject({ ...newSubject, code: e.target.value })
                  }
                />
                <Select
                  label="Carrera de Licenciatura (Cochabamba)"
                  value={newSubject.careerId}
                  onChange={(e) =>
                    setNewSubject({
                      ...newSubject,
                      careerId: Number(e.target.value),
                    })
                  }
                >
                  {careers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>

              <Input
                label="Nombre Oficial de la Asignatura"
                placeholder="Ej. Procesamiento de Lenguaje Natural"
                required
                value={newSubject.name}
                onChange={(e) =>
                  setNewSubject({ ...newSubject, name: e.target.value })
                }
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Semestre Curricular"
                  type="number"
                  min={1}
                  max={12}
                  value={newSubject.semesterLevel}
                  onChange={(e) =>
                    setNewSubject({
                      ...newSubject,
                      semesterLevel: Number(e.target.value),
                    })
                  }
                />
                <Input
                  label="Créditos Académicos"
                  type="number"
                  min={1}
                  max={10}
                  value={newSubject.credits}
                  onChange={(e) =>
                    setNewSubject({
                      ...newSubject,
                      credits: Number(e.target.value),
                    })
                  }
                />
                <Input
                  label="Horas Semanales"
                  type="number"
                  min={2}
                  max={12}
                  value={newSubject.hoursPerWeek}
                  onChange={(e) =>
                    setNewSubject({
                      ...newSubject,
                      hoursPerWeek: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSubView('LIST')}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="orange">
                  <Plus className="w-4 h-4" />
                  Guardar Asignatura
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // SUB-PÁGINA 2: FORMULARIO DEDICADO PARA APERTURAR PARALELO
  if (subView === 'CREATE_COURSE') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white border border-border rounded-lg p-5 shadow-sm flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#002B49]">
              Aperturar Nuevo Paralelo en Gestión
            </h2>
            <p className="text-xs text-slate-600">
              Asignación de docente titular, cupo máximo y horario en Sede
              Cochabamba
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSubView('LIST')}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a Oferta de Cursos
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configuración del Paralelo Ofertado</CardTitle>
            <CardDescription>
              Al publicar el curso se crean automáticamente sus rubros de
              evaluación ponderada (100%).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateOffering} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Gestión Académica"
                  value={newCourse.periodId}
                  onChange={(e) =>
                    setNewCourse({
                      ...newCourse,
                      periodId: Number(e.target.value),
                    })
                  }
                >
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.name}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Asignatura del Catálogo"
                  value={newCourse.subjectId}
                  onChange={(e) =>
                    setNewCourse({
                      ...newCourse,
                      subjectId: Number(e.target.value),
                    })
                  }
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Docente Titular Asignado"
                  value={newCourse.teacherId}
                  onChange={(e) =>
                    setNewCourse({
                      ...newCourse,
                      teacherId: Number(e.target.value),
                    })
                  }
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Sede Universitaria"
                  value={newCourse.campusId}
                  onChange={(e) =>
                    setNewCourse({
                      ...newCourse,
                      campusId: Number(e.target.value),
                    })
                  }
                >
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Identificador de Paralelo / Grupo"
                  required
                  value={newCourse.groupCode}
                  onChange={(e) =>
                    setNewCourse({
                      ...newCourse,
                      groupCode: e.target.value,
                    })
                  }
                />
                <Input
                  label="Cupo Máximo de Estudiantes"
                  type="number"
                  min={1}
                  max={100}
                  value={newCourse.maxQuota}
                  onChange={(e) =>
                    setNewCourse({
                      ...newCourse,
                      maxQuota: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="p-4 rounded-md bg-slate-50 border border-border space-y-3">
                <p className="text-xs font-bold text-[#002B49]">
                  Bloque Horario en Sede Cochabamba
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Select
                    label="Día de la Semana"
                    value={newCourse.dayOfWeek}
                    onChange={(e) =>
                      setNewCourse({
                        ...newCourse,
                        dayOfWeek: e.target.value,
                      })
                    }
                  >
                    {[
                      'LUNES',
                      'MARTES',
                      'MIERCOLES',
                      'JUEVES',
                      'VIERNES',
                      'SABADO',
                    ].map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </Select>
                  <Input
                    label="Hora Inicio (HH:mm)"
                    value={newCourse.startTime}
                    onChange={(e) =>
                      setNewCourse({
                        ...newCourse,
                        startTime: e.target.value,
                      })
                    }
                  />
                  <Input
                    label="Hora Fin (HH:mm)"
                    value={newCourse.endTime}
                    onChange={(e) =>
                      setNewCourse({
                        ...newCourse,
                        endTime: e.target.value,
                      })
                    }
                  />
                </div>
                <Input
                  label="Aula / Laboratorio (Cochabamba)"
                  value={newCourse.classroom}
                  onChange={(e) =>
                    setNewCourse({
                      ...newCourse,
                      classroom: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSubView('LIST')}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="orange">
                  <Plus className="w-4 h-4" />
                  Publicar Paralelo
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // SUB-PÁGINA 3: FORMULARIO DEDICADO PARA REGISTRAR ESTUDIANTE / DOCENTE
  if (subView === 'CREATE_USER') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white border border-border rounded-lg p-5 shadow-sm flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#002B49]">
              Registrar Nuevo Estudiante o Personal Académico
            </h2>
            <p className="text-xs text-slate-600">
              Padrón institucional SIIA — Sede Central Cochabamba
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSubView('LIST')}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al Padrón
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ficha de Registro Institucional</CardTitle>
            <CardDescription>
              La contraseña inicial por defecto para nuevas cuentas es{' '}
              <code className="font-mono font-bold">Unicen2026!</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label="Rol Institucional"
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                >
                  <option value="ESTUDIANTE">ESTUDIANTE</option>
                  <option value="DOCENTE">DOCENTE</option>
                  <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                </Select>
                <Input
                  label="Código R.U. / Legajo"
                  placeholder="RU-2026-7001"
                  required
                  value={newUser.registrationNumber}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      registrationNumber: e.target.value,
                    })
                  }
                />
                <Input
                  label="Cédula de Identidad (CB)"
                  placeholder="8192012 CB"
                  required
                  value={newUser.dni}
                  onChange={(e) =>
                    setNewUser({ ...newUser, dni: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nombres"
                  required
                  value={newUser.firstName}
                  onChange={(e) =>
                    setNewUser({ ...newUser, firstName: e.target.value })
                  }
                />
                <Input
                  label="Apellidos"
                  required
                  value={newUser.lastName}
                  onChange={(e) =>
                    setNewUser({ ...newUser, lastName: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Correo Institucional (@unicen.edu.bo)"
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                />
                <Select
                  label="Carrera Asignada (Cochabamba)"
                  value={newUser.careerId}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      careerId: Number(e.target.value),
                    })
                  }
                >
                  {careers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSubView('LIST')}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="orange">
                  <Plus className="w-4 h-4" />
                  Registrar Usuario en SIIA
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // SUB-PÁGINA 4: CONSULTA DE KARDEX DE ESTUDIANTE DESDE DIRECCIÓN ACADÉMICA
  if (subView === 'STUDENT_KARDEX' && inspectedKardex) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-border rounded-lg p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#002B49] bg-slate-100 px-2 py-0.5 rounded tabular-nums">
                {inspectedKardex.registrationNumber}
              </span>
              <h2 className="text-lg font-bold text-[#002B49]">
                Kardex Académico — {inspectedKardex.studentName}
              </h2>
            </div>
            <p className="text-xs text-slate-600 tabular-nums">
              {inspectedKardex.careerName || 'Tronco Común'} • Promedio General:{' '}
              <strong>{inspectedKardex.summary.generalAverage} / 100</strong> •
              Aprobadas: {inspectedKardex.summary.approvedCourses}/
              {inspectedKardex.summary.totalEnrolledCourses}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setInspectedKardex(null);
              setSubView('LIST');
            }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al Padrón de Usuarios
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historial Académico del Estudiante</CardTitle>
            <CardDescription>
              Materias inscritas, calificaciones acumuladas y estado de
              aprobación en Sede Cochabamba.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gestión</TableHead>
                  <TableHead>Sigla & Asignatura</TableHead>
                  <TableHead>Docente</TableHead>
                  <TableHead className="text-right">Nota Final</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspectedKardex.records.map((rec: any) => (
                  <TableRow key={rec.enrollmentId}>
                    <TableCell>
                      <Badge variant="navy">{rec.periodCode}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs font-bold text-[#002B49] mr-2">
                        {rec.subjectCode}
                      </span>
                      <span className="font-semibold text-xs text-slate-900">
                        {rec.subjectName}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {rec.teacherName}
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  // VISTA PRINCIPAL: LISTADOS LIMPIOS A ANCHO COMPLETO (Master View)
  return (
    <div className="space-y-6">
      <div className="bg-white border border-border rounded-lg p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#002B49] tracking-tight">
            Dirección Académica y Catálogo — Sede Central Cochabamba
          </h2>
          <p className="text-xs text-slate-600">
            Control de períodos de inscripción, catálogo curricular, apertura de
            paralelos y padrón estudiantil.
          </p>
        </div>
        <Badge variant="navy">Sede Cochabamba</Badge>
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

      <Tabs defaultValue="periods" className="w-full space-y-4">
        <TabsList className="bg-slate-200/70 p-1 h-auto flex flex-wrap justify-start gap-1">
          <TabsTrigger
            value="periods"
            className="data-[state=active]:bg-[#002B49] data-[state=active]:text-white gap-2 py-2 px-4 text-xs font-semibold"
          >
            <Calendar className="w-3.5 h-3.5" />
            Gestiones Académicas ({periods.length})
          </TabsTrigger>
          <TabsTrigger
            value="subjects"
            className="data-[state=active]:bg-[#002B49] data-[state=active]:text-white gap-2 py-2 px-4 text-xs font-semibold"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Catálogo de Materias ({subjects.length})
          </TabsTrigger>
          <TabsTrigger
            value="courses"
            className="data-[state=active]:bg-[#002B49] data-[state=active]:text-white gap-2 py-2 px-4 text-xs font-semibold"
          >
            <Layers className="w-3.5 h-3.5" />
            Oferta de Cursos ({offerings.length})
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="data-[state=active]:bg-[#002B49] data-[state=active]:text-white gap-2 py-2 px-4 text-xs font-semibold"
          >
            <Users className="w-3.5 h-3.5" />
            Estudiantes y Personal ({users.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: GESTIONES ACADÉMICAS */}
        <TabsContent value="periods">
          <Card>
            <CardHeader>
              <CardTitle>
                Control de Gestiones Académicas (Apertura y Cierre de Matrícula)
              </CardTitle>
              <CardDescription>
                Al cerrar las inscripciones de una gestión, el dominio bloquea
                cualquier alta o baja estudiantil en ese período.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre de la Gestión</TableHead>
                    <TableHead>Vigencia</TableHead>
                    <TableHead>Estado de Matrícula</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periods.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="navy">{p.code}</Badge>
                          {p.isCurrent && (
                            <Badge variant="orange">VIGENTE</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-slate-900">
                        {p.name}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-600 tabular-nums">
                        {p.startDate} al {p.endDate}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={p.enrollmentsOpen ? 'success' : 'danger'}
                        >
                          {p.enrollmentsOpen
                            ? 'Inscripciones Abiertas'
                            : 'Inscripciones Cerradas'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={p.enrollmentsOpen ? 'outline' : 'orange'}
                          size="sm"
                          onClick={() =>
                            handleTogglePeriod(p.id, p.enrollmentsOpen)
                          }
                        >
                          {p.enrollmentsOpen ? (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              Cerrar Matrícula
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3.5 h-3.5" />
                              Abrir Matrícula
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: CATÁLOGO DE MATERIAS (Ancho completo + Botón para Página de Creación) */}
        <TabsContent value="subjects">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div className="space-y-0.5">
                <CardTitle>
                  Catálogo de Asignaturas — Sede Central Cochabamba
                </CardTitle>
                <CardDescription>
                  Asignaturas activas del plan de estudios de la sede.
                </CardDescription>
              </div>
              <Button
                variant="orange"
                size="sm"
                onClick={() => setSubView('CREATE_SUBJECT')}
              >
                <Plus className="w-4 h-4" />
                Nueva Asignatura
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sigla</TableHead>
                    <TableHead>Asignatura</TableHead>
                    <TableHead>Carrera</TableHead>
                    <TableHead className="text-right">
                      Semestre / Créditos
                    </TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <span className="font-mono text-xs font-bold text-[#002B49] bg-slate-100 px-1.5 py-0.5 rounded tabular-nums">
                          {sub.code}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-slate-900">
                        {sub.name}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {sub.careerName}
                      </TableCell>
                      <TableCell className="text-right text-xs text-slate-600 tabular-nums">
                        Sem. {sub.semesterLevel} • {sub.credits} Cr.
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteSubject(sub.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Eliminar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: OFERTA DE CURSOS (Ancho completo + Botón para Página de Creación) */}
        <TabsContent value="courses">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div className="space-y-0.5">
                <CardTitle>
                  Paralelos Ofertados — Sede Central Cochabamba
                </CardTitle>
                <CardDescription>
                  Cursos publicados por gestión y control de cupos.
                </CardDescription>
              </div>
              <Button
                variant="orange"
                size="sm"
                onClick={() => setSubView('CREATE_COURSE')}
              >
                <Plus className="w-4 h-4" />
                Aperturar Paralelo
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gestión / Sigla</TableHead>
                    <TableHead>Asignatura & Paralelo</TableHead>
                    <TableHead>Docente Titular</TableHead>
                    <TableHead className="text-right">Matrícula</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offerings.map((off) => (
                    <TableRow key={off.id}>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="navy" className="tabular-nums">
                            {off.periodCode}
                          </Badge>
                          <span className="font-mono text-xs font-bold text-[#002B49] bg-slate-100 px-1.5 py-0.5 rounded tabular-nums">
                            {off.subjectCode}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-xs text-slate-900">
                          {off.subjectName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {off.groupCode}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">
                        {off.teacherName}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-[#002B49] tabular-nums">
                        {off.enrolledCount} / {off.maxQuota}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteOffering(off.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Eliminar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: ESTUDIANTES Y PERSONAL (Ancho completo + Consulta de Kardex y Creación) */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div className="space-y-0.5">
                <CardTitle>
                  Padrón Institucional Activo — Sede Central Cochabamba
                </CardTitle>
                <CardDescription>
                  Estudiantes, docentes y personal administrativo registrados en
                  SIIA.
                </CardDescription>
              </div>
              <Button
                variant="orange"
                size="sm"
                onClick={() => setSubView('CREATE_USER')}
              >
                <Plus className="w-4 h-4" />
                Registrar Usuario
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rol / Registro</TableHead>
                    <TableHead>Nombre Completo & Correo</TableHead>
                    <TableHead>Carrera / C.I.</TableHead>
                    <TableHead className="text-right">Operaciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              u.role === 'ESTUDIANTE'
                                ? 'orange'
                                : u.role === 'DOCENTE'
                                  ? 'navy'
                                  : 'success'
                            }
                          >
                            {u.role}
                          </Badge>
                          <span className="font-mono text-xs text-slate-600 tabular-nums">
                            {u.registrationNumber}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-xs text-slate-900">
                          {u.fullName}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {u.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        <div>{u.careerName || 'Dirección Académica CBBA'}</div>
                        <div className="text-[11px] text-slate-400 tabular-nums">
                          C.I.: {u.dni}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-2">
                          {u.role === 'ESTUDIANTE' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleInspectStudentKardex(u.id)}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Ver Kardex
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteUser(u.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Baja Lógica
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
