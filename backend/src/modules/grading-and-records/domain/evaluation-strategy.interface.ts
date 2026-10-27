export const EVALUATION_STRATEGY = 'EVALUATION_STRATEGY';

export interface EvaluationWeightItem {
  id: number;
  name: string;
  weightPercentage: number;
}

export interface GradeScoreItem {
  evaluationId: number;
  score: number;
}

export interface EvaluationCalculationResult {
  accumulatedScore: number;
  evaluatedWeightPercentage: number;
  isComplete: boolean;
  academicStatus: 'ACTIVA' | 'APROBADA' | 'REPROBADA';
}

/**
 * ============================================================================
 * [PATRÓN DE DISEÑO: STRATEGY & PRINCIPIOS SOLID: OCP / DIP]
 * ----------------------------------------------------------------------------
 * POR QUÉ: En una universidad, los reglamentos de evaluación (evaluación
 *          continua ponderada, cursos de verano, internado rotatorio médico)
 *          pueden variar su fórmula de aprobación.
 * PARA QUÉ: Encapsular el algoritmo de cálculo de notas en una estrategia
 *           intercambiable sin modificar el servicio de calificaciones ni el
 *           controlador (Open/Closed Principle).
 * ============================================================================
 */
export interface IEvaluationStrategy {
  calculate(
    evaluations: EvaluationWeightItem[],
    grades: GradeScoreItem[],
  ): EvaluationCalculationResult;
}
