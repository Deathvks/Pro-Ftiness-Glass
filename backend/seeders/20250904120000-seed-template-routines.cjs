'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const templates = [
      // 1. GANANCIA MUSCULAR (PRIMERO)
      {
        category: 'Ganancia Muscular',
        routines: [
          {
            name: 'Día 1: Pecho, Hombros y Tríceps',
            description: 'Entrenamiento de empuje enfocado en pecho, hombros y tríceps para maximizar la hipertrofia.',
            exercises: [
              { name: 'Press de Banca Plano', sets: 4, reps: '6-8' },
              { name: 'Press Inclinado con Mancuernas', sets: 4, reps: '8-10' },
              { name: 'Press Militar con Barra', sets: 4, reps: '6-8' },
              { name: 'Elevaciones Laterales con Mancuernas', sets: 4, reps: '12-15' },
              { name: 'Fondos en Paralelas', sets: 3, reps: 'Al fallo' },
              { name: 'Extensiones de Tríceps en Polea', sets: 4, reps: '10-12' },
              { name: 'Press Francés con Barra Z', sets: 3, reps: '10-12' },
            ]
          },
          {
            name: 'Día 2: Espalda, Bíceps y Antebrazo',
            description: 'Entrenamiento de tracción enfocado en espalda, bíceps y antebrazos para desarrollo completo.',
            exercises: [
              { name: 'Dominadas con Peso', sets: 4, reps: '6-8' },
              { name: 'Remo con Barra', sets: 4, reps: '6-8' },
              { name: 'Remo con Mancuerna', sets: 4, reps: '8-10' },
              { name: 'Jalón al Pecho en Polea', sets: 3, reps: '10-12' },
              { name: 'Curl de Bíceps con Barra', sets: 4, reps: '8-10' },
              { name: 'Curl Martillo', sets: 4, reps: '10-12' },
              { name: 'Curl de Antebrazo con Barra', sets: 3, reps: '15-20' },
            ]
          },
          {
            name: 'Día 3: Piernas Completas',
            description: 'Entrenamiento completo de piernas enfocado en cuádriceps, femorales, glúteos y gemelos.',
            exercises: [
              { name: 'Sentadilla con Barra', sets: 4, reps: '6-8' },
              { name: 'Peso Muerto Rumano', sets: 4, reps: '6-8' },
              { name: 'Prensa de Piernas', sets: 4, reps: '10-12' },
              { name: 'Curl Femoral Acostado', sets: 4, reps: '10-12' },
              { name: 'Extensiones de Cuádriceps', sets: 4, reps: '12-15' },
              { name: 'Elevación de Talones de Pie', sets: 4, reps: '15-20' },
            ]
          },
          {
            name: 'Día 4: Pecho, Hombros y Tríceps (Variante)',
            description: 'Segunda sesión de empuje con variaciones diferentes para estimular el crecimiento muscular.',
            exercises: [
              { name: 'Press Inclinado con Barra', sets: 4, reps: '8-10' },
              { name: 'Aperturas en Banco Plano', sets: 4, reps: '10-12' },
              { name: 'Press con Mancuernas', sets: 4, reps: '8-10' },
              { name: 'Pájaros con Mancuernas', sets: 4, reps: '12-15' },
              { name: 'Fondos en Banco', sets: 3, reps: '10-12' },
              { name: 'Extensión de Tríceps con Mancuerna', sets: 4, reps: '10-12' },
            ]
          },
          {
            name: 'Día 5: Espalda, Bíceps y Antebrazo (Variante)',
            description: 'Segunda sesión de tracción con enfoque en volumen y variaciones de ejercicios.',
            exercises: [
              { name: 'Peso Muerto Convencional', sets: 4, reps: '5-6' },
              { name: 'Remo en Polea Baja', sets: 4, reps: '8-10' },
              { name: 'Jalón con Agarre Cerrado', sets: 4, reps: '10-12' },
              { name: 'Remo en Máquina', sets: 3, reps: '12-15' },
              { name: 'Curl Concentrado', sets: 4, reps: '10-12 c/u' },
              { name: 'Curl en Polea Baja', sets: 4, reps: '12-15' },
              { name: 'Curl Inverso', sets: 3, reps: '12-15' },
            ]
          }
        ]
      },
      {
        category: 'Pérdida de Grasa',
        routines: [
          {
            name: 'Día 1: Pecho y Cardio Metabólico',
            description: 'Entrenamiento de pecho combinado con ejercicios metabólicos para maximizar la quema de calorías.',
            exercises: [
              { name: 'Press de Banca Plano', sets: 4, reps: '12-15' },
              { name: 'Press Inclinado con Mancuernas', sets: 4, reps: '15-20' },
              { name: 'Aperturas en Banco Plano', sets: 3, reps: '15-20' },
              { name: 'Fondos en Paralelas', sets: 3, reps: 'Al fallo' },
              { name: 'Burpees', sets: 4, reps: '12-15' },
              { name: 'Mountain Climbers', sets: 4, reps: '30s' },
              { name: 'Jumping Jacks', sets: 3, reps: '45s' },
            ]
          },
          {
            name: 'Día 2: Espalda y HIIT',
            description: 'Entrenamiento de espalda combinado con intervalos de alta intensidad.',
            exercises: [
              { name: 'Dominadas', sets: 4, reps: '12-15' },
              { name: 'Remo con Barra', sets: 4, reps: '15-20' },
              { name: 'Remo con Mancuernas', sets: 4, reps: '15-20 c/u' },
              { name: 'Remo en Polea Baja', sets: 3, reps: '20-25' },
              { name: 'Kettlebell Swing', sets: 4, reps: '20-25' },
              { name: 'Battle Ropes', sets: 4, reps: '30s' },
              { name: 'Sprint en Cinta', sets: 5, reps: '30s' },
            ]
          },
          {
            name: 'Día 3: Piernas y Pliométricos',
            description: 'Entrenamiento de piernas con ejercicios explosivos para maximizar el gasto calórico.',
            exercises: [
              { name: 'Sentadilla con Barra', sets: 4, reps: '15-20' },
              { name: 'Peso Muerto Rumano', sets: 4, reps: '15-20' },
              { name: 'Sentadilla con Salto', sets: 4, reps: '15-20' },
              { name: 'Zancadas Caminando', sets: 4, reps: '12-15' },
              { name: 'Extensiones de Cuádriceps', sets: 4, reps: '20-25' },
              { name: 'Curl Femoral Acostado', sets: 4, reps: '20-25' },
              { name: 'Box Jumps', sets: 4, reps: '10-12' },
              { name: 'Wall Sit', sets: 3, reps: '45-60s' },
            ]
          },
          {
            name: 'Día 4: Hombros y Circuito',
            description: 'Entrenamiento de hombros con circuitos metabólicos de alta intensidad.',
            exercises: [
              { name: 'Press Militar con Mancuernas', sets: 4, reps: '15-20' },
              { name: 'Elevaciones Laterales con Mancuernas', sets: 4, reps: '20-25' },
              { name: 'Pájaros con Mancuernas', sets: 4, reps: '20-25' },
              { name: 'Elevaciones Frontales con Mancuernas', sets: 3, reps: '15-20' },
              { name: 'Thrusters (Cardio)', sets: 4, reps: '12-15' },
              { name: 'Burpees', sets: 4, reps: '10-12' },
              { name: 'Plancha Lateral', sets: 3, reps: '20 c/lado' },
            ]
          },
          {
            name: 'Día 5: Full Body Metabólico',
            description: 'Entrenamiento metabólico de cuerpo completo para finalizar la semana.',
            exercises: [
              { name: 'Burpees', sets: 5, reps: '10-15' },
              { name: 'Sentadilla con Salto', sets: 5, reps: '20' },
              { name: 'Flexiones de Pecho', sets: 4, reps: '15-20' },
              { name: 'Mountain Climbers', sets: 4, reps: '45s' },
              { name: 'Jumping Jacks', sets: 4, reps: '60s' },
              { name: 'High Knees', sets: 4, reps: '30s' },
              { name: 'Plancha Abdominal', sets: 4, reps: '60-90s' },
              { name: 'Twist Ruso', sets: 4, reps: '30-40' },
              { name: 'Crunch Bicicleta', sets: 4, reps: '20 c/lado' },
            ]
          }
        ]
      },
      {
        category: 'Mejores Rutinas de Pecho',
        routines: [
          {
            name: 'Pecho Completo - Masa',
            description: 'Los mejores ejercicios para desarrollar un pecho completo y voluminoso.',
            exercises: [
              { name: 'Press Plano con Barra', sets: 4, reps: '6-8' },
              { name: 'Press Inclinado con Mancuernas', sets: 4, reps: '8-10' },
              { name: 'Press Declinado con Barra', sets: 3, reps: '8-12' },
              { name: 'Aperturas en Banco Plano', sets: 3, reps: '10-12' },
              { name: 'Fondos en Paralelas', sets: 3, reps: 'Al fallo' },
              { name: 'Pullover con Mancuerna', sets: 3, reps: '12-15' },
            ]
          },
          {
            name: 'Pecho Definición',
            description: 'Rutina de pecho enfocada en la definición muscular y el detalle.',
            exercises: [
              { name: 'Press Inclinado con Mancuernas', sets: 4, reps: '12-15' },
              { name: 'Aperturas en Banco Inclinado', sets: 4, reps: '12-15' },
              { name: 'Crossover en Polea Alta', sets: 4, reps: '15-20' },
              { name: 'Press en Máquina', sets: 3, reps: '12-15' },
              { name: 'Fondos en Banco', sets: 3, reps: '15-20' },
            ]
          },
          {
            name: 'Pecho Potencia y Fuerza',
            description: 'Rutina de pecho enfocada en el desarrollo de fuerza máxima y potencia.',
            exercises: [
              { name: 'Press de Banca Plano', sets: 5, reps: '3-5' },
              { name: 'Press Inclinado con Barra', sets: 4, reps: '5-6' },
              { name: 'Flexiones Declinadas', sets: 4, reps: '8-10' },
              { name: 'Press Plano con Mancuernas', sets: 4, reps: '6-8' },
              { name: 'Fondos con Peso', sets: 3, reps: '8-10' },
            ]
          }
        ]
      },
      {
        category: 'Mejores Rutinas de Espalda',
        routines: [
          {
            name: 'Espalda Completa - Masa',
            description: 'Los mejores ejercicios para desarrollar una espalda ancha y gruesa.',
            exercises: [
              { name: 'Peso Muerto Convencional', sets: 4, reps: '5-6' },
              { name: 'Dominadas con Peso', sets: 4, reps: '6-8' },
              { name: 'Remo con Barra', sets: 4, reps: '6-8' },
              { name: 'Remo con Mancuerna', sets: 4, reps: '8-10 c/u' },
              { name: 'Jalón al Pecho en Polea', sets: 3, reps: '10-12' },
              { name: 'Remo en Polea Baja', sets: 3, reps: '10-12' },
            ]
          },
          {
            name: 'Espalda Definición y Detalle',
            description: 'Rutina de espalda enfocada en la definición y el detalle muscular.',
            exercises: [
              { name: 'Jalón con Agarre Ancho', sets: 4, reps: '12-15' },
              { name: 'Remo en Polea Baja', sets: 4, reps: '12-15' },
              { name: 'Jalón con Agarre Cerrado', sets: 4, reps: '12-15' },
              { name: 'Remo Unilateral en Polea', sets: 4, reps: '15-20 c/u' },
              { name: 'Pullover en Polea', sets: 3, reps: '15-20' },
              { name: 'Hiperextensiones', sets: 3, reps: '15-20' },
            ]
          },
          {
            name: 'Espalda Potencia y Fuerza',
            description: 'Rutina de espalda enfocada en el desarrollo de fuerza máxima y potencia.',
            exercises: [
              { name: 'Peso Muerto Convencional', sets: 5, reps: '3-5' },
              { name: 'Dominadas con Peso', sets: 4, reps: '5-6' },
              { name: 'Remo Pendlay', sets: 4, reps: '5-6' },
              { name: 'Remo con Mancuernas', sets: 4, reps: '6-8 c/u' },
              { name: 'Jalón al Pecho en Polea', sets: 4, reps: '6-8' },
            ]
          }
        ]
      },
      {
        category: 'Piernas - Enfoque Cuádriceps',
        routines: [
          {
            name: 'Cuádriceps Dominante',
            description: 'Rutina especializada para el desarrollo máximo de los cuádriceps.',
            exercises: [
              { name: 'Sentadilla Frontal', sets: 4, reps: '6-8' },
              { name: 'Sentadilla con Barra', sets: 4, reps: '8-10' },
              { name: 'Prensa de Piernas', sets: 4, reps: '12-15' },
              { name: 'Extensiones de Cuádriceps', sets: 4, reps: '15-20' },
              { name: 'Sentadilla Búlgara', sets: 3, reps: '10-12' },
              { name: 'Zancadas Caminando', sets: 3, reps: '12-15' },
            ]
          },
          {
            name: 'Cuádriceps Volumen',
            description: 'Rutina de alto volumen para maximizar la hipertrofia de cuádriceps.',
            exercises: [
              { name: 'Sentadilla con Barra', sets: 5, reps: '10-12' },
              { name: 'Prensa de Piernas', sets: 4, reps: '15-20' },
              { name: 'Extensiones de Cuádriceps', sets: 5, reps: '20-25' },
              { name: 'Sentadilla Hack', sets: 4, reps: '12-15' },
              { name: 'Zancadas con Mancuernas', sets: 4, reps: '12-15' },
            ]
          }
        ]
      },
      {
        category: 'Piernas - Enfoque Glúteos',
        routines: [
          {
            name: 'Glúteos Dominante',
            description: 'Rutina especializada para el desarrollo y fortalecimiento de los glúteos.',
            exercises: [
              { name: 'Peso Muerto Rumano', sets: 4, reps: '8-10' },
              { name: 'Hip Thrust con Barra', sets: 4, reps: '10-12' },
              { name: 'Sumo Squat', sets: 4, reps: '10-12' },
              { name: 'Peso Muerto con Mancuernas', sets: 3, reps: '12-15' },
              { name: 'Patada de Glúteo en Polea', sets: 4, reps: '15-20' },
              { name: 'Caminata Lateral con Banda', sets: 3, reps: '20 c/lado' },
            ]
          },
          {
            name: 'Glúteos y Femorales',
            description: 'Combinación perfecta para desarrollar la cadena posterior.',
            exercises: [
              { name: 'Peso Muerto Convencional', sets: 4, reps: '6-8' },
              { name: 'Hip Thrust con Barra', sets: 4, reps: '8-12' },
              { name: 'Curl Femoral Acostado', sets: 4, reps: '12-15' },
              { name: 'Good Morning', sets: 3, reps: '10-12' },
              { name: 'Hiperextensiones', sets: 3, reps: '15-20' },
              { name: 'Glute Bridge Unilateral', sets: 3, reps: '12-15' },
            ]
          }
        ]
      },
      {
        category: 'Mejores Rutinas de Abdominales',
        routines: [
          {
            name: 'Abdominales Principiante',
            description: 'Rutina básica para desarrollar fuerza abdominal desde cero con ejercicios fundamentales.',
            exercises: [
              { name: 'Plancha Abdominal', sets: 3, reps: '30-45s' },
              { name: 'Crunch Abdominal', sets: 3, reps: '15-20' },
              { name: 'Elevación de Piernas en Banco', sets: 3, reps: '10-15' },
              { name: 'Plancha Lateral', sets: 2, reps: '20-30s c/lado' },
              { name: 'Dead Bug', sets: 3, reps: '10-12 c/lado' },
              { name: 'Bird Dog', sets: 3, reps: '10-12 c/lado' },
            ]
          },
          {
            name: 'Abdominales Intermedio',
            description: 'Rutina intermedia para fortalecer el core con mayor intensidad y variedad de movimientos.',
            exercises: [
              { name: 'Plancha Abdominal', sets: 4, reps: '45-60s' },
              { name: 'Crunch Bicicleta', sets: 4, reps: '20-25 c/lado' },
              { name: 'Elevación de Piernas Colgado', sets: 3, reps: '12-15' },
              { name: 'Twist Ruso', sets: 4, reps: '25-30' },
              { name: 'Mountain Climbers', sets: 3, reps: '30-40' },
              { name: 'Plank Up-Down', sets: 3, reps: '20-24' },
              { name: 'V-Ups', sets: 3, reps: '12-15' },
            ]
          },
          {
            name: 'Abdominales Avanzado',
            description: 'Rutina avanzada de alta intensidad para desarrollar un core fuerte y definido.',
            exercises: [
              { name: 'Toes to Bar', sets: 4, reps: '10-15' },
              { name: 'Ab Wheel', sets: 4, reps: '12-18' },
              { name: 'Dragon Flag', sets: 3, reps: '6-10' },
              { name: 'Hollow Body Hold', sets: 3, reps: '20-30s' },
              { name: 'Windshield Wipers', sets: 3, reps: '12-15 c/lado' },
              { name: 'Sit-ups', sets: 3, reps: '30-45s' },
              { name: 'Pistol Squat', sets: 3, reps: '8-12 c/lado' },
            ]
          }
        ]
      },
    ];

    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkDelete('template_routine_exercises', null, { transaction: t });
      await queryInterface.bulkDelete('template_routines', null, { transaction: t });

      // 1. Preparar y insertar todas las rutinas.
      const allRoutinesData = templates.flatMap(category =>
        category.routines.map(routine => ({
          name: routine.name,
          description: routine.description,
          category: category.category,
        }))
      );
      await queryInterface.bulkInsert('template_routines', allRoutinesData, { transaction: t });

      // 2. Recuperar las rutinas insertadas para obtener sus IDs.
      const insertedRoutines = await queryInterface.sequelize.query(
        'SELECT id, name FROM template_routines',
        { type: Sequelize.QueryTypes.SELECT, transaction: t }
      );
      const routineIdMap = new Map(insertedRoutines.map(r => [r.name, r.id]));

      // 3. Preparar todos los ejercicios con los IDs correctos.
      const allExercisesData = templates.flatMap(category =>
        category.routines.flatMap(routine => {
          const routineId = routineIdMap.get(routine.name);
          if (!routineId) return [];
          return routine.exercises.map(ex => ({
            template_routine_id: routineId,
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
          }));
        })
      );

      // 4. Insertar todos los ejercicios.
      if (allExercisesData.length > 0) {
        await queryInterface.bulkInsert('template_routine_exercises', allExercisesData, { transaction: t });
      }

      await t.commit();
    } catch (error) {
      await t.rollback();
      console.error('Error durante el seeder de rutinas predefinidas:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('template_routine_exercises', null, {});
    await queryInterface.bulkDelete('template_routines', null, {});
  }
};