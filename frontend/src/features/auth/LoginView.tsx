import React, { useState } from 'react';
import {
  ShieldCheck,
  GraduationCap,
  BookOpen,
  Lock,
  Mail,
  ArrowRight,
  Building2,
} from 'lucide-react';
import { apiRequest, AuthUser, setStoredSession } from '../../lib/api';
import { Badge, Button, Card, Input } from '../../components/ui/primitives';

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser, token: string) => void;
}

const DEMO_ACCOUNTS = [
  {
    role: 'ESTUDIANTE',
    title: 'Alejandro Morales (Estudiante IA)',
    subtitle: 'R.U. RU-2026-482910 • Lic. Innovación Digital e IA',
    email: 'estudiante1@unicen.edu.bo',
    icon: GraduationCap,
    color: 'border-l-4 border-l-[#E05A1B]',
  },
  {
    role: 'DOCENTE',
    title: 'Ph.D. Ing. Roberto Méndez (Docente)',
    subtitle: 'DOC-IIA-104 • Titular de IA y Arquitectura Limpia',
    email: 'docente.ia@unicen.edu.bo',
    icon: BookOpen,
    color: 'border-l-4 border-l-[#002B49]',
  },
  {
    role: 'ADMINISTRADOR',
    title: 'M.Sc. Ricardo Quiroga (Dirección SIIA)',
    subtitle: 'ADM-UNICEN-001 • Administración Nacional',
    email: 'admin@unicen.edu.bo',
    icon: ShieldCheck,
    color: 'border-l-4 border-l-emerald-600',
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
      setError(err.message || 'No se pudo iniciar sesión en SIIA UNICEN.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(email, password);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Barra Superior Institucional UNICEN */}
      <div className="bg-[#002B49] text-white text-xs py-2 px-6 flex flex-wrap items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-4">
          <span className="font-semibold tracking-wide">
            UNIVERSIDAD CENTRAL (UNICEN) • BOLIVIA
          </span>
          <span className="hidden sm:inline text-white/70">
            Sedes: Cochabamba • La Paz • Santa Cruz
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded bg-[#E05A1B] text-white font-bold">
            PORTAL SIIA 2026
          </span>
          <span className="text-white/80 font-mono">PASETO v4.public (Ed25519)</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 max-w-6xl w-full mx-auto my-6 lg:my-10 px-4 gap-8 items-center">
        {/* Columna Izquierda: Identidad UNICEN */}
        <div className="lg:col-span-7 bg-[#002B49] text-white rounded-2xl p-8 lg:p-10 shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5 text-[#E05A1B]" />
              <span>Comprometida con tu Futuro Laboral</span>
            </div>

            <div>
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">
                UNICEN <span className="text-[#E05A1B]">SIIA 2026</span>
              </h1>
              <p className="mt-2 text-slate-200 text-sm lg:text-base leading-relaxed">
                Sistema Integrado de Información Académica. Gestión de oferta de
                cursos, inscripciones transaccionales con validación de cupo y
                choque de horarios, evaluaciones dinámicas ponderadas y Kardex
                estudiantil.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-[#E05A1B]">
                Acceso Rápido de Demostración (1 Clic para Evaluadores):
              </p>
              <div className="grid gap-2.5">
                {DEMO_ACCOUNTS.map((acc) => {
                  const Icon = acc.icon;
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
                      className={`w-full text-left bg-white/95 hover:bg-white text-slate-900 rounded-xl p-3.5 transition-all flex items-center justify-between shadow-sm group ${acc.color}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-100 text-[#002B49]">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-[#002B49] flex items-center gap-2">
                            {acc.title}
                            <Badge
                              variant={
                                acc.role === 'ESTUDIANTE'
                                  ? 'orange'
                                  : acc.role === 'DOCENTE'
                                    ? 'navy'
                                    : 'success'
                              }
                            >
                              {acc.role}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {acc.subtitle}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#E05A1B] group-hover:translate-x-1 transition-all" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Formulario de Autenticación */}
        <Card className="lg:col-span-5 p-8 shadow-lg border-t-4 border-t-[#E05A1B]">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#002B49]">
              Ingreso Institucional SIIA
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Autenticación criptográfica mediante tokens PASETO v4.public
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                label="Correo Institucional (@unicen.edu.bo)"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@unicen.edu.bo"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-8" />
            </div>

            <div className="relative">
              <Input
                label="Contraseña SIIA"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-8" />
            </div>

            <Button
              type="submit"
              variant="orange"
              size="lg"
              className="w-full mt-2"
              disabled={loading}
            >
              {loading ? 'Verificando firma PASETO...' : 'Ingresar al Portal SIIA'}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">
              Credenciales por defecto del Seeder:
            </p>
            <p>• Contraseña universal demo: <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[#002B49]">Unicen2026!</code></p>
          </div>
        </Card>
      </div>
    </div>
  );
};
