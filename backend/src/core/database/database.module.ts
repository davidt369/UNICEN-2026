import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../database/schema';

export const DRIZZLE_DB = 'DRIZZLE_DB';
export type DrizzleDb = PostgresJsDatabase<typeof schema>;

/**
 * ============================================================================
 * [PATRÓN DE DISEÑO: SINGLETON & DEPENDENCY INJECTION PROVIDER]
 * ----------------------------------------------------------------------------
 * POR QUÉ: Abrir múltiples pools de conexiones sin control satura PostgreSQL.
 * PARA QUÉ: Proveer una única instancia compartida del cliente Drizzle tipado
 *           con todo el esquema relacional a través del contenedor IoC de NestJS.
 * PRINCIPIO SOLID: Dependency Inversion Principle (DIP) - Los repositorios
 *                  reciben el token de abstracción `DRIZZLE_DB` por inyección.
 * ============================================================================
 */
@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE_DB,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): DrizzleDb => {
        const connectionString =
          configService.get<string>('DATABASE_URL') ||
          'postgresql://postgres:123456@localhost:5432/unicen';
        const queryClient = postgres(connectionString, { max: 20 });
        return drizzle(queryClient, { schema });
      },
    },
  ],
  exports: [DRIZZLE_DB],
})
export class DatabaseModule {}
