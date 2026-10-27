import { UserRole } from '../../../core/decorators/roles.decorator';

export const TOKEN_PROVIDER = 'TOKEN_PROVIDER';

export interface TokenPayload {
  sub: number;
  email: string;
  role: UserRole;
  registrationNumber: string;
  fullName: string;
  iat: string;
  exp: string;
}

/**
 * ============================================================================
 * [PATRÓN DE DISEÑO: ADAPTER / STRATEGY & PRINCIPIO SOLID: DIP]
 * ----------------------------------------------------------------------------
 * POR QUÉ: El dominio de identidad no debe acoplarse a una librería específica
 *          de firmado criptográfico (PASETO o JWT).
 * PARA QUÉ: Permitir emitir y verificar tokens de seguridad (`v4.public`) bajo
 *           un contrato limpio e intercambiable (Dependency Inversion Principle).
 * ============================================================================
 */
export interface ITokenProvider {
  signToken(
    payload: Omit<TokenPayload, 'iat' | 'exp'>,
    expiresInHours?: number,
  ): string;
  verifyToken(token: string): TokenPayload;
}
