import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import {
  ITokenProvider,
  TOKEN_PROVIDER,
} from '../domain/token-provider.interface';
import {
  IUserRepository,
  USER_REPOSITORY,
  UserRecord,
} from '../domain/user.repository.interface';
import { CreateUserDto, LoginDto, UpdateUserDto } from './dtos/auth.dto';
import { UserRole } from '../../../core/decorators/roles.decorator';

/**
 * ============================================================================
 * [CAPA DE APLICACIÓN: CASOS DE USO DE IDENTIDAD Y ACCESO]
 * ----------------------------------------------------------------------------
 * POR QUÉ: Orquestar la autenticación PASETO y el registro de estudiantes y
 *          docentes sin acoplarse al transporte HTTP ni al motor SQL.
 * PARA QUÉ: Garantizar que las invariantes de unicidad (email y R.U./legajo) y
 *           la ocultación del hash de contraseña se apliquen siempre.
 * PRINCIPIOS SOLID: Single Responsibility (SRP) y Dependency Inversion (DIP).
 * ============================================================================
 */
@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(TOKEN_PROVIDER) private readonly tokenProvider: ITokenProvider,
  ) {}

  private sanitizeUser(user: UserRecord) {
    const { passwordHash: _ph, ...safeUser } = user;
    return {
      ...safeUser,
      fullName: `${user.firstName} ${user.lastName}`,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException(
        'Credenciales inválidas o cuenta dada de baja en SIIA UNICEN.',
      );
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const fullName = `${user.firstName} ${user.lastName}`;
    const accessToken = this.tokenProvider.signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      registrationNumber: user.registrationNumber,
      fullName,
    });

    return {
      accessToken,
      tokenType: 'PASETO v4.public',
      user: this.sanitizeUser(user),
    };
  }

  async getProfile(userId: number) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado o inactivo.');
    }
    return this.sanitizeUser(user);
  }

  async listUsers(roleFilter?: UserRole) {
    const users = await this.userRepo.findAll(roleFilter);
    return users.map((u) => this.sanitizeUser(u));
  }

  async registerUser(dto: CreateUserDto) {
    const existingEmail = await this.userRepo.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictException(
        `El correo ${dto.email} ya se encuentra registrado en el sistema.`,
      );
    }

    const existingReg = await this.userRepo.findByRegistrationNumber(
      dto.registrationNumber,
    );
    if (existingReg) {
      throw new ConflictException(
        `El código de registro / R.U. ${dto.registrationNumber} ya existe.`,
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const created = await this.userRepo.create({
      registrationNumber: dto.registrationNumber,
      dni: dto.dni,
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      careerId: dto.careerId ?? null,
      campusId: dto.campusId ?? null,
    });

    return this.sanitizeUser(created);
  }

  async updateUser(id: number, dto: UpdateUserDto) {
    const updated = await this.userRepo.update(id, dto);
    if (!updated) {
      throw new NotFoundException('Usuario no encontrado para actualizar.');
    }
    return this.sanitizeUser(updated);
  }

  async softDeleteUser(id: number) {
    const deleted = await this.userRepo.softDelete(id);
    if (!deleted) {
      throw new NotFoundException(
        'El usuario no existe o ya fue dado de baja lógica.',
      );
    }
    return {
      id,
      message: 'Usuario dado de baja lógica correctamente (isActive = false).',
    };
  }
}
