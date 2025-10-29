'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Cambia el tipo de la columna 'superset_group_id' de INTEGER a STRING
     * en la tabla 'workout_log_details' para permitir almacenar UUIDs.
     */
    await queryInterface.changeColumn('workout_log_details', 'superset_group_id', {
      type: Sequelize.STRING, // Cambiado de INTEGER a STRING
      allowNull: true,
      comment: 'ID (UUID) to group exercises into a superset'
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Revierte el cambio, volviendo a INTEGER.
     */
    await queryInterface.changeColumn('workout_log_details', 'superset_group_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'ID to group exercises into a superset'
    });
  }
};