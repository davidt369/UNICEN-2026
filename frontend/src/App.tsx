import React, { useState } from 'react';
import {
  LogOut,
  GraduationCap,
  FileSpreadsheet,
  BookOpen,
  Settings,
  ShieldCheck,
  LayoutDashboard,
  Building2,
} from 'lucide-react';
import {
  AuthUser,
  clearStoredSession,
  getStoredToken,
  getStoredUser,
} from './lib/api';
import { LoginView } from './features/auth/LoginView';
import { EnterpriseDashboardView } from './features/dashboard/EnterpriseDashboardView';
import { StudentPortalView } from './features/enrollments/StudentPortalView';
import { KardexView } from './features/academic-history/KardexView';
import { TeacherPortalView } from './features/grading/TeacherPortalView';
import { AdminPortalView } from './features/admin/AdminPortalView';
import { Badge, Button } from './components/ui/primitives';

export const App: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  if (!user || !token) {
    return (
      <LoginView
        onLoginSuccess={(loggedUser, loggedToken) => {
          setUser(loggedUser);
          setToken(loggedToken);
          setActiveTab('dashboard');
        }}
      />
    );
  }

  const handleLogout = () => {
    clearStoredSession();
    setUser(null);
    setToken(null);
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard Ejecutivo SIIA',
      icon: LayoutDashboard,
      roles: ['ESTUDIANTE', 'DOCENTE', 'ADMINISTRADOR'],
    },
    {
      id: 'enrollments',
      label: 'Oferta e Inscripción de Cursos',
      icon: GraduationCap,
      roles: ['ESTUDIANTE'],
    },
    {
      id: 'kardex',
      label: 'Mi Kardex e Historial Académico',
      icon: FileSpreadsheet,
      roles: ['ESTUDIANTE'],
    },
    {
      id: 'grading',
      label: 'Planilla de Notas y Evaluaciones',
      icon: BookOpen,
      roles: ['DOCENTE', 'ADMINISTRADOR'],
    },
    {
      id: 'admin',
      label: 'Administración Académica y Catálogo',
      icon: Settings,
      roles: ['ADMINISTRADOR'],
    },
  ].filter((item) => item.roles.includes(user.role));

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      {/* Sidebar Empresarial Institucional UNICEN (#002B49) */}
      <aside className="w-full lg:w-72 bg-[#002B49] text-white flex flex-col justify-between shrink-0 border-r border-white/10 shadow-xl">
        <div>
          {/* Logo Header */}
          <div className="p-6 border-b border-white/10 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#E05A1B] flex items-center justify-center font-black text-xl shadow-md">
              U
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-tight leading-none">
                UNICEN <span className="text-[#E05A1B]">SIIA</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                Comprometida con tu Futuro Laboral
              </p>
            </div>
          </div>

          {/* Perfil Resumido */}
          <div className="p-4 mx-4 mt-4 rounded-xl bg-[#003865] border border-white/10 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                Sesión Activa
              </span>
              <Badge
                variant={
                  user.role === 'ESTUDIANTE'
                    ? 'orange'
                    : user.role === 'DOCENTE'
                      ? 'navy'
                      : 'success'
                }
                className="bg-white"
              >
                {user.role}
              </Badge>
            </div>
            <p className="font-bold text-sm truncate">{user.fullName}</p>
            <p className="text-xs text-slate-300 font-mono truncate">
              {user.registrationNumber}
            </p>
          </div>

          {/* Menú de Navegación Principal */}
          <nav className="p-4 space-y-1.5">
            <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Módulos Académicos
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#E05A1B] text-white shadow-md'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Pie del Sidebar */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="px-3 py-2 rounded-lg bg-white/5 text-[11px] text-emerald-300 flex items-center gap-2 font-mono">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>PASETO v4.public (Ed25519)</span>
          </div>
          <Button
            variant="orange"
            size="sm"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión SIIA
          </Button>
        </div>
      </aside>

      {/* Área Principal de Trabajo */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar Ejecutiva */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Building2 className="w-4 h-4 text-[#002B49]" />
            <span>Universidad Central (UNICEN)</span>
            <span className="text-slate-300">/</span>
            <span className="text-[#002B49] font-bold">
              {navItems.find((n) => n.id === activeTab)?.label}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>Correo: <strong className="text-slate-800">{user.email}</strong></span>
            {user.careerName && (
              <Badge variant="navy">{user.careerName}</Badge>
            )}
          </div>
        </header>

        {/* Contenido Dinámico */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <EnterpriseDashboardView user={user} onNavigate={setActiveTab} />
          )}
          {activeTab === 'enrollments' && <StudentPortalView />}
          {activeTab === 'kardex' && <KardexView />}
          {activeTab === 'grading' && <TeacherPortalView user={user} />}
          {activeTab === 'admin' && <AdminPortalView />}
        </main>
      </div>
    </div>
  );
};
export default App;
