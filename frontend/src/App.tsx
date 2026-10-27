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
import { Separator } from '@/components/ui/separator';

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
    <div className="h-screen w-screen overflow-hidden flex flex-col lg:flex-row bg-background">
      {/* Sidebar Empresarial Fijo Institucional UNICEN (bg-primary = #002B49) */}
      <aside className="w-full lg:w-72 lg:h-full bg-primary text-primary-foreground flex flex-col justify-between shrink-0 border-r border-white/10 shadow-xl z-40">
        {/* Cabecera y Navegación del Sidebar */}
        <div className="flex flex-col min-h-0 flex-1 overflow-y-auto">
          <div className="p-5 flex items-center justify-between gap-3.5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center font-black text-lg text-accent-foreground shadow-md">
                U
              </div>
              <div>
                <div className="font-extrabold text-base tracking-tight leading-none">
                  UNICEN <span className="text-accent">SIIA</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1">
                  Comprometida con tu Futuro Laboral
                </p>
              </div>
            </div>
          </div>

          <Separator className="bg-white/10 shrink-0" />

          {/* Tarjeta de Usuario con Avatar Oficial de shadcn/ui */}
          <div className="p-3.5 mx-4 mt-4 rounded-xl bg-secondary border border-white/10 flex items-center gap-3 shrink-0">
            <Avatar className="h-10 w-10 border border-accent/50 shrink-0">
              <AvatarFallback className="bg-accent text-accent-foreground font-bold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-xs truncate">{user.fullName}</p>
              <p className="text-[11px] text-slate-300 font-mono truncate">
                {user.registrationNumber}
              </p>
              <Badge
                variant={
                  user.role === 'ESTUDIANTE'
                    ? 'orange'
                    : user.role === 'DOCENTE'
                      ? 'navy'
                      : 'success'
                }
                className="mt-1 bg-white text-[10px] py-0 px-1.5"
              >
                {user.role}
              </Badge>
            </div>
          </div>

          {/* Navegación de Módulos */}
          <nav className="p-4 space-y-1.5 flex-1">
            <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Módulos SIIA 2026
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
                      ? 'bg-accent text-accent-foreground shadow-md'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Pie Fijo del Sidebar (Siempre visible abajo) */}
        <div className="p-4 border-t border-white/10 bg-primary space-y-2.5 shrink-0">
          <div className="px-3 py-1.5 rounded-lg bg-white/5 text-[11px] text-emerald-300 flex items-center gap-2 font-mono">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="truncate">PASETO v4.public (Ed25519)</span>
          </div>
          <Button
            variant="orange"
            size="sm"
            className="w-full font-bold shadow-md"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión SIIA
          </Button>
        </div>
      </aside>

      {/* Columna Derecha con Header Fijo y Área de Trabajo con Scroll Independiente */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Topbar Ejecutiva Fija */}
        <header className="shrink-0 bg-card border-b border-border px-6 py-3 flex flex-wrap items-center justify-between gap-4 shadow-sm z-30">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Building2 className="w-4 h-4 text-primary shrink-0" />
            <span className="hidden sm:inline">Universidad Central (UNICEN)</span>
            <span className="hidden sm:inline">/</span>
            <span className="text-primary font-bold">
              {navItems.find((n) => n.id === activeTab)?.label}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="hidden md:inline text-muted-foreground">
              Correo: <strong className="text-foreground">{user.email}</strong>
            </span>
            {user.careerName && (
              <Badge variant="navy" className="hidden sm:inline-flex">
                {user.careerName}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
            >
              <LogOut className="w-3.5 h-3.5" />
              Salir
            </Button>
          </div>
        </header>

        {/* Único Contenedor con Scroll Vertical */}
        <main className="flex-1 overflow-y-auto p-6">
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
