import { SetMetadata } from '@nestjs/common';

export type UserRole = 'ADMINISTRADOR' | 'DOCENTE' | 'ESTUDIANTE';

export const ROLES_KEY = 'roles';

/**
 * Decorador declarativo para restringir rutas según el rol institucional en SIIA UNICEN.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
