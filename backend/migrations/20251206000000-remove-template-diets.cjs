/* backend/migrations/20251206000000-remove-template-diets.cjs */
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            // 1. Borramos primero la tabla hija (foreign key)
            await queryInterface.dropTable('template_diet_meals', { transaction });

            // 2. Borramos la tabla padre
            await queryInterface.dropTable('template_diets', { transaction });

            await transaction.commit();
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    },

    async down(queryInterface, Sequelize) {
        // Dejamos el down vacío ya que no queremos revertir la eliminación fácilmente
        // sin reescribir toda la definición de la tabla.
    }
};