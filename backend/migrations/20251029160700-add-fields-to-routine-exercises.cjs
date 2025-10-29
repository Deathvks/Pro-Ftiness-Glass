/* backend/migrations/20251029160700-add-fields-to-routine-exercises.cjs */
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // --- CORRECCIÓN: Apuntar a la tabla 'routine_exercises' (con guion bajo) ---
      await queryInterface.addColumn('routine_exercises', 'rest_seconds', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 60
      }, { transaction });

      // --- CORRECCIÓN: Apuntar a la tabla 'routine_exercises' ---
      await queryInterface.addColumn('routine_exercises', 'image_url_start', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction });

      // --- CORRECCIÓN: Apuntar a la tabla 'routine_exercises' ---
      await queryInterface.addColumn('routine_exercises', 'video_url', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // --- CORRECCIÓN: Apuntar a la tabla 'routine_exercises' ---
      await queryInterface.removeColumn('routine_exercises', 'rest_seconds', { transaction });
      await queryInterface.removeColumn('routine_exercises', 'image_url_start', { transaction });
      await queryInterface.removeColumn('routine_exercises', 'video_url', { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};