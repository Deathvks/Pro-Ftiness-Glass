'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const table = await queryInterface.describeTable('BugReports');

        if (!table.category) {
            await queryInterface.addColumn('BugReports', 'category', {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: 'bug'
            });
        }

        if (!table.images) {
            await queryInterface.addColumn('BugReports', 'images', {
                type: Sequelize.JSON,
                allowNull: true
            });
        }
    },

    down: async (queryInterface, Sequelize) => {
        const table = await queryInterface.describeTable('BugReports');
        
        if (table.category) {
            await queryInterface.removeColumn('BugReports', 'category');
        }
        
        if (table.images) {
            await queryInterface.removeColumn('BugReports', 'images');
        }
    }
};