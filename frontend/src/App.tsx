import React, { useState } from 'react';
import {
  LogOut,
  GraduationCap,
  FileSpreadsheet,
  BookOpen,
  Settings,
  ShieldCheck,
  LayoutDashboard,
  Menu,
  X,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

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
    setMobileMenuOpen(false);
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
      {/* =================================================================== */}
      {/* DRAWER MÓVIL (Off-canvas responsivo con animación de superposición) */}
      {/* =================================================================== */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
        >
          {/* Telón de fondo translúcido (Backdrop) */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Panel Lateral Móvil Deslizable */}
          <aside className="relative flex-1 flex flex-col max-w-[280px] w-full bg-[#002B49] text-white shadow-2xl z-50 h-full border-r border-slate-800">
            {/* Cabecera del Drawer */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="bg-white rounded-md px-3 py-1.5 flex items-center gap-2">
                <img
                  src={unicenLogo}
                  alt="UNICEN"
                  className="h-7 w-auto object-contain"
                />
                <span className="px-1.5 py-0.5 rounded bg-[#002B49] text-white text-[9px] font-bold tracking-wider uppercase">
                  SIIA
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-white/80 hover:text-white rounded-md hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#E05A1B]"
                aria-label="Cerrar menú móvil"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ficha Compacta del Usuario en Móvil */}
            <div className="p-3 mx-3 mt-3 rounded-md bg-[#003865] border border-white/10 flex items-center gap-3 shrink-0">
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
                  <span className="text-[10px] text-sky-200 font-mono truncate tabular-nums">
                    {user.registrationNumber}
                  </span>
                  <span className="text-[9px] font-semibold px-1 py-0 rounded bg-white/15 text-white">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Navegación de Enlaces Móviles */}
            <nav
              aria-label="Navegación móvil SIIA UNICEN"
              className="p-3 space-y-1 flex-1 overflow-y-auto"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
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

            {/* Pie del Drawer Móvil con Logout */}
            <div className="p-3 border-t border-white/10 bg-[#00233B] space-y-2 shrink-0">
              <div className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-sky-200 flex items-center gap-2">
                <ShieldCheck
                  className="w-3.5 h-3.5 text-emerald-400 shrink-0"
                  aria-hidden="true"
                />
                <span className="truncate">Sede Central Cochabamba</span>
              </div>
              <Button
                variant="orange"
                size="sm"
                className="w-full font-semibold text-xs"
                onClick={handleLogout}
              >
                <LogOut className="w-3.5 h-3.5" />
                Cerrar Sesión
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* =================================================================== */}
      {/* SIDEBAR ESCRITORIO PERMANENTE (Visible solo en pantallas lg y superiores) */}
      {/* =================================================================== */}
      <aside className="hidden lg:flex lg:w-64 xl:w-72 lg:h-full bg-[#002B49] text-white flex-col justify-between shrink-0 border-r border-slate-800 z-40">
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
            <span className="truncate">Sede Central Cochabamba</span>
          </div>
          <Button
            variant="orange"
            size="sm"
            className="w-full font-semibold text-xs"
            onClick={handleLogout}
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* =================================================================== */}
      {/* ÁREA PRINCIPAL CON TOPBAR FIJA Y SCROLL INDEPENDIENTE */}
      {/* =================================================================== */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Barra Superior Responsiva */}
        <header className="shrink-0 h-14 bg-white border-b border-border px-3 sm:px-6 flex items-center justify-between gap-3 z-30">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Botón Hamburguesa Móvil (Visible solo < lg) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-1 text-slate-700 hover:text-[#002B49] rounded-md hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#002B49]"
              aria-label="Abrir menú de navegación"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-bold text-[#002B49] truncate">
                {navItems.find((n) => n.id === activeTab)?.label}
              </h1>
              {user.careerName && (
                <p className="text-[10px] text-slate-500 truncate sm:hidden">
                  {user.careerName}
                </p>
              )}
            </div>

            {user.campusName && (
              <span className="hidden md:inline-block text-xs text-slate-500 border-l border-slate-200 pl-3 truncate">
                {user.campusName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs shrink-0">
            <span className="hidden sm:inline text-slate-600 font-mono text-[11px]">
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
              className="h-8 text-xs border-slate-300 text-slate-700 hover:bg-slate-100 px-2 sm:px-3"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </header>

        {/* Contenedor de Trabajo con Scroll Independiente y Padding Móvil */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 bg-background">
          <div className="max-w-7xl w-full mx-auto pb-12">
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
