import { Injectable } from '@nestjs/common';
import {
  EvaluationCalculationResult,
  EvaluationWeightItem,
  GradeScoreItem,
  IEvaluationStrategy,
} from './evaluation-strategy.interface';

/**
 * ============================================================================
 * [ESTRATEGIA CONCRETA: EVALUACIÓN DINÁMICA PONDERADA UNICEN (ESCALA 0-100)]
 * ----------------------------------------------------------------------------
 * POR QUÉ: Según el reglamento académico universitario boliviano (UNICEN),
 *          cada materia se evalúa sobre 100 puntos con una nota mínima de
 *          aprobación de 51 puntos, distribuida en evaluaciones ponderadas.
 * PARA QUÉ: Calcular con precisión decimal la nota acumulada ponderada y
 *           determinar automáticamente si el estudiante aprobó (>= 51),
 *           reprobó (< 51 al completar el 100% de las evaluaciones) o sigue
 *           cursando ('ACTIVA').
 * ============================================================================
 */
@Injectable()
export class WeightedEvaluationStrategy implements IEvaluationStrategy {
  private readonly MIN_PASSING_SCORE = 51.0;

  calculate(
    evaluations: EvaluationWeightItem[],
    grades: GradeScoreItem[],
  ): EvaluationCalculationResult {
    if (!evaluations.length) {
      return {
        accumulatedScore: 0,
        evaluatedWeightPercentage: 0,
        isComplete: false,
        academicStatus: 'ACTIVA',
      };
    }

    const gradeMap = new Map<number, number>();
    for (const g of grades) {
      gradeMap.set(g.evaluationId, Number(g.score));
    }

    let accumulatedScore = 0;
    let evaluatedWeightPercentage = 0;
    let gradedCount = 0;

    for (const ev of evaluations) {
      const weight = Number(ev.weightPercentage);
      if (gradeMap.has(ev.id)) {
        const rawScore = gradeMap.get(ev.id)!;
        accumulatedScore += (rawScore * weight) / 100;
        evaluatedWeightPercentage += weight;
        gradedCount++;
      }
    }

    const roundedScore = Math.round(accumulatedScore * 100) / 100;
    const isComplete = gradedCount >= evaluations.length && evaluations.length > 0;

    let academicStatus: 'ACTIVA' | 'APROBADA' | 'REPROBADA' = 'ACTIVA';
    if (isComplete) {
      academicStatus =
        roundedScore >= this.MIN_PASSING_SCORE ? 'APROBADA' : 'REPROBADA';
    }

    return {
      accumulatedScore: roundedScore,
      evaluatedWeightPercentage:
        Math.round(evaluatedWeightPercentage * 100) / 100,
      isComplete,
      academicStatus,
    };
  }
}
