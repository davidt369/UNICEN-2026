import * as dotenv from 'dotenv';
dotenv.config();

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as bcrypt from 'bcryptjs';
import * as schema from '../schema';
import {
  academicPeriodsTable,
  campusesTable,
  careersTable,
  courseEvaluationsTable,
  courseOfferingsTable,
  courseSchedulesTable,
  enrollmentsTable,
  studentGradesTable,
  subjectsTable,
  usersTable,
} from '../schema';

async function runSeed() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:123456@localhost:5432/unicen';

  console.log('==========================================================');
  console.log('🌱 INICIANDO SEEDER INSTITUCIONAL SIIA - UNICEN 2026');
  console.log('==========================================================');

  const queryClient = postgres(connectionString, { max: 1 });
  const db = drizzle(queryClient, { schema });

  try {
    // Limpieza ordenada en cascada solo para reinicializar el entorno de demostración
    await db.delete(studentGradesTable);
    await db.delete(enrollmentsTable);
    await db.delete(courseEvaluationsTable);
    await db.delete(courseSchedulesTable);
    await db.delete(courseOfferingsTable);
    await db.delete(academicPeriodsTable);
    await db.delete(subjectsTable);
    await db.delete(usersTable);
    await db.delete(careersTable);
    await db.delete(campusesTable);

    // 1. Sedes Oficiales UNICEN (unicen.edu.bo)
    const [cbbaCampus, lpzCampus, sczCampus] = await db
      .insert(campusesTable)
      .values([
        {
          code: 'CBBA-CENTRAL',
          name: 'Sede Central Cochabamba (Torre Empresarial & Salud)',
          city: 'Cochabamba',
          address: 'Calle Santivañez y Junín N° 240 / Av. Juan de la Rosa N° 234',
        },
        {
          code: 'LPZ-UNI2',
          name: 'Subsede La Paz (Bloque UNI-2)',
          city: 'La Paz',
          address: 'Av. Brasil N° 1661, Zona Miraflores',
        },
        {
          code: 'SCZ-PATUJU',
          name: 'Subsede Santa Cruz (Torre Patujú)',
          city: 'Santa Cruz de la Sierra',
          address: 'Av. Trinidad N° 425',
        },
      ])
      .returning();

    console.log('✔ 3 Sedes Oficiales UNICEN registradas.');

    // 2. Carreras Oficiales de Licenciatura UNICEN
    const [iaCareer, medCareer, fykCareer, admCareer, turCareer, derCareer] =
      await db
        .insert(careersTable)
        .values([
          {
            code: 'IIA-LIC',
            name: 'Lic. en Innovación Digital e Inteligencia Artificial',
            area: 'Tecnología',
            durationSemesters: 8,
            campusId: cbbaCampus.id,
          },
          {
            code: 'MED-LIC',
            name: 'Medicina',
            area: 'Salud',
            durationSemesters: 12,
            campusId: cbbaCampus.id,
          },
          {
            code: 'FYK-LIC',
            name: 'Fisioterapia y Kinesiología',
            area: 'Salud',
            durationSemesters: 10,
            campusId: cbbaCampus.id,
          },
          {
            code: 'ADM-LIC',
            name: 'Administración de Empresas',
            area: 'Empresarial',
            durationSemesters: 9,
            campusId: lpzCampus.id,
          },
          {
            code: 'ATHG-LIC',
            name: 'Administración de Empresas Turísticas, Hoteleras y Gastronómicas',
            area: 'Empresarial',
            durationSemesters: 9,
            campusId: sczCampus.id,
          },
          {
            code: 'DER-LIC',
            name: 'Derecho y Ciencias Jurídicas',
            area: 'Social',
            durationSemesters: 9,
            campusId: lpzCampus.id,
          },
        ])
        .returning();

    console.log('✔ 6 Carreras Oficiales UNICEN registradas.');

    // 3. Usuarios Institucionales (Contraseña común: Unicen2026!)
    const defaultPasswordHash = await bcrypt.hash('Unicen2026!', 10);

    const [
      adminUser,
      teacherIa,
      teacherMed,
      teacherAdm,
      student1,
      student2,
      student3,
    ] = await db
      .insert(usersTable)
      .values([
        {
          registrationNumber: 'ADM-UNICEN-001',
          dni: '4510928 CB',
          email: 'admin@unicen.edu.bo',
          passwordHash: defaultPasswordHash,
          firstName: 'Ricardo',
          lastName: 'Quiroga Rojas',
          role: 'ADMINISTRADOR',
          campusId: cbbaCampus.id,
        },
        {
          registrationNumber: 'DOC-IIA-104',
          dni: '5281904 CB',
          email: 'docente.ia@unicen.edu.bo',
          passwordHash: defaultPasswordHash,
          firstName: 'Roberto Carlos',
          lastName: 'Méndez Vargas',
          role: 'DOCENTE',
          careerId: iaCareer.id,
          campusId: cbbaCampus.id,
        },
        {
          registrationNumber: 'DOC-MED-208',
          dni: '3891042 CB',
          email: 'docente.medicina@unicen.edu.bo',
          passwordHash: defaultPasswordHash,
          firstName: 'Claudia Elena',
          lastName: 'Torrico Villarroel',
          role: 'DOCENTE',
          careerId: medCareer.id,
          campusId: cbbaCampus.id,
        },
        {
          registrationNumber: 'DOC-ADM-311',
          dni: '6102934 LP',
          email: 'docente.empresarial@unicen.edu.bo',
          passwordHash: defaultPasswordHash,
          firstName: 'Fernando',
          lastName: 'Laredo Guzmán',
          role: 'DOCENTE',
          careerId: admCareer.id,
          campusId: lpzCampus.id,
        },
        {
          registrationNumber: 'RU-2026-482910',
          dni: '7891203 CB',
          email: 'estudiante1@unicen.edu.bo',
          passwordHash: defaultPasswordHash,
          firstName: 'Alejandro',
          lastName: 'Morales Camacho',
          role: 'ESTUDIANTE',
          careerId: iaCareer.id,
          campusId: cbbaCampus.id,
        },
        {
          registrationNumber: 'RU-2026-519203',
          dni: '8410291 CB',
          email: 'estudiante2@unicen.edu.bo',
          passwordHash: defaultPasswordHash,
          firstName: 'Valeria',
          lastName: 'Fernández Gumucio',
          role: 'ESTUDIANTE',
          careerId: medCareer.id,
          campusId: cbbaCampus.id,
        },
        {
          registrationNumber: 'RU-2026-604112',
          dni: '9102384 LP',
          email: 'estudiante3@unicen.edu.bo',
          passwordHash: defaultPasswordHash,
          firstName: 'Mateo',
          lastName: 'Villarroel Lozada',
          role: 'ESTUDIANTE',
          careerId: iaCareer.id,
          campusId: cbbaCampus.id,
        },
      ])
      .returning();

    console.log('✔ 7 Usuarios Institucionales (Admin, Docentes y Estudiantes) creados.');

    // 4. Catálogo de Materias
    const [
      subFundIa,
      subArqSoft,
      subDataEng,
      subDeepLearning,
      subAnatomia,
      subFisiologia,
      subFinanzas,
      subBiomecanica,
    ] = await db
      .insert(subjectsTable)
      .values([
        {
          code: 'IIA-101',
          name: 'Fundamentos de Inteligencia Artificial y Machine Learning',
          credits: 5,
          semesterLevel: 1,
          hoursPerWeek: 6,
          careerId: iaCareer.id,
          description:
            'Modelos supervisados, no supervisados y fundamentos matemáticos de IA.',
        },
        {
          code: 'IIA-201',
          name: 'Arquitectura de Software Limpia y Patrones de Diseño',
          credits: 5,
          semesterLevel: 3,
          hoursPerWeek: 6,
          careerId: iaCareer.id,
          description:
            'Principios SOLID, Clean Architecture, Screaming Architecture y DDD.',
        },
        {
          code: 'IIA-301',
          name: 'Ingeniería de Datos y Bases de Datos Relacionales',
          credits: 4,
          semesterLevel: 3,
          hoursPerWeek: 4,
          careerId: iaCareer.id,
          description:
            'Diseño transaccional ACID en PostgreSQL, indexación y ORMs modernos.',
        },
        {
          code: 'IIA-402',
          name: 'Redes Neuronales Profundas y Agentes Autónomos',
          credits: 5,
          semesterLevel: 5,
          hoursPerWeek: 6,
          careerId: iaCareer.id,
          description:
            'Arquitecturas Transformer, LLMs y despliegue en producción.',
        },
        {
          code: 'MED-101',
          name: 'Anatomía Humana I y Disección Clínica',
          credits: 6,
          semesterLevel: 1,
          hoursPerWeek: 8,
          careerId: medCareer.id,
          description:
            'Estudio morfológico y funcional del cuerpo humano en Torre de Salud.',
        },
        {
          code: 'MED-204',
          name: 'Fisiología Médica y Biofísica',
          credits: 6,
          semesterLevel: 3,
          hoursPerWeek: 6,
          careerId: medCareer.id,
          description:
            'Sistemas fisiológicos cardiovasculares, nerviosos y endocrinos.',
        },
        {
          code: 'ADM-102',
          name: 'Gestión Estratégica y Finanzas Empresariales',
          credits: 4,
          semesterLevel: 2,
          hoursPerWeek: 4,
          careerId: admCareer.id,
          description:
            'Dirección corporativa, flujo de caja e indicadores financieros.',
        },
        {
          code: 'FYK-105',
          name: 'Biomecánica Clínica y Kinesiología Motora',
          credits: 4,
          semesterLevel: 2,
          hoursPerWeek: 4,
          careerId: fykCareer.id,
          description:
            'Análisis cinemático del movimiento humano y rehabilitación.',
        },
      ])
      .returning();

    console.log('✔ 8 Materias académicas registradas en el catálogo.');

    // 5. Gestiones Académicas (II-2025 cerrada con historial y I-2026 vigente abierta)
    const [period2025, period2026] = await db
      .insert(academicPeriodsTable)
      .values([
        {
          code: 'II-2025',
          name: 'Gestión Académica II/2025 (Semestre Concluido)',
          startDate: '2025-08-04',
          endDate: '2025-12-18',
          enrollmentsOpen: false,
          isCurrent: false,
        },
        {
          code: 'I-2026',
          name: 'Gestión Académica I/2026 (Semestre Vigente)',
          startDate: '2026-02-09',
          endDate: '2026-07-10',
          enrollmentsOpen: true,
          isCurrent: true,
        },
      ])
      .returning();

    console.log('✔ 2 Gestiones Académicas (II-2025 y I-2026) configuradas.');

    // 6. Oferta de Cursos
    // Curso 1: Gestión pasada II-2025 (Fundamentos de IA - Aprobado en Kardex)
    // Curso 2: Gestión actual I-2026 (Arquitectura de Software - Estudiante 1 inscrito, Lun/Mie 08:00-10:00)
    // Curso 3: Gestión actual I-2026 (Ingeniería de Datos - Cupo disponible, Mar/Jue 10:00-12:00)
    // Curso 4: Gestión actual I-2026 (Redes Neuronales - HORARIO SOLAPADO Lun 08:30-10:30 para demostrar bloqueo por choque de horario)
    // Curso 5: Gestión actual I-2026 (Anatomía Humana - CUPO AGOTADO 2/2 para demostrar validación de cupo lleno)
    // Curso 6: Gestión actual I-2026 (Gestión Estratégica - Disponible)
    const [
      offPastIa,
      offCurrentArq,
      offCurrentData,
      offConflictDl,
      offFullAnat,
      offCurrentAdm,
    ] = await db
      .insert(courseOfferingsTable)
      .values([
        {
          subjectId: subFundIa.id,
          periodId: period2025.id,
          teacherId: teacherIa.id,
          campusId: cbbaCampus.id,
          groupCode: 'Paralelo A',
          maxQuota: 30,
          enrolledCount: 1,
          modality: 'PRESENCIAL',
        },
        {
          subjectId: subArqSoft.id,
          periodId: period2026.id,
          teacherId: teacherIa.id,
          campusId: cbbaCampus.id,
          groupCode: 'Paralelo A - Mañana',
          maxQuota: 25,
          enrolledCount: 2,
          modality: 'PRESENCIAL',
        },
        {
          subjectId: subDataEng.id,
          periodId: period2026.id,
          teacherId: teacherIa.id,
          campusId: cbbaCampus.id,
          groupCode: 'Paralelo A - Lab',
          maxQuota: 20,
          enrolledCount: 1,
          modality: 'PRESENCIAL',
        },
        {
          subjectId: subDeepLearning.id,
          periodId: period2026.id,
          teacherId: teacherIa.id,
          campusId: cbbaCampus.id,
          groupCode: 'Paralelo B (Choque Horario Demo)',
          maxQuota: 20,
          enrolledCount: 0,
          modality: 'PRESENCIAL',
        },
        {
          subjectId: subAnatomia.id,
          periodId: period2026.id,
          teacherId: teacherMed.id,
          campusId: cbbaCampus.id,
          groupCode: 'Grupo Clínico 1 (Cupo Lleno Demo)',
          maxQuota: 2,
          enrolledCount: 2,
          modality: 'PRESENCIAL',
        },
        {
          subjectId: subFinanzas.id,
          periodId: period2026.id,
          teacherId: teacherAdm.id,
          campusId: lpzCampus.id,
          groupCode: 'Paralelo Único Ejecutivo',
          maxQuota: 30,
          enrolledCount: 0,
          modality: 'SEMIPRESENCIAL',
        },
      ])
      .returning();

    // 7. Bloques de Horarios para los cursos
    await db.insert(courseSchedulesTable).values([
      // Curso pasado II-2025
      {
        courseOfferingId: offPastIa.id,
        dayOfWeek: 'LUNES',
        startTime: '08:00',
        endTime: '10:00',
        classroom: 'Torre Empresarial - Lab IA 101',
      },
      // Curso actual Arquitectura de Software (Lun y Mie 08:00 - 10:00)
      {
        courseOfferingId: offCurrentArq.id,
        dayOfWeek: 'LUNES',
        startTime: '08:00',
        endTime: '10:00',
        classroom: 'Torre Empresarial - Lab 302',
      },
      {
        courseOfferingId: offCurrentArq.id,
        dayOfWeek: 'MIERCOLES',
        startTime: '08:00',
        endTime: '10:00',
        classroom: 'Torre Empresarial - Lab 302',
      },
      // Curso actual Ingeniería de Datos (Mar y Jue 10:00 - 12:00 - Sin choque)
      {
        courseOfferingId: offCurrentData.id,
        dayOfWeek: 'MARTES',
        startTime: '10:00',
        endTime: '12:00',
        classroom: 'Torre Empresarial - Lab Base de Datos 204',
      },
      {
        courseOfferingId: offCurrentData.id,
        dayOfWeek: 'JUEVES',
        startTime: '10:00',
        endTime: '12:00',
        classroom: 'Torre Empresarial - Lab Base de Datos 204',
      },
      // Curso Redes Neuronales (LUNES 08:30 - 10:30 -> Choca con Arquitectura de Software 08:00 - 10:00)
      {
        courseOfferingId: offConflictDl.id,
        dayOfWeek: 'LUNES',
        startTime: '08:30',
        endTime: '10:30',
        classroom: 'Torre Empresarial - Lab GPU 401',
      },
      {
        courseOfferingId: offConflictDl.id,
        dayOfWeek: 'VIERNES',
        startTime: '08:30',
        endTime: '10:30',
        classroom: 'Torre Empresarial - Lab GPU 401',
      },
      // Curso Anatomía Humana (Mar y Jue 14:00 - 16:30)
      {
        courseOfferingId: offFullAnat.id,
        dayOfWeek: 'MARTES',
        startTime: '14:00',
        endTime: '16:30',
        classroom: 'Torre de Salud - Anfiteatro 1',
      },
      // Curso Gestión Estratégica (Vie 18:30 - 21:00)
      {
        courseOfferingId: offCurrentAdm.id,
        dayOfWeek: 'VIERNES',
        startTime: '18:30',
        endTime: '21:00',
        classroom: 'Bloque UNI-2 - Aula Magna 105',
      },
    ]);

    // 8. Evaluaciones Dinámicas Ponderadas por Curso (Suman 100%)
    const [evPast1, evPast2, evPast3] = await db
      .insert(courseEvaluationsTable)
      .values([
        {
          courseOfferingId: offPastIa.id,
          name: 'Primer Parcial',
          weightPercentage: '35',
          orderIndex: 1,
        },
        {
          courseOfferingId: offPastIa.id,
          name: 'Segundo Parcial',
          weightPercentage: '35',
          orderIndex: 2,
        },
        {
          courseOfferingId: offPastIa.id,
          name: 'Examen Final',
          weightPercentage: '30',
          orderIndex: 3,
        },
      ])
      .returning();

    const [evArq1, evArq2, evArq3, evArq4] = await db
      .insert(courseEvaluationsTable)
      .values([
        {
          courseOfferingId: offCurrentArq.id,
          name: '1er Parcial (Principios SOLID)',
          weightPercentage: '25',
          orderIndex: 1,
        },
        {
          courseOfferingId: offCurrentArq.id,
          name: '2do Parcial (Clean Architecture)',
          weightPercentage: '25',
          orderIndex: 2,
        },
        {
          courseOfferingId: offCurrentArq.id,
          name: 'Laboratorios Prácticos',
          weightPercentage: '20',
          orderIndex: 3,
        },
        {
          courseOfferingId: offCurrentArq.id,
          name: 'Defensa de Proyecto Final',
          weightPercentage: '30',
          orderIndex: 4,
        },
      ])
      .returning();

    for (const off of [offCurrentData, offConflictDl, offFullAnat, offCurrentAdm]) {
      await db.insert(courseEvaluationsTable).values([
        {
          courseOfferingId: off.id,
          name: 'Primer Parcial',
          weightPercentage: '35',
          orderIndex: 1,
        },
        {
          courseOfferingId: off.id,
          name: 'Segundo Parcial',
          weightPercentage: '35',
          orderIndex: 2,
        },
        {
          courseOfferingId: off.id,
          name: 'Examen Final',
          weightPercentage: '30',
          orderIndex: 3,
        },
      ]);
    }

    // 9. Inscripciones de Ejemplo
    const [
      enrStudent1PastIa,
      enrStudent1CurrentArq,
      enrStudent3CurrentArq,
      enrStudent3CurrentData,
      enrStudent2FullAnat,
      enrStudent3FullAnat,
    ] = await db
      .insert(enrollmentsTable)
      .values([
        // Alejandro Morales aprobó Fundamentos de IA en II-2025 con 86.25 puntos
        {
          studentId: student1.id,
          courseOfferingId: offPastIa.id,
          periodId: period2025.id,
          status: 'APROBADA',
          finalScore: '86.25',
        },
        // Alejandro Morales cursa Arquitectura de Software en I-2026 (con 2 parciales ya calificados)
        {
          studentId: student1.id,
          courseOfferingId: offCurrentArq.id,
          periodId: period2026.id,
          status: 'ACTIVA',
          finalScore: '43.75',
        },
        // Mateo Villarroel también cursa Arquitectura de Software en I-2026
        {
          studentId: student3.id,
          courseOfferingId: offCurrentArq.id,
          periodId: period2026.id,
          status: 'ACTIVA',
          finalScore: '38.00',
        },
        // Mateo Villarroel cursa Ingeniería de Datos
        {
          studentId: student3.id,
          courseOfferingId: offCurrentData.id,
          periodId: period2026.id,
          status: 'ACTIVA',
          finalScore: null,
        },
        // Anatomía Humana tiene 2/2 cupos llenos (Valeria y Mateo)
        {
          studentId: student2.id,
          courseOfferingId: offFullAnat.id,
          periodId: period2026.id,
          status: 'ACTIVA',
          finalScore: null,
        },
        {
          studentId: student3.id,
          courseOfferingId: offFullAnat.id,
          periodId: period2026.id,
          status: 'ACTIVA',
          finalScore: null,
        },
      ])
      .returning();

    // 10. Calificaciones Registradas
    await db.insert(studentGradesTable).values([
      // Notas completas de Alejandro en II-2025 (85*0.35 + 85*0.35 + 90*0.30 = 29.75 + 29.75 + 27 = 86.5 -> ajustemos a 85, 85, 89 -> 86.2)
      {
        enrollmentId: enrStudent1PastIa.id,
        evaluationId: evPast1.id,
        score: '85',
        feedback: 'Excelente dominio de regresión y clasificación.',
        gradedById: teacherIa.id,
      },
      {
        enrollmentId: enrStudent1PastIa.id,
        evaluationId: evPast2.id,
        score: '85',
        feedback: 'Muy buen desempeño en validación cruzada.',
        gradedById: teacherIa.id,
      },
      {
        enrollmentId: enrStudent1PastIa.id,
        evaluationId: evPast3.id,
        score: '89.17',
        feedback: 'Proyecto final sobresaliente.',
        gradedById: teacherIa.id,
      },
      // Notas parciales de Alejandro en Arquitectura de Software I-2026 (90*0.25 + 85*0.25 = 22.5 + 21.25 = 43.75 pts sobre 50% evaluado)
      {
        enrollmentId: enrStudent1CurrentArq.id,
        evaluationId: evArq1.id,
        score: '90',
        feedback: 'Aplicación impecable de SRP, OCP y DIP.',
        gradedById: teacherIa.id,
      },
      {
        enrollmentId: enrStudent1CurrentArq.id,
        evaluationId: evArq2.id,
        score: '85',
        feedback: 'Buena separación de capas y Screaming Architecture.',
        gradedById: teacherIa.id,
      },
      // Notas parciales de Mateo en Arquitectura de Software I-2026
      {
        enrollmentId: enrStudent3CurrentArq.id,
        evaluationId: evArq1.id,
        score: '76',
        feedback: 'Buen trabajo.',
        gradedById: teacherIa.id,
      },
      {
        enrollmentId: enrStudent3CurrentArq.id,
        evaluationId: evArq2.id,
        score: '76',
        feedback: 'Correcto.',
        gradedById: teacherIa.id,
      },
    ]);

    console.log('✔ Oferta de cursos, horarios, evaluaciones ponderadas, inscripciones y notas iniciales creadas.');
    console.log('==========================================================');
    console.log('✅ SEEDER COMPLETADO CON ÉXITO');
    console.log('   Admin:      admin@unicen.edu.bo / Unicen2026!');
    console.log('   Docente IA: docente.ia@unicen.edu.bo / Unicen2026!');
    console.log('   Estudiante: estudiante1@unicen.edu.bo / Unicen2026!');
    console.log('==========================================================');
  } finally {
    await queryClient.end();
  }
}

runSeed().catch((err) => {
  console.error('❌ Error ejecutando el seeder:', err);
  process.exit(1);
});
