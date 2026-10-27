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
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import {
  Badge,
  Button,
  Card,
  Input,
  Select,
} from '../../components/ui/primitives';

export const AdminPortalView: React.FC = () => {
  const [subTab, setSubTab] = useState<
    'periods' | 'subjects' | 'courses' | 'users'
  >('periods');

  const [periods, setPeriods] = useState<any[]>([]);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [careers, setCareers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Formularios
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
    classroom: 'Torre Empresarial - Aula 205',
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
      setFeedback({
        type: 'success',
        text: 'Materia registrada correctamente en el catálogo UNICEN.',
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
      setFeedback({
        type: 'success',
        text: 'Curso ofertado creado con su horario y evaluaciones dinámicas.',
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
      setFeedback({
        type: 'success',
        text: 'Usuario / Estudiante registrado exitosamente en SIIA UNICEN.',
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

  const teachers = users.filter((u) => u.role === 'DOCENTE');

  return (
    <div className="space-y-6">
      {/* Sub-navegación de Administración */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <Button
          variant={subTab === 'periods' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setSubTab('periods')}
        >
          <Calendar className="w-4 h-4" />
          Gestiones Académicas ({periods.length})
        </Button>
        <Button
          variant={subTab === 'subjects' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setSubTab('subjects')}
        >
          <BookOpen className="w-4 h-4" />
          Catálogo de Materias ({subjects.length})
        </Button>
        <Button
          variant={subTab === 'courses' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setSubTab('courses')}
        >
          <Layers className="w-4 h-4" />
          Oferta de Cursos ({offerings.length})
        </Button>
        <Button
          variant={subTab === 'users' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setSubTab('users')}
        >
          <Users className="w-4 h-4" />
          Estudiantes y Personal ({users.length})
        </Button>
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

      {/* TAB 1: GESTIONES ACADÉMICAS */}
      {subTab === 'periods' && (
        <Card className="p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#002B49]">
              Control de Períodos / Gestiones Académicas (Apertura y Cierre de Inscripciones)
            </h3>
            <p className="text-xs text-slate-500">
              Si las inscripciones de una gestión se cierran, el dominio bloquea
              cualquier inscripción o retiro estudiantil en esa gestión.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {periods.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="navy">{p.code}</Badge>
                    {p.isCurrent && (
                      <Badge variant="orange">GESTIÓN VIGENTE</Badge>
                    )}
                    <Badge variant={p.enrollmentsOpen ? 'success' : 'danger'}>
                      {p.enrollmentsOpen
                        ? 'INSCRIPCIONES ABIERTAS'
                        : 'INSCRIPCIONES CERRADAS'}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-[#002B49] mt-1.5">{p.name}</h4>
                  <p className="text-xs text-slate-500">
                    Vigencia: {p.startDate} al {p.endDate}
                  </p>
                </div>

                <Button
                  variant={p.enrollmentsOpen ? 'danger' : 'orange'}
                  size="sm"
                  onClick={() => handleTogglePeriod(p.id, p.enrollmentsOpen)}
                >
                  {p.enrollmentsOpen ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      Cerrar Inscripciones
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      Abrir Inscripciones
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 2: CATÁLOGO DE MATERIAS */}
      {subTab === 'subjects' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-4 p-5 h-fit border-t-4 border-t-[#E05A1B]">
            <h3 className="text-sm font-bold text-[#002B49] uppercase mb-4">
              Registrar Nueva Materia
            </h3>
            <form onSubmit={handleCreateSubject} className="space-y-3">
              <Input
                label="Sigla / Código (ej. IIA-501)"
                required
                value={newSubject.code}
                onChange={(e) =>
                  setNewSubject({ ...newSubject, code: e.target.value })
                }
              />
              <Input
                label="Nombre de la Materia"
                required
                value={newSubject.name}
                onChange={(e) =>
                  setNewSubject({ ...newSubject, name: e.target.value })
                }
              />
              <Select
                label="Carrera de Licenciatura UNICEN"
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
                    {c.name} ({c.area})
                  </option>
                ))}
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Semestre"
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
                  label="Créditos"
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
              </div>
              <Button type="submit" variant="orange" className="w-full">
                <Plus className="w-4 h-4" />
                Crear Materia
              </Button>
            </form>
          </Card>

          <Card className="lg:col-span-8 p-5">
            <h3 className="text-sm font-bold text-[#002B49] uppercase mb-4">
              Materias Activas en el Catálogo (Soft Delete Habilitado)
            </h3>
            <div className="divide-y divide-slate-100">
              {subjects.map((sub) => (
                <div
                  key={sub.id}
                  className="py-3 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="navy">{sub.code}</Badge>
                      <span className="font-bold text-sm text-[#002B49]">
                        {sub.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {sub.careerName} • Semestre {sub.semesterLevel} •{' '}
                      {sub.credits} Créditos
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteSubject(sub.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Baja Lógica
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: OFERTA DE CURSOS */}
      {subTab === 'courses' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-5 p-5 h-fit border-t-4 border-t-[#E05A1B]">
            <h3 className="text-sm font-bold text-[#002B49] uppercase mb-4">
              Aperturar Curso en Gestión
            </h3>
            <form onSubmit={handleCreateOffering} className="space-y-3">
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
                label="Materia del Catálogo"
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
                    {s.code} - {s.name}
                  </option>
                ))}
              </Select>
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
                    {t.fullName} ({t.email})
                  </option>
                ))}
              </Select>
              <Select
                label="Sede Universitaria UNICEN"
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
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Paralelo / Grupo"
                  required
                  value={newCourse.groupCode}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, groupCode: e.target.value })
                  }
                />
                <Input
                  label="Cupo Máximo"
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

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <p className="text-xs font-bold text-[#002B49] uppercase">
                  Bloque Horario Principal
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Select
                    label="Día"
                    value={newCourse.dayOfWeek}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, dayOfWeek: e.target.value })
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
                    label="Inicio (HH:mm)"
                    value={newCourse.startTime}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, startTime: e.target.value })
                    }
                  />
                  <Input
                    label="Fin (HH:mm)"
                    value={newCourse.endTime}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, endTime: e.target.value })
                    }
                  />
                </div>
                <Input
                  label="Aula / Laboratorio"
                  value={newCourse.classroom}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, classroom: e.target.value })
                  }
                />
              </div>

              <Button type="submit" variant="orange" className="w-full">
                <Plus className="w-4 h-4" />
                Publicar Curso Ofertado
              </Button>
            </form>
          </Card>

          <Card className="lg:col-span-7 p-5">
            <h3 className="text-sm font-bold text-[#002B49] uppercase mb-4">
              Cursos Ofertados Activos
            </h3>
            <div className="divide-y divide-slate-100">
              {offerings.map((off) => (
                <div
                  key={off.id}
                  className="py-3 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="navy">{off.periodCode}</Badge>
                      <Badge variant="orange">{off.subjectCode}</Badge>
                      <span className="font-bold text-sm text-[#002B49]">
                        {off.subjectName} ({off.groupCode})
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Docente: {off.teacherName} • Cupo: {off.enrolledCount}/
                      {off.maxQuota} • {off.campusName}
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteOffering(off.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Baja Lógica
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: REGISTRO DE ESTUDIANTES Y PERSONAL */}
      {subTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-4 p-5 h-fit border-t-4 border-t-[#E05A1B]">
            <h3 className="text-sm font-bold text-[#002B49] uppercase mb-4">
              Registrar Estudiante o Docente
            </h3>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <Select
                label="Rol en SIIA UNICEN"
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value })
                }
              >
                <option value="ESTUDIANTE">ESTUDIANTE</option>
                <option value="DOCENTE">DOCENTE</option>
                <option value="ADMINISTRADOR">ADMINISTRADOR</option>
              </Select>
              <div className="grid grid-cols-2 gap-2">
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
                  label="C.I. / DNI"
                  placeholder="8192012 CB"
                  required
                  value={newUser.dni}
                  onChange={(e) =>
                    setNewUser({ ...newUser, dni: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
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
                label="Carrera Asignada"
                value={newUser.careerId}
                onChange={(e) =>
                  setNewUser({ ...newUser, careerId: Number(e.target.value) })
                }
              >
                {careers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <Button type="submit" variant="orange" className="w-full">
                <Plus className="w-4 h-4" />
                Registrar en SIIA
              </Button>
            </form>
          </Card>

          <Card className="lg:col-span-8 p-5">
            <h3 className="text-sm font-bold text-[#002B49] uppercase mb-4">
              Padrón Institucional Activo (Soft Delete)
            </h3>
            <div className="divide-y divide-slate-100">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="py-3 flex items-center justify-between gap-4"
                >
                  <div>
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
                      <span className="font-mono text-xs text-slate-600">
                        {u.registrationNumber}
                      </span>
                      <span className="font-bold text-sm text-[#002B49]">
                        {u.fullName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {u.email} • C.I.: {u.dni}{' '}
                      {u.careerName ? `• ${u.careerName}` : ''}
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteUser(u.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Baja Lógica
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
