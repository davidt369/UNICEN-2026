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
import unicenLogo from '@/logo.png';
import { apiRequest, AuthUser, setStoredSession } from '@/lib/api';
import { Badge, Button, Card, Input } from '@/components/ui/primitives';

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
    color: 'border-l-4 border-l-accent',
  },
  {
    role: 'DOCENTE',
    title: 'Ph.D. Ing. Roberto Méndez (Docente)',
    subtitle: 'DOC-IIA-104 • Titular de IA y Arquitectura Limpia',
    email: 'docente.ia@unicen.edu.bo',
    icon: BookOpen,
    color: 'border-l-4 border-l-primary',
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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Barra Superior Institucional UNICEN */}
      <div className="bg-primary text-primary-foreground text-xs py-2.5 px-6 flex flex-wrap items-center justify-between border-b-2 border-b-accent">
        <div className="flex items-center gap-4">
          <span className="font-bold tracking-wide">
            UNIVERSIDAD CENTRAL (UNICEN) • BOLIVIA
          </span>
          <span className="hidden sm:inline text-white/75">
            Sedes: Cochabamba • La Paz • Santa Cruz
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-0.5 rounded bg-accent text-accent-foreground font-extrabold">
            PORTAL SIIA 2026
          </span>
          <span className="text-white/80 font-mono hidden md:inline">
            PASETO v4.public (Ed25519)
          </span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 max-w-6xl w-full mx-auto my-6 lg:my-10 px-4 gap-8 items-center">
        {/* Columna Izquierda: Identidad UNICEN con Logo Oficial */}
        <div className="lg:col-span-7 bg-primary text-primary-foreground rounded-2xl p-8 lg:p-10 shadow-xl relative overflow-hidden border border-white/10">
          <div className="relative z-10 space-y-6">
            {/* Contenedor Blanco de Alto Contraste para el Logo Oficial UNICEN */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="bg-white rounded-xl px-5 py-3 shadow-md inline-flex items-center">
                <img
                  src={unicenLogo}
                  alt="Logo Oficial UNICEN - Comprometida con tu Futuro Laboral"
                  className="h-12 w-auto object-contain"
                />
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold">
                <Building2 className="w-3.5 h-3.5 text-accent" />
                <span>Sistema Académico Oficial</span>
              </div>
            </div>

            <div>
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">
                Portal Académico <span className="text-accent">SIIA 2026</span>
              </h1>
              <p className="mt-2 text-slate-200 text-sm lg:text-base leading-relaxed">
                Sistema Integrado de Información Académica. Gestión de oferta de
                cursos, inscripciones transaccionales con validación de cupo y
                choque de horarios, evaluaciones dinámicas ponderadas y Kardex
                estudiantil.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-accent">
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
                      className={`w-full text-left bg-white/95 hover:bg-white text-slate-900 rounded-xl p-3.5 transition-all flex items-center justify-between shadow-sm group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${acc.color}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-100 text-primary">
                          <Icon className="w-5 h-5" aria-hidden="true" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-primary flex items-center gap-2">
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
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Formulario de Autenticación */}
        <Card className="lg:col-span-5 p-8 shadow-lg border-t-4 border-t-accent">
          <div className="mb-6 flex flex-col items-start gap-3">
            <img
              src={unicenLogo}
              alt="UNICEN"
              className="h-10 w-auto object-contain"
            />
            <div>
              <h2 className="text-xl font-bold text-primary">
                Ingreso Institucional SIIA
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Autenticación criptográfica mediante tokens PASETO v4.public
              </p>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium"
            >
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
              <Mail
                className="w-4 h-4 text-slate-400 absolute right-3 top-8 pointer-events-none"
                aria-hidden="true"
              />
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
              <Lock
                className="w-4 h-4 text-slate-400 absolute right-3 top-8 pointer-events-none"
                aria-hidden="true"
              />
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

          <div className="mt-6 pt-5 border-t border-border text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">
              Credenciales por defecto del Seeder:
            </p>
            <p>
              • Contraseña universal demo:{' '}
              <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-primary font-bold">
                Unicen2026!
              </code>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
