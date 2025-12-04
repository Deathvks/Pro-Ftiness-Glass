/* seeders/20250904120000-seed-template-routines.cjs */
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();

    try {
      // 1. Limpiar tablas existentes para evitar duplicados
      await queryInterface.bulkDelete('template_routine_exercises', null, { transaction: t });
      await queryInterface.bulkDelete('template_routines', null, { transaction: t });

      // 2. Definir rutinas usando NOMBRES EXACTOS del archivo ejercicios.csv
      const templates = [
        // --- 1. GANANCIA MUSCULAR (5 DÍAS) ---
        {
          category: 'Ganancia Muscular',
          routines: [
            {
              name: 'Día 1: Pecho, Hombros y Tríceps',
              description: 'Entrenamiento de empuje enfocado en hipertrofia (Sesión A).',
              exercises: [
                { name: 'Bankdrücken LH', sets: 4, reps: '6-8' },              // Press Banca Barra (Row 1178)
                { name: 'Incline Dumbbell Press', sets: 4, reps: '8-10' },     // Press Inclinado Mancuerna (Row 1318)
                { name: 'Schulterdrücken KH', sets: 4, reps: '8-10' },         // Press Hombro Sentado (Row 1237)
                { name: 'Seitheben KH', sets: 4, reps: '12-15' },              // Elevaciones Laterales (Row 1211)
                { name: 'Dips', sets: 3, reps: 'Al fallo' },                   // Fondos (Row 1195)
                { name: 'Triceps Pushdown', sets: 4, reps: '12-15' },          // Tríceps Polea (Row 1287)
                { name: 'Frenchpress SZ-Stange', sets: 3, reps: '10-12' }      // Press Francés (Row 1203)
              ]
            },
            {
              name: 'Día 2: Espalda, Bíceps y Antebrazo',
              description: 'Entrenamiento de tracción enfocado en desarrollo completo (Sesión A).',
              exercises: [
                { name: 'Chin-ups', sets: 4, reps: '6-8' },                    // Dominadas (Row 1185)
                { name: 'Rudern Vorgebeugt LH', sets: 4, reps: '8-10' },       // Remo Barra (Row 1173)
                { name: 'Dumbbell Bent Over Row', sets: 4, reps: '10-12' },    // Remo Mancuerna (Row 1250)
                { name: 'Lat Pull Down (close grip)', sets: 3, reps: '10-12' },// Jalón al Pecho Cerrado (Row 1333)
                { name: 'Bizeps LH-Curls', sets: 4, reps: '8-10' },            // Curl Barra (Row 1177)
                { name: 'Hammercurls', sets: 4, reps: '10-12' },               // Curl Martillo (Row 1201)
                { name: 'Forearm Curls (underhand grip)', sets: 3, reps: '15-20' } // Antebrazo (Row 1327)
              ]
            },
            {
              name: 'Día 3: Piernas Completas',
              description: 'Entrenamiento completo de tren inferior.',
              exercises: [
                { name: 'Front Kniebeuge', sets: 4, reps: '6-8' },             // Sentadilla Frontal (Row 1199)
                { name: 'Kreuzheben', sets: 4, reps: '6-8' },                  // Peso Muerto (Row 1189)
                { name: 'Beinpresse', sets: 4, reps: '10-12' },                // Prensa (Row 1222)
                { name: 'Leg Curl', sets: 4, reps: '10-12' },                  // Curl Femoral (Row 1212)
                { name: 'Leg Extension', sets: 4, reps: '12-15' },             // Extensión Cuádriceps (Row 1299)
                { name: 'Wadenheben Stehend', sets: 4, reps: '15-20' }         // Gemelos de pie (Row 1243)
              ]
            },
            {
              name: 'Día 4: Pecho, Hombros y Tríceps (Variante)',
              description: 'Segunda sesión de empuje con enfoque en bombeo y aislamiento.',
              exercises: [
                { name: 'Schrägbankdrücken LH', sets: 4, reps: '8-10' },       // Press Inclinado Barra (Row 1233)
                { name: 'Fliegende KH Flachbank', sets: 4, reps: '10-12' },    // Aperturas Planas (Row 1194)
                { name: 'Dumbbell Bench Press', sets: 4, reps: '8-10' },       // Press Plano Mancuernas (Row 1331)
                { name: 'Seitheben am Kabel, Einarmig', sets: 4, reps: '12-15' }, // Elev. Lat. Cable (Row 1210)
                { name: 'Dips Zwischen 2 Bänke', sets: 3, reps: '10-12' },     // Fondos entre bancos (Row 1196)
                { name: 'Triceps Overhead (Dumbbell)', sets: 4, reps: '10-12' }// Ext. Tríceps Copa (Row 1328)
              ]
            },
            {
              name: 'Día 5: Espalda, Bíceps y Antebrazo (Variante)',
              description: 'Segunda sesión de tracción con variaciones de ángulo.',
              exercises: [
                { name: 'Rack Deadlift', sets: 4, reps: '5-6' },               // Rack Pulls (Row 1223)
                { name: 'Seated Cable Row', sets: 4, reps: '8-10' },           // Remo Gironda (Row 1312)
                { name: 'Latzug Eng', sets: 4, reps: '10-12' },                // Jalón Estrecho (Row 1182)
                { name: 'Remo maquina agarre estrecho', sets: 3, reps: '12-15' }, // Remo Máquina (Row 1277)
                { name: 'Concentration Curl', sets: 4, reps: '10-12 c/u' },    // Curl Concentrado (Row 1264)
                { name: 'Bizeps am Kabel', sets: 4, reps: '12-15' },           // Curl Cable (Row 1180)
                { name: 'Curl de biceps con agarre prono', sets: 3, reps: '12-15' } // Curl Inverso (Row 1291)
              ]
            }
          ]
        },

        // --- 2. PÉRDIDA DE GRASA ---
        {
          category: 'Pérdida de Grasa',
          routines: [
            {
              name: 'Full Body Metabólico A',
              description: 'Alta intensidad para maximizar quema calórica.',
              exercises: [
                { name: 'Devil’s Press', sets: 4, reps: '10-12' },             // Row 1348
                { name: 'Dumbbell Goblet Squat', sets: 4, reps: '15-20' },     // Row 1190
                { name: 'Plank Shoulter Taps', sets: 4, reps: '30-45s' },      // Row 1255
                { name: 'Push-Up', sets: 4, reps: '15-20' },                   // Row 1342
                { name: 'Dumbbell Hang Power Cleans', sets: 4, reps: '12-15' },// Row 1252
                { name: 'Plank', sets: 3, reps: '45-60s' }                     // Row 1228
              ]
            },
            {
              name: 'Full Body Metabólico B',
              description: 'Circuito de cuerpo completo para resistencia.',
              exercises: [
                { name: 'Lateral Push Off', sets: 4, reps: '12-15' },          // Row 1325
                { name: 'Dumbbell Rear Lunge', sets: 3, reps: '15 c/lado' },   // Row 1266
                { name: 'Single Arm Plank to Row', sets: 4, reps: '10-12' },   // Row 1160
                { name: 'Shoulder Press (Dumbbell)', sets: 3, reps: '15-20' }, // Row 1329
                { name: 'Sit-Ups (Ellenbogen zum Knie)', sets: 3, reps: '20 c/lado' } // Row 1340
              ]
            }
          ]
        },

        // --- 3. FUERZA ---
        {
          category: 'Fuerza (Home/Mancuernas)',
          routines: [
            {
              name: 'Torso Fuerza',
              description: 'Ejercicios compuestos pesados para el tren superior.',
              exercises: [
                { name: 'Dumbbell Bench Press', sets: 5, reps: '5-8' },        // Row 1331
                { name: 'Dumbbell Bent Over Row', sets: 5, reps: '6-8' },      // Row 1250
                { name: 'Shoulder Press (Dumbbell)', sets: 4, reps: '6-8' },   // Row 1329
                { name: 'Chin-ups', sets: 4, reps: 'Al fallo' }                // Row 1185
              ]
            },
            {
              name: 'Pierna Fuerza',
              description: 'Fuerza para piernas usando mancuernas.',
              exercises: [
                { name: 'Dumbbell Front Squat', sets: 5, reps: '6-8' },        // Row 1257
                { name: 'Dumbbell Romanian Deadlift', sets: 5, reps: '6-8' },  // Row 1267
                { name: 'Dumbbell Hip Thrust', sets: 4, reps: '8-10' },        // Row 1259
                { name: 'Dumbbell Rear Lunge', sets: 3, reps: '8-10' }         // Row 1266
              ]
            }
          ]
        }
      ];

      // --- INSERCIÓN EN LA BASE DE DATOS ---

      for (const categoryData of templates) {
        for (const routineData of categoryData.routines) {
          // A) Insertar Rutina
          await queryInterface.bulkInsert('template_routines', [{
            name: routineData.name,
            description: routineData.description,
            category: categoryData.category,
            created_at: new Date(),
            updated_at: new Date()
          }], { transaction: t });

          // B) Obtener ID de la rutina recién creada
          const [routineRecord] = await queryInterface.sequelize.query(
            `SELECT id FROM template_routines WHERE name = :name LIMIT 1`,
            {
              replacements: { name: routineData.name },
              type: queryInterface.sequelize.QueryTypes.SELECT,
              transaction: t
            }
          );

          // C) Insertar Ejercicios vinculados
          if (routineRecord && routineRecord.id) {
            const exercisesToInsert = routineData.exercises.map(ex => ({
              template_routine_id: routineRecord.id,
              name: ex.name,
              sets: ex.sets,
              reps: ex.reps,
              created_at: new Date(),
              updated_at: new Date()
            }));

            await queryInterface.bulkInsert('template_routine_exercises', exercisesToInsert, { transaction: t });
          }
        }
      }

      await t.commit();
      console.log('✅ Seed de rutinas (5 días completos + otras) insertado correctamente.');

    } catch (error) {
      await t.rollback();
      console.error('❌ Error en el seeder de rutinas:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkDelete('template_routine_exercises', null, { transaction: t });
      await queryInterface.bulkDelete('template_routines', null, { transaction: t });
      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
};