'use strict';

/** @type {import('sequelize-cli').Migration} */
// --- INICIO DE LA CORRECCIÓN ---
// Se cambia 'export default' por 'module.exports' para usar CommonJS
module.exports = {
// --- FIN DE LA CORRECCIÓN ---
  async up (queryInterface, Sequelize) {
    /**
     * Cambia el tipo de la columna 'superset_group_id' de INTEGER a STRING
     * en la tabla 'routine_exercises' para permitir almacenar UUIDs.
     */
    await queryInterface.changeColumn('routine_exercises', 'superset_group_id', {
      type: Sequelize.STRING, // Cambiado de INTEGER a STRING
      allowNull: true,
      comment: 'ID (UUID) to group exercises into a superset'
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Revierte el cambio, volviendo a INTEGER.
     */
    await queryInterface.changeColumn('routine_exercises', 'superset_group_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'ID to group exercises into a superset'
    });
  }
};