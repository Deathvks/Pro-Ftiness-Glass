/* backend/migrations/20251225000000-create-bug-reports.cjs */
'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('BugReports', {
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
                    model: 'Users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            subject: {
                type: Sequelize.STRING,
                allowNull: false
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            device_info: {
                type: Sequelize.JSON,
                allowNull: true
            },
            status: {
                type: Sequelize.STRING,
                defaultValue: 'open' // open, resolved, closed
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('BugReports');
    }
};