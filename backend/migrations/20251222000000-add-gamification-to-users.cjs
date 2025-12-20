/* backend/migrations/20251222000000-add-gamification-to-users.cjs */
'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const tableInfo = await queryInterface.describeTable('users');

        if (!tableInfo.xp) {
            await queryInterface.addColumn('users', 'xp', {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                allowNull: false
            });
        }
        if (!tableInfo.level) {
            await queryInterface.addColumn('users', 'level', {
                type: Sequelize.INTEGER,
                defaultValue: 1,
                allowNull: false
            });
        }
        if (!tableInfo.streak) {
            await queryInterface.addColumn('users', 'streak', {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                allowNull: false
            });
        }
        if (!tableInfo.last_activity_date) {
            await queryInterface.addColumn('users', 'last_activity_date', {
                type: Sequelize.DATEONLY,
                allowNull: true
            });
        }
        if (!tableInfo.unlocked_badges) {
            await queryInterface.addColumn('users', 'unlocked_badges', {
                type: Sequelize.TEXT, // JSON stringified
                allowNull: true,
                defaultValue: '[]'
            });
        }
    },

    async down(queryInterface, Sequelize) {
        // Nota: En producción a veces es mejor no borrar datos al hacer rollback, 
        // pero para desarrollo esto limpia la tabla.
        const tableInfo = await queryInterface.describeTable('users');

        if (tableInfo.xp) await queryInterface.removeColumn('users', 'xp');
        if (tableInfo.level) await queryInterface.removeColumn('users', 'level');
        if (tableInfo.streak) await queryInterface.removeColumn('users', 'streak');
        if (tableInfo.last_activity_date) await queryInterface.removeColumn('users', 'last_activity_date');
        if (tableInfo.unlocked_badges) await queryInterface.removeColumn('users', 'unlocked_badges');
    }
};