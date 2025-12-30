/* backend/migrations/20260105000000-add-daily-gamification-state.cjs */
'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('users', 'daily_gamification_state', {
            type: Sequelize.JSON,
            allowNull: true,
            defaultValue: {},
            comment: 'Guarda el estado diario de XP (comidas, agua, entrenamientos) para evitar exploits al borrar logs'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('users', 'daily_gamification_state');
    }
};