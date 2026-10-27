import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ITokenProvider,
  TOKEN_PROVIDER,
} from '../../domain/token-provider.interface';

/**
 * ============================================================================
 * [GUARDIA DE SEGURIDAD PERIMETRAL: VERIFICACIÓN PASETO]
 * ----------------------------------------------------------------------------
 * POR QUÉ: Interceptar todas las peticiones protegidas antes de ejecutar
 *          cualquier controlador de dominio.
 * PARA QUÉ: Extraer el Bearer token PASETO v4.public, verificar su firma
 *           Ed25519 e inyectar el usuario autenticado en el contexto HTTP.
 * ============================================================================
 */
@Injectable()
export class PasetoAuthGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_PROVIDER) private readonly tokenProvider: ITokenProvider,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'] as string | undefined;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Acceso denegado: No se proporcionó token de seguridad PASETO.',
      );
    }

    const token = authHeader.slice(7).trim();
    const payload = this.tokenProvider.verifyToken(token);

    request.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      registrationNumber: payload.registrationNumber,
      fullName: payload.fullName,
    };

    return true;
  }
}
