import React, { useState } from 'react';
import {
  ShieldCheck,
  GraduationCap,
  BookOpen,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import unicenLogo from '@/logo.png';
import { apiRequest, AuthUser, setStoredSession } from '@/lib/api';
import { Button, Label } from '@/components/ui/primitives';
import { Input as ShadcnInput } from '@/components/ui/input';

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser, token: string) => void;
}

const DEMO_ACCOUNTS = [
  {
    role: 'ESTUDIANTE',
    title: 'Alejandro Morales Camacho',
    code: 'RU-2026-482910',
    scope: 'Lic. Innovación Digital e IA • Sede Central Cochabamba',
    email: 'estudiante1@unicen.edu.bo',
    icon: GraduationCap,
  },
  {
    role: 'DOCENTE',
    title: 'Ph.D. Ing. Roberto Méndez Vargas',
    code: 'DOC-IIA-104',
    scope: 'Docente Titular de IA y Arquitectura • Sede Central Cochabamba',
    email: 'docente.ia@unicen.edu.bo',
    icon: BookOpen,
  },
  {
    role: 'ADMINISTRADOR',
    title: 'M.Sc. Ricardo Quiroga Rojas',
    code: 'ADM-CBBA-001',
    scope: 'Dirección Académica SIIA • Sede Central Cochabamba',
    email: 'admin@unicen.edu.bo',
    icon: ShieldCheck,
  },
];

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('estudiante1@unicen.edu.bo');
  const [password, setPassword] = useState('Unicen2026!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performLogin = async (targetEmail: string, targetPass: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiRequest<{
        accessToken: string;
        tokenType: string;
        user: AuthUser;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: targetEmail, password: targetPass }),
      });

      setStoredSession(res.accessToken, res.user);
      onLoginSuccess(res.user, res.accessToken);
    } catch (err: any) {
      setError(
        err.message ||
          'Credenciales inválidas. Verifique su correo @unicen.edu.bo o seleccione un perfil del directorio.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(email, password);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white">
      {/* Panel Institucional Izquierdo — Sede Central Cochabamba */}
      <div className="lg:col-span-7 bg-[#002B49] text-white flex flex-col justify-between p-8 lg:p-12 xl:p-16 border-b lg:border-b-0 lg:border-r border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-white/10">
          <div className="bg-white rounded-md px-4 py-2.5 shadow-sm inline-flex items-center">
            <img
              src={unicenLogo}
              alt="Universidad Central UNICEN"
              className="h-10 w-auto object-contain"
            />
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-white tracking-wide">
              UNIVERSIDAD CENTRAL • SEDE COCHABAMBA
            </p>
            <p className="text-[11px] text-sky-200/80 mt-0.5">
              Torre Empresarial (Calle Santivañez) & Campus Salud (Av. Juan de la Rosa)
            </p>
          </div>
        </div>

        <div className="my-8 space-y-8 max-w-2xl">
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
              Sistema Integrado de Información Académica (SIIA 2026)
            </h1>
            <p className="text-sm sm:text-base text-sky-100/85 leading-relaxed max-w-[65ch]">
              Plataforma académica de la Sede Central Cochabamba para la gestión
              de catálogo curricular, oferta de cursos por gestión, inscripción
              estudiantil, registro de calificaciones y consulta de historial
              académico (Kardex).
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-sky-200">
                Perfiles Institucionales Sede Cochabamba (Ingreso en 1 Clic)
              </h2>
              <span className="text-[11px] font-mono text-sky-200/80 tabular-nums">
                Contraseña: Unicen2026!
              </span>
            </div>

            <div className="rounded-lg border border-white/15 bg-[#003865]/60 divide-y divide-white/10 overflow-hidden">
              {DEMO_ACCOUNTS.map((acc) => {
                const Icon = acc.icon;
                const isSelected = email === acc.email;
                return (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setEmail(acc.email);
                      setPassword('Unicen2026!');
                      performLogin(acc.email, 'Unicen2026!');
                    }}
                    className={`w-full text-left px-4 py-3.5 transition-colors flex items-center justify-between gap-4 hover:bg-white/10 focus-visible:outline-none focus-visible:bg-white/15 ${
                      isSelected ? 'bg-white/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="h-9 w-9 rounded-md bg-white/10 border border-white/15 flex items-center justify-center shrink-0 text-white">
                        <Icon className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-white truncate">
                            {acc.title}
                          </span>
                          <span className="text-[11px] font-mono text-sky-200 bg-white/10 px-1.5 py-0.5 rounded tabular-nums">
                            {acc.code}
                          </span>
                        </div>
                        <p className="text-xs text-sky-100/75 truncate mt-0.5">
                          {acc.scope}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="hidden sm:inline-block text-[11px] font-semibold px-2 py-0.5 rounded border border-white/20 text-white bg-white/5">
                        {acc.role}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#E05A1B] bg-white px-2.5 py-1 rounded">
                        Acceder
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-sky-200/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Portal Académico Oficial UNICEN</span>
          </div>
          <span>Sede Central Cochabamba • Gestión 2026</span>
        </div>
      </div>

      {/* Panel Derecho — Autenticación */}
      <div className="lg:col-span-5 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-14 xl:px-16 bg-white">
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="space-y-2 border-b border-slate-200 pb-5">
            <h2 className="text-xl font-bold text-[#002B49] tracking-tight">
              Iniciar Sesión — Sede Cochabamba
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ingrese con su cuenta institucional de la Universidad Central para
              acceder a los módulos habilitados según su rol.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-md bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold">Error de autenticación</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="login-email"
                className="text-xs font-semibold text-slate-700"
              >
                Correo Institucional (@unicen.edu.bo)
              </Label>
              <div className="relative">
                <ShadcnInput
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@unicen.edu.bo"
                  className="pr-9 h-10"
                />
                <Mail
                  className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="login-password"
                className="text-xs font-semibold text-slate-700"
              >
                Contraseña SIIA
              </Label>
              <div className="relative">
                <ShadcnInput
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-9 h-10"
                />
                <Lock
                  className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="orange"
                size="lg"
                className="w-full h-10 font-semibold"
                disabled={loading}
              >
                {loading
                  ? 'Iniciando sesión...'
                  : 'Ingresar al Portal SIIA'}
              </Button>
            </div>
          </form>

          <div className="pt-5 border-t border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-700">
                Cuenta seleccionada:
              </span>
              <code className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-[#002B49] font-semibold">
                {email}
              </code>
            </div>
            <p className="text-[11px] text-slate-500">
              Seleccione cualquier perfil del panel izquierdo para evaluar los
              roles de Estudiante, Docente o Administrador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
