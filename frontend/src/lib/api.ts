const API_BASE = import.meta.env.VITE_API_URL || '/api';

export interface AuthUser {
  id: number;
  registrationNumber: string;
  dni: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: 'ADMINISTRADOR' | 'DOCENTE' | 'ESTUDIANTE';
  careerId: number | null;
  campusId: number | null;
  careerName?: string | null;
  campusName?: string | null;
}

export function getStoredToken(): string | null {
  return localStorage.getItem('unicen_paseto_token');
}

export function setStoredSession(token: string, user: AuthUser) {
  localStorage.setItem('unicen_paseto_token', token);
  localStorage.setItem('unicen_user', JSON.stringify(user));
}

export function clearStoredSession() {
  localStorage.removeItem('unicen_paseto_token');
  localStorage.removeItem('unicen_user');
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem('unicen_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMsg =
      data?.message ||
      (Array.isArray(data?.details) ? data.details.join('. ') : null) ||
      `Error HTTP ${res.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}
