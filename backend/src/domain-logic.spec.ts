import { ConfigService } from '@nestjs/config';
import { PasetoTokenProvider } from './modules/identity-and-access/infrastructure/paseto-token.provider';
import { ScheduleConflictValidator } from './modules/student-enrollments/domain/schedule-conflict.validator';
import { WeightedEvaluationStrategy } from './modules/grading-and-records/domain/weighted-evaluation.strategy';

describe('SIIA UNICEN 2026 - Reglas de Dominio y Criptografía PASETO', () => {
  it('debe firmar y verificar correctamente un token PASETO v4.public', () => {
    const provider = new PasetoTokenProvider(new ConfigService());
    const token = provider.signToken({
      sub: 10,
      email: 'estudiante1@unicen.edu.bo',
      role: 'ESTUDIANTE',
      registrationNumber: 'RU-2026-1001',
      fullName: 'Alejandro Morales',
    });

    expect(token.startsWith('v4.public.')).toBe(true);
    const decoded = provider.verifyToken(token);
    expect(decoded.sub).toBe(10);
    expect(decoded.role).toBe('ESTUDIANTE');
  });

  it('debe detectar choque de horarios en el mismo día con intervalos solapados', () => {
    const conflict = ScheduleConflictValidator.checkConflict(
      [
        {
          id: 1,
          courseOfferingId: 2,
          dayOfWeek: 'LUNES',
          startTime: '09:00',
          endTime: '11:00',
          classroom: 'Lab IA 201',
        },
      ],
      [
        {
          courseOfferingId: 1,
          subjectCode: 'IIA-101',
          subjectName: 'Fundamentos de Inteligencia Artificial',
          groupCode: 'Paralelo A',
          schedules: [
            {
              id: 10,
              courseOfferingId: 1,
              dayOfWeek: 'LUNES',
              startTime: '08:00',
              endTime: '10:00',
              classroom: 'Lab IA 101',
            },
          ],
        },
      ],
    );

    expect(conflict.hasConflict).toBe(true);
    expect(conflict.conflictMessage).toContain('Choque de horario el día LUNES');
  });

  it('debe calcular la nota final ponderada y aprobar con >= 51 puntos (Patrón Strategy)', () => {
    const strategy = new WeightedEvaluationStrategy();
    const result = strategy.calculate(
      [
        { id: 1, name: 'Primer Parcial', weightPercentage: 35 },
        { id: 2, name: 'Segundo Parcial', weightPercentage: 35 },
        { id: 3, name: 'Examen Final', weightPercentage: 30 },
      ],
      [
        { evaluationId: 1, score: 80 }, // 28 pts
        { evaluationId: 2, score: 70 }, // 24.5 pts
        { evaluationId: 3, score: 90 }, // 27 pts -> Total: 79.5
      ],
    );

    expect(result.accumulatedScore).toBe(79.5);
    expect(result.isComplete).toBe(true);
    expect(result.academicStatus).toBe('APROBADA');
  });
});
