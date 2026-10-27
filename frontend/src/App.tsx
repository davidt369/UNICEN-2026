import React, { useState } from 'react';
import {
  LogOut,
  GraduationCap,
  FileSpreadsheet,
  BookOpen,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import {
  AuthUser,
  clearStoredSession,
  getStoredToken,
  getStoredUser,
} from './lib/api';
import { LoginView } from './features/auth/LoginView';
import { StudentPortalView } from './features/enrollments/StudentPortalView';
import { KardexView } from './features/academic-history/KardexView';
import { TeacherPortalView } from './features/grading/TeacherPortalView';
import { AdminPortalView } from './features/admin/AdminPortalView';
import { Badge, Button } from './components/ui/primitives';

export const App: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [activeTab, setActiveTab] = useState<string>(() => {
    const u = getStoredUser();
    if (!u) return 'enrollments';
    if (u.role === 'ADMINISTRADOR') return 'admin';
    if (u.role === 'DOCENTE') return 'grading';
    return 'enrollments';
  });

  if (!user || !token) {
    return (
      <LoginView
        onLoginSuccess={(loggedUser, loggedToken) => {
          setUser(loggedUser);
          setToken(loggedToken);
          if (loggedUser.role === 'ADMINISTRADOR') setActiveTab('admin');
          else if (loggedUser.role === 'DOCENTE') setActiveTab('grading');
          else setActiveTab('enrollments');
        }}
      />
    );
  }

  const handleLogout = () => {
    clearStoredSession();
    setUser(null);
    setToken(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Header Institucional SIIA UNICEN */}
      <header className="bg-[#002B49] text-white shadow-md border-b-4 border-b-[#E05A1B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E05A1B] flex items-center justify-center font-black text-lg shadow">
              U
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight">
                  UNICEN <span className="text-[#E05A1B]">SIIA 2026</span>
                </span>
                <span className="hidden md:inline-block text-[11px] bg-white/10 px-2 py-0.5 rounded font-medium text-slate-200">
                  Comprometida con tu Futuro Laboral
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Sistema Integrado de Información Académica • Bolivia
              </p>
            </div>
          </div>

          {/* Datos del Usuario Autenticado */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="flex items-center justify-end gap-2">
                <span className="text-sm font-bold">{user.fullName}</span>
                <Badge
                  variant={
                    user.role === 'ESTUDIANTE'
                      ? 'orange'
                      : user.role === 'DOCENTE'
                        ? 'navy'
                        : 'success'
                  }
                  className="bg-white/95"
                >
                  {user.role}
                </Badge>
              </div>
              <p className="text-xs text-slate-300 font-mono">
                {user.registrationNumber} • {user.email}
              </p>
            </div>

            <Button
              variant="orange"
              size="sm"
              onClick={handleLogout}
              title="Cerrar sesión PASETO"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </Button>
          </div>
        </div>

        {/* Barra de Navegación por Rol */}
        <div className="bg-[#003865] border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-2 overflow-x-auto py-2">
            {user.role === 'ESTUDIANTE' && (
              <>
                <button
                  onClick={() => setActiveTab('enrollments')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'enrollments'
                      ? 'bg-[#E05A1B] text-white shadow-sm'
                      : 'text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  Oferta e Inscripción de Cursos
                </button>
                <button
                  onClick={() => setActiveTab('kardex')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'kardex'
                      ? 'bg-[#E05A1B] text-white shadow-sm'
                      : 'text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Mi Kardex e Historial Académico
                </button>
              </>
            )}

            {user.role === 'DOCENTE' && (
              <button
                onClick={() => setActiveTab('grading')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'grading'
                    ? 'bg-[#E05A1B] text-white shadow-sm'
                    : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Planilla de Notas y Evaluaciones Dinámicas
              </button>
            )}

            {user.role === 'ADMINISTRADOR' && (
              <>
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'admin'
                      ? 'bg-[#E05A1B] text-white shadow-sm'
                      : 'text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Gestión Académica, Catálogo y Oferta
                </button>
                <button
                  onClick={() => setActiveTab('grading')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'grading'
                      ? 'bg-[#E05A1B] text-white shadow-sm'
                      : 'text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  Supervisión de Planillas y Notas
                </button>
              </>
            )}

            <div className="ml-auto hidden lg:flex items-center gap-1.5 text-[11px] text-emerald-300 font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              Sesión protegida con PASETO v4.public
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'enrollments' && <StudentPortalView />}
        {activeTab === 'kardex' && <KardexView />}
        {activeTab === 'grading' && <TeacherPortalView user={user} />}
        {activeTab === 'admin' && <AdminPortalView />}
      </main>

      {/* Footer Institucional */}
      <footer className="bg-[#002B49] text-slate-300 text-xs py-4 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>
            © 2026 Universidad Central (UNICEN) • Cochabamba, La Paz, Santa Cruz - Bolivia
          </span>
          <span className="text-slate-400">
            Arquitectura Limpia • Screaming Architecture • Drizzle ORM • PASETO v4
          </span>
        </div>
      </footer>
    </div>
  );
};
export default App;
