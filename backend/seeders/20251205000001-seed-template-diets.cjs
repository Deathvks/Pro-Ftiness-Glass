/* backend/seeders/20251205000001-seed-template-diets.cjs */
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            // 1. Limpiar tablas existentes
            await queryInterface.bulkDelete('template_diet_meals', null, { transaction });
            await queryInterface.bulkDelete('template_diets', null, { transaction });

            // 2. CATÁLOGO EXTENDIDO DE DIETAS
            const diets = [
                // ============================================================
                // OBJETIVO: PERDER GRASA (LOSE)
                // ============================================================

                // 1400 kcal - Muy ligera
                {
                    name: 'Déficit Ligero (1400 kcal)',
                    description: 'Baja en calorías pero saciante. Ideal para mujeres o personas sedentarias que buscan bajar peso.',
                    goal: 'lose',
                    total_calories: 1400,
                    total_protein: 90,
                    total_carbs: 140,
                    total_fats: 50,
                    meals: [
                        { name: 'Desayuno', description: 'Tostada integral (40g) con tomate y huevo duro.', meal_order: 1, calories: 300, protein_g: 10, carbs_g: 30, fats_g: 8 },
                        { name: 'Almuerzo', description: 'Ensalada de garbanzos (150g) con atún y vegetales.', meal_order: 2, calories: 450, protein_g: 25, carbs_g: 50, fats_g: 12 },
                        { name: 'Merienda', description: 'Yogur natural con un puñado de fresas.', meal_order: 3, calories: 150, protein_g: 8, carbs_g: 15, fats_g: 2 },
                        { name: 'Cena', description: 'Pechuga de pavo (120g) a la plancha con calabacín.', meal_order: 4, calories: 350, protein_g: 30, carbs_g: 10, fats_g: 10 },
                        { name: 'Recena', description: 'Infusión o té relajante.', meal_order: 5, calories: 150, protein_g: 17, carbs_g: 35, fats_g: 18 } // Ajuste final
                    ]
                },

                // 1600 kcal - Estándar
                {
                    name: 'Definición Estándar (1600 kcal)',
                    description: 'El punto de partida clásico para definir. Proteína moderada (110g) y grasas controladas.',
                    goal: 'lose',
                    total_calories: 1600,
                    total_protein: 110,
                    total_carbs: 160,
                    total_fats: 55,
                    meals: [
                        { name: 'Desayuno', description: 'Gachas de avena (40g) con leche semidesnatada y fruta.', meal_order: 1, calories: 350, protein_g: 12, carbs_g: 50, fats_g: 6 },
                        { name: 'Almuerzo', description: 'Pollo asado (150g) con patata pequeña y ensalada.', meal_order: 2, calories: 500, protein_g: 35, carbs_g: 40, fats_g: 15 },
                        { name: 'Merienda', description: 'Tostada de pan integral con queso fresco 0%.', meal_order: 3, calories: 200, protein_g: 15, carbs_g: 25, fats_g: 2 },
                        { name: 'Cena', description: 'Merluza o bacalao (150g) con judías verdes.', meal_order: 4, calories: 400, protein_g: 30, carbs_g: 15, fats_g: 10 },
                        { name: 'Extra', description: 'Un puñado pequeño de almendras (15g).', meal_order: 5, calories: 150, protein_g: 18, carbs_g: 30, fats_g: 22 }
                    ]
                },

                // 1800 kcal - Opción A: Equilibrada
                {
                    name: 'Definición Equilibrada (1800 kcal)',
                    description: 'Déficit calórico moderado. Balance perfecto de macros para no pasar hambre.',
                    goal: 'lose',
                    total_calories: 1800,
                    total_protein: 120,
                    total_carbs: 200,
                    total_fats: 60,
                    meals: [
                        { name: 'Desayuno', description: '2 Tostadas con aceite de oliva y jamón serrano.', meal_order: 1, calories: 400, protein_g: 15, carbs_g: 40, fats_g: 15 },
                        { name: 'Almuerzo', description: 'Lentejas estofadas con verduras y arroz.', meal_order: 2, calories: 600, protein_g: 25, carbs_g: 80, fats_g: 15 },
                        { name: 'Merienda', description: 'Batido de fruta y leche o proteína.', meal_order: 3, calories: 250, protein_g: 20, carbs_g: 30, fats_g: 5 },
                        { name: 'Cena', description: 'Tortilla de 2 huevos con espinacas y un poco de pan.', meal_order: 4, calories: 450, protein_g: 25, carbs_g: 25, fats_g: 20 },
                        { name: 'Postre', description: 'Una onza de chocolate negro >85%.', meal_order: 5, calories: 100, protein_g: 35, carbs_g: 25, fats_g: 5 }
                    ]
                },

                // 1800 kcal - Opción B: Alta en Proteína
                {
                    name: 'Definición Proteica (1800 kcal)',
                    description: 'Mismas calorías, pero priorizando la proteína (150g) para proteger el músculo.',
                    goal: 'lose',
                    total_calories: 1800,
                    total_protein: 150,
                    total_carbs: 150,
                    total_fats: 65,
                    meals: [
                        { name: 'Desayuno', description: 'Revuelto de 3 claras y 1 huevo con pavo.', meal_order: 1, calories: 350, protein_g: 25, carbs_g: 5, fats_g: 15 },
                        { name: 'Almuerzo', description: 'Ternera magra (180g) con brócoli y arroz integral.', meal_order: 2, calories: 600, protein_g: 45, carbs_g: 50, fats_g: 20 },
                        { name: 'Merienda', description: 'Lata de atún al natural y unas nueces.', meal_order: 3, calories: 250, protein_g: 25, carbs_g: 5, fats_g: 15 },
                        { name: 'Cena', description: 'Salmón (150g) a la plancha con espárragos.', meal_order: 4, calories: 500, protein_g: 35, carbs_g: 10, fats_g: 15 },
                        { name: 'Recena', description: 'Yogur proteico o queso batido.', meal_order: 5, calories: 100, protein_g: 20, carbs_g: 80, fats_g: 0 }
                    ]
                },

                // 2000 kcal - Definición para gente grande
                {
                    name: 'Definición Activa (2000 kcal)',
                    description: 'Para personas con peso alto o mucha actividad que quieren bajar grasa.',
                    goal: 'lose',
                    total_calories: 2000,
                    total_protein: 160,
                    total_carbs: 180,
                    total_fats: 70,
                    meals: [
                        { name: 'Desayuno', description: 'Tortitas de avena (60g) y claras de huevo (200ml).', meal_order: 1, calories: 450, protein_g: 30, carbs_g: 50, fats_g: 8 },
                        { name: 'Almuerzo', description: 'Pollo (200g) con pasta integral (80g) y tomate.', meal_order: 2, calories: 650, protein_g: 50, carbs_g: 70, fats_g: 15 },
                        { name: 'Merienda', description: 'Sandwich de pavo y queso.', meal_order: 3, calories: 350, protein_g: 20, carbs_g: 35, fats_g: 10 },
                        { name: 'Cena', description: 'Sepia o calamar a la plancha con ensalada.', meal_order: 4, calories: 550, protein_g: 60, carbs_g: 25, fats_g: 37 }
                    ]
                },


                // ============================================================
                // OBJETIVO: MANTENIMIENTO (MAINTAIN)
                // ============================================================

                // 2000 kcal - Mantenimiento Base
                {
                    name: 'Mantenimiento Base (2000 kcal)',
                    description: 'La dieta estándar para un adulto medio. Nutrición completa.',
                    goal: 'maintain',
                    total_calories: 2000,
                    total_protein: 110,
                    total_carbs: 240,
                    total_fats: 65,
                    meals: [
                        { name: 'Desayuno', description: 'Café, zumo y tostadas con aceite y tomate.', meal_order: 1, calories: 450, protein_g: 8, carbs_g: 60, fats_g: 15 },
                        { name: 'Almuerzo', description: 'Cocido ligero (garbanzos, verduras, pollo).', meal_order: 2, calories: 700, protein_g: 35, carbs_g: 80, fats_g: 25 },
                        { name: 'Merienda', description: 'Yogur con cereales y miel.', meal_order: 3, calories: 300, protein_g: 10, carbs_g: 40, fats_g: 5 },
                        { name: 'Cena', description: 'Tortilla de calabacín y un poco de pan.', meal_order: 4, calories: 550, protein_g: 20, carbs_g: 30, fats_g: 20 },
                        { name: 'Extra', description: 'Una pieza de fruta.', meal_order: 5, calories: 0, protein_g: 37, carbs_g: 30, fats_g: 0 }
                    ]
                },

                // 2200 kcal - Mantenimiento Sport
                {
                    name: 'Mantenimiento Sport (2200 kcal)',
                    description: 'Un poco más de energía para días de entrenamiento.',
                    goal: 'maintain',
                    total_calories: 2200,
                    total_protein: 135,
                    total_carbs: 260,
                    total_fats: 70,
                    meals: [
                        { name: 'Desayuno', description: 'Huevos revueltos con tostadas y aguacate.', meal_order: 1, calories: 550, protein_g: 25, carbs_g: 40, fats_g: 25 },
                        { name: 'Almuerzo', description: 'Arroz con pollo al curry y verduras.', meal_order: 2, calories: 750, protein_g: 40, carbs_g: 90, fats_g: 20 },
                        { name: 'Merienda', description: 'Queso batido con nueces.', meal_order: 3, calories: 300, protein_g: 20, carbs_g: 10, fats_g: 15 },
                        { name: 'Cena', description: 'Emperador a la plancha con puré de patata.', meal_order: 4, calories: 600, protein_g: 50, carbs_g: 120, fats_g: 10 }
                    ]
                },

                // 2500 kcal - Mantenimiento Alto
                {
                    name: 'Mantenimiento Alto (2500 kcal)',
                    description: 'Para metabolismos rápidos o gente muy activa.',
                    goal: 'maintain',
                    total_calories: 2500,
                    total_protein: 150,
                    total_carbs: 300,
                    total_fats: 80,
                    meals: [
                        { name: 'Desayuno', description: 'Bol grande de leche, avena, cacao y plátano.', meal_order: 1, calories: 650, protein_g: 25, carbs_g: 90, fats_g: 15 },
                        { name: 'Almuerzo', description: 'Plato de pasta boloñesa con queso.', meal_order: 2, calories: 850, protein_g: 40, carbs_g: 100, fats_g: 30 },
                        { name: 'Merienda', description: 'Bocadillo de lomo o jamón.', meal_order: 3, calories: 400, protein_g: 25, carbs_g: 40, fats_g: 15 },
                        { name: 'Cena', description: 'Salmón con ensalada completa.', meal_order: 4, calories: 600, protein_g: 35, carbs_g: 20, fats_g: 35 },
                        { name: 'Extra', description: 'Vaso de leche antes de dormir.', meal_order: 5, calories: 0, protein_g: 25, carbs_g: 50, fats_g: 0 }
                    ]
                },


                // ============================================================
                // OBJETIVO: GANAR MÚSCULO (GAIN)
                // ============================================================

                // 2400 kcal - Volumen Controlado (Tu favorita probablemente)
                {
                    name: 'Volumen Limpio (2400 kcal)',
                    description: 'Ganancia muscular minimizando grasa. Proteína ajustada (130g).',
                    goal: 'gain',
                    total_calories: 2400,
                    total_protein: 130, // PERFECTA PARA 120-130g
                    total_carbs: 320,
                    total_fats: 65,
                    meals: [
                        { name: 'Desayuno', description: 'Tortilla de avena (huevos + avena) y fruta.', meal_order: 1, calories: 550, protein_g: 25, carbs_g: 60, fats_g: 15 },
                        { name: 'Almuerzo', description: 'Guiso de patatas con carne magra de ternera.', meal_order: 2, calories: 800, protein_g: 40, carbs_g: 100, fats_g: 25 },
                        { name: 'Merienda', description: 'Batido de plátano y leche (o proteína).', meal_order: 3, calories: 350, protein_g: 25, carbs_g: 40, fats_g: 5 },
                        { name: 'Cena', description: 'Arroz con merluza y gambas.', meal_order: 4, calories: 700, protein_g: 40, carbs_g: 120, fats_g: 20 }
                    ]
                },

                // 2700 kcal - Volumen Estándar
                {
                    name: 'Volumen Estándar (2700 kcal)',
                    description: 'Superávit sólido. Comida abundante pero sana.',
                    goal: 'gain',
                    total_calories: 2700,
                    total_protein: 150,
                    total_carbs: 360,
                    total_fats: 75,
                    meals: [
                        { name: 'Desayuno', description: '3 Huevos revueltos, 2 tostadas y zumo.', meal_order: 1, calories: 650, protein_g: 25, carbs_g: 50, fats_g: 30 },
                        { name: 'Almuerzo', description: 'Arroz a la cubana doble (400g arroz, 2 huevos, tomate).', meal_order: 2, calories: 900, protein_g: 30, carbs_g: 140, fats_g: 25 },
                        { name: 'Merienda', description: 'Sandwich de atún y un yogur.', meal_order: 3, calories: 450, protein_g: 25, carbs_g: 50, fats_g: 10 },
                        { name: 'Cena', description: 'Pollo asado con boniato.', meal_order: 4, calories: 700, protein_g: 45, carbs_g: 60, fats_g: 25 },
                        { name: 'Recena', description: 'Puñado de nueces.', meal_order: 5, calories: 0, protein_g: 25, carbs_g: 60, fats_g: 0 }
                    ]
                },

                // 3000 kcal - Volumen Alto
                {
                    name: 'Volumen Alto (3000 kcal)',
                    description: 'Para quienes les cuesta subir de peso (Hardgainers).',
                    goal: 'gain',
                    total_calories: 3000,
                    total_protein: 170,
                    total_carbs: 400,
                    total_fats: 85,
                    meals: [
                        { name: 'Desayuno', description: 'Batido Gainer Casero: Leche, avena, crema cacahuete, plátano.', meal_order: 1, calories: 800, protein_g: 35, carbs_g: 90, fats_g: 35 },
                        { name: 'Almuerzo', description: 'Macarrones con carne (200g) y queso.', meal_order: 2, calories: 950, protein_g: 50, carbs_g: 110, fats_g: 30 },
                        { name: 'Merienda', description: 'Bocadillo grande de lomo/queso.', meal_order: 3, calories: 550, protein_g: 30, carbs_g: 60, fats_g: 20 },
                        { name: 'Cena', description: 'Salmón con arroz y aguacate.', meal_order: 4, calories: 700, protein_g: 35, carbs_g: 60, fats_g: 30 },
                        { name: 'Extra', description: 'Vaso de leche y galletas maría.', meal_order: 5, calories: 0, protein_g: 20, carbs_g: 80, fats_g: 0 }
                    ]
                },

                // 3300 kcal - Volumen Extremo (Proteína controlada 180g)
                {
                    name: 'Volumen Plus (3300 kcal)',
                    description: 'Máxima energía. Proteína alta pero segura (180g), el resto carbohidratos.',
                    goal: 'gain',
                    total_calories: 3300,
                    total_protein: 180,
                    total_carbs: 450,
                    total_fats: 95,
                    meals: [
                        { name: 'Desayuno', description: 'Desayuno inglés: Huevos, judías, tostadas, bacon (poco).', meal_order: 1, calories: 850, protein_g: 40, carbs_g: 80, fats_g: 40 },
                        { name: 'Almuerzo', description: 'Platazo de legumbres con arroz y algo de carne.', meal_order: 2, calories: 1000, protein_g: 50, carbs_g: 140, fats_g: 25 },
                        { name: 'Merienda', description: 'Dos sandwiches mixtos y zumo.', meal_order: 3, calories: 650, protein_g: 25, carbs_g: 90, fats_g: 20 },
                        { name: 'Cena', description: 'Ternera con puré de patatas.', meal_order: 4, calories: 800, protein_g: 45, carbs_g: 80, fats_g: 30 },
                        { name: 'Extra', description: 'Batido de caseína o leche antes de dormir.', meal_order: 5, calories: 0, protein_g: 20, carbs_g: 60, fats_g: 0 }
                    ]
                }
            ];

            // 3. Insertar datos en la base de datos
            for (const dietData of diets) {
                // Insertar dieta
                await queryInterface.bulkInsert('template_diets', [{
                    name: dietData.name,
                    description: dietData.description,
                    goal: dietData.goal,
                    total_calories: dietData.total_calories,
                    total_protein: dietData.total_protein,
                    total_carbs: dietData.total_carbs,
                    total_fats: dietData.total_fats,
                    created_at: new Date(),
                    updated_at: new Date()
                }], { transaction });

                // Recuperar ID
                const [insertedDiet] = await queryInterface.sequelize.query(
                    `SELECT id FROM template_diets WHERE name = :name LIMIT 1;`,
                    {
                        replacements: { name: dietData.name },
                        type: queryInterface.sequelize.QueryTypes.SELECT,
                        transaction
                    }
                );

                // Insertar comidas
                if (insertedDiet && dietData.meals.length > 0) {
                    const mealsToInsert = dietData.meals.map(meal => ({
                        template_diet_id: insertedDiet.id,
                        name: meal.name,
                        description: meal.description,
                        meal_order: meal.meal_order,
                        calories: meal.calories,
                        protein_g: meal.protein_g,
                        carbs_g: meal.carbs_g,
                        fats_g: meal.fats_g,
                        created_at: new Date(),
                        updated_at: new Date()
                    }));

                    await queryInterface.bulkInsert('template_diet_meals', mealsToInsert, { transaction });
                }
            }

            await transaction.commit();
            console.log('✅ Seed de dietas predefinidas (Catálogo Extendido) insertado correctamente.');

        } catch (error) {
            await transaction.rollback();
            console.error('❌ Error en el seeder de dietas:', error);
            throw error;
        }
    },

    async down(queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            await queryInterface.bulkDelete('template_diet_meals', null, { transaction });
            await queryInterface.bulkDelete('template_diets', null, { transaction });
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
};