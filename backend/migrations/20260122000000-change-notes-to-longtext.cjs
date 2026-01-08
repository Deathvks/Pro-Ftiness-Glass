/* backend/migrations/20260122000000-change-notes-to-longtext.cjs */
'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.changeColumn('workout_logs', 'notes', {
            type: Sequelize.TEXT('long'), // Cambia a LONGTEXT para soportar JSONs grandes de GPS
            allowNull: true,
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.changeColumn('workout_logs', 'notes', {
            type: Sequelize.TEXT, // Revierte a TEXT normal en caso de rollback
            allowNull: true,
        });
    }
};