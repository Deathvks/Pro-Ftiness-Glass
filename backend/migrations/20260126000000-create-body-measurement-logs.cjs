/* backend/migrations/20260126000000-create-body-measurement-logs.cjs */
'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('body_measurement_logs', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'users', // Asegúrate de que coincida con el nombre de tu tabla de usuarios
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            measure_type: {
                type: Sequelize.STRING(50),
                allowNull: false
            },
            value: {
                type: Sequelize.DECIMAL(5, 2),
                allowNull: false
            },
            unit: {
                type: Sequelize.STRING(10),
                allowNull: false,
                defaultValue: 'cm'
            },
            log_date: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // Opcional: Añadir un índice para optimizar búsquedas por usuario y fecha
        await queryInterface.addIndex('body_measurement_logs', ['user_id', 'measure_type']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('body_measurement_logs');
    }
};