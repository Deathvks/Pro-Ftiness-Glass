/* backend/migrations/20260101000000-modify-muscle-group-length.cjs */
'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.changeColumn('exercise_list', 'muscle_group', {
            type: Sequelize.STRING(255),
            allowNull: false,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.changeColumn('exercise_list', 'muscle_group', {
            type: Sequelize.STRING(100),
            allowNull: false,
        });
    }
};