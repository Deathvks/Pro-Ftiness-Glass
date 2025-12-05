/* backend/migrations/20251205000000-create-template-diets.js */
'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
    async up(queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            // 1. Tabla para los planes de dieta predefinidos
            await queryInterface.createTable('template_diets', {
                id: {
                    type: Sequelize.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                },
                name: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                    unique: true,
                },
                description: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },
                // 'lose', 'maintain', 'gain' para coincidir con el campo 'goal' del usuario
                goal: {
                    type: Sequelize.ENUM('lose', 'maintain', 'gain'),
                    allowNull: false,
                },
                total_calories: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                },
                total_protein: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                },
                total_carbs: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                },
                total_fats: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                },
                created_at: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                },
                updated_at: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                },
            }, { transaction });

            // 2. Tabla para las comidas de esos planes (Ej: Desayuno, Almuerzo...)
            await queryInterface.createTable('template_diet_meals', {
                id: {
                    type: Sequelize.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                },
                template_diet_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'template_diets',
                        key: 'id',
                    },
                    onDelete: 'CASCADE',
                },
                name: {
                    type: Sequelize.STRING(100), // Ej: "Desayuno", "Post-entreno"
                    allowNull: false,
                },
                description: {
                    type: Sequelize.TEXT, // Ej: "2 Huevos, 100g Avena..."
                    allowNull: false,
                },
                meal_order: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 1, // Para ordenar cronológicamente
                },
                calories: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                },
                protein_g: {
                    type: Sequelize.DECIMAL(6, 2),
                    allowNull: true,
                },
                carbs_g: {
                    type: Sequelize.DECIMAL(6, 2),
                    allowNull: true,
                },
                fats_g: {
                    type: Sequelize.DECIMAL(6, 2),
                    allowNull: true,
                },
                created_at: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                },
                updated_at: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                },
            }, { transaction });

            await transaction.commit();
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    },

    async down(queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            await queryInterface.dropTable('template_diet_meals', { transaction });
            await queryInterface.dropTable('template_diets', { transaction });
            await transaction.commit();
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }
};