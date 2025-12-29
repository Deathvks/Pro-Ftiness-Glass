/* backend/migrations/20260101120000-add-nutrition-targets-to-users.cjs */
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('users', 'target_calories', {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            allowNull: true,
        });
        await queryInterface.addColumn('users', 'target_protein', {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            allowNull: true,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('users', 'target_calories');
        await queryInterface.removeColumn('users', 'target_protein');
    }
};