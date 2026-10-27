import { Global, Module } from '@nestjs/common';
import { AuthController } from './infrastructure/auth.controller';
import { AuthService } from './application/auth.service';
import { TOKEN_PROVIDER } from './domain/token-provider.interface';
import { PasetoTokenProvider } from './infrastructure/paseto-token.provider';
import { USER_REPOSITORY } from './domain/user.repository.interface';
import { DrizzleUserRepository } from './infrastructure/drizzle-user.repository';
import { PasetoAuthGuard } from './infrastructure/guards/paseto-auth.guard';
import { RolesGuard } from './infrastructure/guards/roles.guard';

@Global()
@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    PasetoAuthGuard,
    RolesGuard,
    {
      provide: TOKEN_PROVIDER,
      useClass: PasetoTokenProvider,
    },
    {
      provide: USER_REPOSITORY,
      useClass: DrizzleUserRepository,
    },
  ],
  exports: [
    AuthService,
    PasetoAuthGuard,
    RolesGuard,
    TOKEN_PROVIDER,
    USER_REPOSITORY,
  ],
})
export class IdentityAndAccessModule {}
