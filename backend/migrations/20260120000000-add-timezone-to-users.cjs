/* backend/migrations/20260120000000-add-timezone-to-users.cjs */
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('users', 'timezone', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'Europe/Madrid', // Valor por defecto seguro
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('users', 'timezone');
    }
};