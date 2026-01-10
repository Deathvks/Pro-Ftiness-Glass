/* backend/migrations/20260124000000-add-folder-to-routines.cjs */
'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Usamos 'routines' en minúscula para coincidir con el tableName del modelo
        await queryInterface.addColumn('routines', 'folder', {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null,
            after: 'is_public'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('routines', 'folder');
    }
};