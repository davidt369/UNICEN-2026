import React, { useState } from 'react';
import {
  LogOut,
  GraduationCap,
  FileSpreadsheet,
  BookOpen,
  Settings,
  ShieldCheck,
  LayoutDashboard,
} from 'lucide-react';
import unicenLogo from '@/logo.png';
import {
  AuthUser,
  clearStoredSession,
  getStoredToken,
  getStoredUser,
} from '@/lib/api';
import { LoginView } from '@/features/auth/LoginView';
import { EnterpriseDashboardView } from '@/features/dashboard/EnterpriseDashboardView';
import { StudentPortalView } from '@/features/enrollments/StudentPortalView';
import { KardexView } from '@/features/academic-history/KardexView';
import { TeacherPortalView } from '@/features/grading/TeacherPortalView';
import { AdminPortalView } from '@/features/admin/AdminPortalView';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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

  const initials = `${user.firstName?.[0] || 'U'}${user.lastName?.[0] || 'C'}`.toUpperCase();

  const navItems = [
    {
      id: 'dashboard',
      label:
        user.role === 'ESTUDIANTE'
          ? 'Mi Portal Académico'
          : user.role === 'DOCENTE'
            ? 'Mi Portal Docente'
            : 'Centro de Mando SIIA',
      icon: LayoutDashboard,
      roles: ['ESTUDIANTE', 'DOCENTE', 'ADMINISTRADOR'],
    },
    {
      id: 'enrollments',
      label: 'Inscripción y Oferta de Cursos',
      icon: GraduationCap,
      roles: ['ESTUDIANTE'],
    },
    {
      id: 'kardex',
      label: 'Kardex e Historial Académico',
      icon: FileSpreadsheet,
      roles: ['ESTUDIANTE'],
    },
    {
      id: 'grading',
      label: 'Planilla Docente y Evaluaciones',
      icon: BookOpen,
      roles: ['DOCENTE', 'ADMINISTRADOR'],
    },
    {
      id: 'admin',
      label: 'Dirección Académica y Catálogo',
      icon: Settings,
      roles: ['ADMINISTRADOR'],
    },
  ].filter((item) => item.roles.includes(user.role));

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col lg:flex-row bg-background">
      {/* Sidebar Institucional Fijo UNICEN (#002B49) */}
      <aside className="w-full lg:w-64 xl:w-72 lg:h-full bg-[#002B49] text-white flex flex-col justify-between shrink-0 border-r border-slate-800 z-40">
        <div className="flex flex-col min-h-0 flex-1 overflow-y-auto">
          {/* Identidad Institucional con Logo Oficial UNICEN */}
          <div className="p-4 border-b border-white/10 shrink-0">
            <div className="bg-white rounded-md px-3 py-2 flex items-center justify-between gap-2">
              <img
                src={unicenLogo}
                alt="Universidad Central UNICEN"
                className="h-8 w-auto object-contain"
              />
              <span className="px-2 py-0.5 rounded bg-[#002B49] text-white text-[10px] font-bold tracking-wider uppercase shrink-0">
                SIIA 2026
              </span>
            </div>
          </div>

          {/* Ficha Compacta de Operador Autenticado */}
          <div className="p-3.5 mx-3.5 mt-3.5 rounded-md bg-[#003865] border border-white/10 flex items-center gap-3 shrink-0">
            <Avatar className="h-9 w-9 border border-white/20 shrink-0">
              <AvatarFallback className="bg-[#E05A1B] text-white font-bold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-xs text-white truncate">
                {user.fullName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-sky-200 font-mono truncate tabular-nums">
                  {user.registrationNumber}
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0 rounded bg-white/15 text-white">
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          {/* Menú Principal de Navegación */}
          <nav
            aria-label="Navegación principal SIIA UNICEN"
            className="p-3.5 space-y-1 flex-1"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E05A1B] ${
                    isActive
                      ? 'bg-[#E05A1B] text-white shadow-sm'
                      : 'text-sky-100/85 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Pie Fijo del Sidebar (Siempre visible) */}
        <div className="p-3.5 border-t border-white/10 bg-[#00233B] space-y-2.5 shrink-0">
          <div className="px-2.5 py-1.5 rounded bg-white/5 border border-white/10 text-[11px] text-sky-200 flex items-center gap-2 font-mono">
            <ShieldCheck
              className="w-3.5 h-3.5 text-emerald-400 shrink-0"
              aria-hidden="true"
            />
            <span className="truncate">Sesión PASETO v4.public</span>
          </div>
          <Button
            variant="orange"
            size="sm"
            className="w-full font-semibold"
            onClick={handleLogout}
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar Sesión SIIA
          </Button>
        </div>
      </aside>

      {/* Área Principal con Topbar Fija y Scroll Independiente */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Barra Superior de Contexto Operativo */}
        <header className="shrink-0 h-14 bg-white border-b border-border px-6 flex items-center justify-between gap-4 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-sm font-bold text-[#002B49] truncate">
              {navItems.find((n) => n.id === activeTab)?.label}
            </h1>
            {user.campusName && (
              <span className="hidden md:inline-block text-xs text-slate-500 border-l border-slate-200 pl-3 truncate">
                {user.campusName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs shrink-0">
            <span className="hidden sm:inline text-slate-600 font-mono">
              {user.email}
            </span>
            {user.careerName && (
              <Badge variant="navy" className="hidden lg:inline-flex">
                {user.careerName}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="h-8 text-xs border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              <LogOut className="w-3.5 h-3.5" />
              Salir
            </Button>
          </div>
        </header>

        {/* Contenedor de Trabajo con Scroll Independiente */}
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-7xl w-full mx-auto pb-10">
            {activeTab === 'dashboard' && (
              <EnterpriseDashboardView user={user} onNavigate={setActiveTab} />
            )}
            {activeTab === 'enrollments' && <StudentPortalView />}
            {activeTab === 'kardex' && <KardexView />}
            {activeTab === 'grading' && <TeacherPortalView user={user} />}
            {activeTab === 'admin' && <AdminPortalView />}
          </div>
        </main>
      </div>
    </div>
  );
};
export default App;
