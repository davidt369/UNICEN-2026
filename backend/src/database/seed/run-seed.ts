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
  console.log('🌱 INICIANDO SEEDER SIIA UNICEN 2026 — SEDE COCHABAMBA');
  console.log('==========================================================');

  const queryClient = postgres(connectionString, { max: 1 });
  const db = drizzle(queryClient, { schema });

  try {
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

    // 1. Sede Oficial UNICEN Cochabamba (unicen.edu.bo)
    const [cbbaCampus] = await db
      .insert(campusesTable)
      .values([
        {
          code: 'CBBA-CENTRAL',
          name: 'Sede Central Cochabamba (Torre Empresarial & Campus Salud)',
          city: 'Cochabamba',
          address:
            'Calle Santivañez y Junín N° 240 / Av. Juan de la Rosa N° 234, Cochabamba',
        },
      ])
      .returning();

    console.log('✔ Sede Central Cochabamba registrada.');

    // 2. Carreras Oficiales de Licenciatura UNICEN — Sede Cochabamba
    const [iaCareer, medCareer, admCareer, fykCareer] = await db
      .insert(careersTable)
      .values([
        {
          code: 'IIA-LIC',
          name: 'Lic. en Innovación Digital e Inteligencia Artificial',
          area: 'Ciencias de la Tecnología',
          durationSemesters: 8,
          campusId: cbbaCampus.id,
        },
        {
          code: 'MED-LIC',
          name: 'Lic. en Medicina',
          area: 'Ciencias de la Salud',
          durationSemesters: 12,
          campusId: cbbaCampus.id,
        },
        {
          code: 'ADM-LIC',
          name: 'Lic. en Administración de Empresas',
          area: 'Ciencias Empresariales',
          durationSemesters: 9,
          campusId: cbbaCampus.id,
        },
        {
          code: 'FYK-LIC',
          name: 'Lic. en Fisioterapia y Kinesiología',
          area: 'Ciencias de la Salud',
          durationSemesters: 10,
          campusId: cbbaCampus.id,
        },
      ])
      .returning();

    console.log('✔ 4 Carreras Oficiales en Sede Cochabamba registradas.');

    // 3. Usuarios Institucionales Sede Cochabamba (Contraseña: Unicen2026!)
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
          registrationNumber: 'ADM-CBBA-001',
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
          dni: '6102934 CB',
          email: 'docente.empresarial@unicen.edu.bo',
          passwordHash: defaultPasswordHash,
          firstName: 'Fernando',
          lastName: 'Laredo Guzmán',
          role: 'DOCENTE',
          careerId: admCareer.id,
          campusId: cbbaCampus.id,
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
          dni: '9102384 CB',
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

    console.log('✔ 7 Usuarios Institucionales de Sede Cochabamba creados.');

    // 4. Catálogo de Materias Sede Cochabamba
    const [
      subFundIa,
      subArqSoft,
      subDataEng,
      subDeepLearning,
      subAnatomia,
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
            'Arquitecturas Transformer, modelos profundos y despliegue en producción.',
        },
        {
          code: 'MED-101',
          name: 'Anatomía Humana I y Disección Clínica',
          credits: 6,
          semesterLevel: 1,
          hoursPerWeek: 8,
          careerId: medCareer.id,
          description:
            'Estudio morfológico y funcional del cuerpo humano en Campus Salud Cochabamba.',
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
            'Análisis cinemático del movimiento humano y rehabilitación física.',
        },
      ])
      .returning();

    console.log('✔ 7 Asignaturas registradas en el catálogo de Cochabamba.');

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

    // 6. Oferta de Cursos en Sede Cochabamba
    const [
      offPastIa,
      offCurrentArq,
      offCurrentData,
      offConflictDl,
      offFullAnat,
      offCurrentAdm,
      offCurrentFyk,
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
          groupCode: 'Paralelo A - Laboratorio',
          maxQuota: 20,
          enrolledCount: 1,
          modality: 'PRESENCIAL',
        },
        {
          subjectId: subDeepLearning.id,
          periodId: period2026.id,
          teacherId: teacherIa.id,
          campusId: cbbaCampus.id,
          groupCode: 'Paralelo B (Choque Horario)',
          maxQuota: 20,
          enrolledCount: 0,
          modality: 'PRESENCIAL',
        },
        {
          subjectId: subAnatomia.id,
          periodId: period2026.id,
          teacherId: teacherMed.id,
          campusId: cbbaCampus.id,
          groupCode: 'Grupo Clínico 1 (Cupo Lleno)',
          maxQuota: 2,
          enrolledCount: 2,
          modality: 'PRESENCIAL',
        },
        {
          subjectId: subFinanzas.id,
          periodId: period2026.id,
          teacherId: teacherAdm.id,
          campusId: cbbaCampus.id,
          groupCode: 'Paralelo A - Ejecutivo',
          maxQuota: 25,
          enrolledCount: 1,
          modality: 'PRESENCIAL',
        },
        {
          subjectId: subBiomecanica.id,
          periodId: period2026.id,
          teacherId: teacherMed.id,
          campusId: cbbaCampus.id,
          groupCode: 'Paralelo A - Clínica',
          maxQuota: 20,
          enrolledCount: 1,
          modality: 'PRESENCIAL',
        },
      ])
      .returning();

    // 7. Bloques de Horarios (Todos en Torre Empresarial o Campus Salud de Cochabamba)
    await db.insert(courseSchedulesTable).values([
      {
        courseOfferingId: offPastIa.id,
        dayOfWeek: 'LUNES',
        startTime: '08:00',
        endTime: '10:00',
        classroom: 'Torre Empresarial CBBA - Lab IA 101',
      },
      {
        courseOfferingId: offCurrentArq.id,
        dayOfWeek: 'LUNES',
        startTime: '08:00',
        endTime: '10:00',
        classroom: 'Torre Empresarial CBBA - Lab 302',
      },
      {
        courseOfferingId: offCurrentArq.id,
        dayOfWeek: 'MIERCOLES',
        startTime: '08:00',
        endTime: '10:00',
        classroom: 'Torre Empresarial CBBA - Lab 302',
      },
      {
        courseOfferingId: offCurrentData.id,
        dayOfWeek: 'MARTES',
        startTime: '10:00',
        endTime: '12:00',
        classroom: 'Torre Empresarial CBBA - Lab Datos 204',
      },
      {
        courseOfferingId: offCurrentData.id,
        dayOfWeek: 'JUEVES',
        startTime: '10:00',
        endTime: '12:00',
        classroom: 'Torre Empresarial CBBA - Lab Datos 204',
      },
      {
        courseOfferingId: offConflictDl.id,
        dayOfWeek: 'LUNES',
        startTime: '08:30',
        endTime: '10:30',
        classroom: 'Torre Empresarial CBBA - Lab GPU 401',
      },
      {
        courseOfferingId: offConflictDl.id,
        dayOfWeek: 'VIERNES',
        startTime: '08:30',
        endTime: '10:30',
        classroom: 'Torre Empresarial CBBA - Lab GPU 401',
      },
      {
        courseOfferingId: offFullAnat.id,
        dayOfWeek: 'MARTES',
        startTime: '14:00',
        endTime: '16:30',
        classroom: 'Campus Salud CBBA - Anfiteatro 1',
      },
      {
        courseOfferingId: offCurrentAdm.id,
        dayOfWeek: 'VIERNES',
        startTime: '18:30',
        endTime: '21:00',
        classroom: 'Torre Empresarial CBBA - Aula 205',
      },
      {
        courseOfferingId: offCurrentFyk.id,
        dayOfWeek: 'MIERCOLES',
        startTime: '15:00',
        endTime: '17:30',
        classroom: 'Campus Salud CBBA - Gabinete Kinesiología 2',
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

    const [evArq1, evArq2] = await db
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

    for (const off of [
      offCurrentData,
      offConflictDl,
      offFullAnat,
      offCurrentAdm,
      offCurrentFyk,
    ]) {
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

    // 9. Inscripciones de Ejemplo en Sede Cochabamba
    const [
      enrStudent1PastIa,
      enrStudent1CurrentArq,
      enrStudent3CurrentArq,
    ] = await db
      .insert(enrollmentsTable)
      .values([
        {
          studentId: student1.id,
          courseOfferingId: offPastIa.id,
          periodId: period2025.id,
          status: 'APROBADA',
          finalScore: '86.25',
        },
        {
          studentId: student1.id,
          courseOfferingId: offCurrentArq.id,
          periodId: period2026.id,
          status: 'ACTIVA',
          finalScore: '43.75',
        },
        {
          studentId: student3.id,
          courseOfferingId: offCurrentArq.id,
          periodId: period2026.id,
          status: 'ACTIVA',
          finalScore: '38.00',
        },
        {
          studentId: student3.id,
          courseOfferingId: offCurrentData.id,
          periodId: period2026.id,
          status: 'ACTIVA',
          finalScore: null,
        },
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
        {
          studentId: student2.id,
          courseOfferingId: offCurrentAdm.id,
          periodId: period2026.id,
          status: 'ACTIVA',
          finalScore: null,
        },
        {
          studentId: student2.id,
          courseOfferingId: offCurrentFyk.id,
          periodId: period2026.id,
          status: 'ACTIVA',
          finalScore: null,
        },
      ])
      .returning();

    // 10. Calificaciones Registradas
    await db.insert(studentGradesTable).values([
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

    console.log('==========================================================');
    console.log('✅ SEEDER SEDE COCHABAMBA COMPLETADO CON ÉXITO');
    console.log('==========================================================');
  } finally {
    await queryClient.end();
  }
}

runSeed().catch((err) => {
  console.error('❌ Error ejecutando el seeder:', err);
  process.exit(1);
});
