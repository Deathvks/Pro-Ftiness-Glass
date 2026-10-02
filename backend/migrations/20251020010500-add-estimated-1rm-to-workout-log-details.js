'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up (queryInterface, Sequelize) {
    // Añade la columna 'estimated_1rm' a la tabla 'workout_log_details'.
    await queryInterface.addColumn('workout_log_details', 'estimated_1rm', {
      type: Sequelize.DECIMAL(6, 2), // Igual que best_set_weight
      allowNull: true, // Permitir nulos por si no se puede calcular
      comment: 'Estimación del 1RM basada en la mejor serie del ejercicio en este log.'
      // Puedes añadir 'after: superset_group_id' si quieres que aparezca después de esa columna
    });
  },

  async down (queryInterface, Sequelize) {
    // Revierte la migración eliminando la columna 'estimated_1rm'.
    await queryInterface.removeColumn('workout_log_details', 'estimated_1rm');
  }
};