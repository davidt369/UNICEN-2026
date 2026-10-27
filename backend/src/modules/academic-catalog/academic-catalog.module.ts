import { Module } from '@nestjs/common';
import { CatalogController } from './infrastructure/catalog.controller';
import { CatalogService } from './application/catalog.service';
import { CATALOG_REPOSITORY } from './domain/catalog.repository.interface';
import { DrizzleCatalogRepository } from './infrastructure/drizzle-catalog.repository';

@Module({
  controllers: [CatalogController],
  providers: [
    CatalogService,
    {
      provide: CATALOG_REPOSITORY,
      useClass: DrizzleCatalogRepository,
    },
  ],
  exports: [CatalogService, CATALOG_REPOSITORY],
})
export class AcademicCatalogModule {}
