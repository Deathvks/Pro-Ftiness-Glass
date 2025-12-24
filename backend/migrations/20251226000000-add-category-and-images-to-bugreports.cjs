/* backend/migrations/20251226000000-add-category-and-images-to-bugreports.cjs */
'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Añadimos la columna category
        await queryInterface.addColumn('BugReports', 'category', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'bug'
        });

        // Añadimos la columna images para guardar el array de rutas
        await queryInterface.addColumn('BugReports', 'images', {
            type: Sequelize.JSON,
            allowNull: true
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('BugReports', 'category');
        await queryInterface.removeColumn('BugReports', 'images');
    }
};