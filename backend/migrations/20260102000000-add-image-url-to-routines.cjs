/* backend/migrations/20260102000000-add-image-url-to-routines.cjs */
'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        try {
            const tableInfo = await queryInterface.describeTable('routines');
            if (!tableInfo.image_url) {
                await queryInterface.addColumn('routines', 'image_url', {
                    type: Sequelize.STRING(255),
                    allowNull: true,
                    defaultValue: null,
                    after: 'description'
                });
            }
        } catch (error) {
            console.log('Nota: La columna image_url probablemente ya existe o hubo un error menor:', error.message);
        }
    },

    async down(queryInterface, Sequelize) {
        try {
            await queryInterface.removeColumn('routines', 'image_url');
        } catch (error) {
            console.error('Error al eliminar columna (puede que no exista):', error.message);
        }
    }
};