import { Module } from '@nestjs/common';
import { GradingController } from './infrastructure/grading.controller';
import { GradingService } from './application/grading.service';
import { GRADING_REPOSITORY } from './domain/grading.repository.interface';
import { DrizzleGradingRepository } from './infrastructure/drizzle-grading.repository';
import { EVALUATION_STRATEGY } from './domain/evaluation-strategy.interface';
import { WeightedEvaluationStrategy } from './domain/weighted-evaluation.strategy';

@Module({
  controllers: [GradingController],
  providers: [
    GradingService,
    {
      provide: EVALUATION_STRATEGY,
      useClass: WeightedEvaluationStrategy,
    },
    {
      provide: GRADING_REPOSITORY,
      useClass: DrizzleGradingRepository,
    },
  ],
  exports: [GradingService, GRADING_REPOSITORY, EVALUATION_STRATEGY],
})
export class GradingAndRecordsModule {}
