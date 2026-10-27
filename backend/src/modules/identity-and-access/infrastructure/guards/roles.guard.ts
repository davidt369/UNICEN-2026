import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  ROLES_KEY,
  UserRole,
} from '../../../../core/decorators/roles.decorator';

/**
 * ============================================================================
 * [CONTROL DE ACCESO BASADO EN ROLES (RBAC): ROLES GUARD]
 * ----------------------------------------------------------------------------
 * POR QUÉ:Separar la autenticación (quién eres) de la autorización (qué rol
 *         tienes permitido ejercer en SIIA UNICEN).
 * PARA QUÉ: Garantizar que un Estudiante no pueda cargar notas ni un Docente
 *           pueda eliminar catálogos administrativos (Principio SRP).
 * ============================================================================
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Permisos insuficientes: Esta operación requiere rol [${requiredRoles.join(', ')}].`,
      );
    }

    return true;
  }
}
