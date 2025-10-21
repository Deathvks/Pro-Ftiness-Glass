'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up (queryInterface, Sequelize) {
    // --- INICIO DE LA MODIFICACIÓN ---
    const tableDescription = await queryInterface.describeTable('nutrition_logs');
    if (!tableDescription.image_url) {
      await queryInterface.addColumn('nutrition_logs', 'image_url', {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'URL de la imagen de la comida'
      });
    }
    // --- FIN DE LA MODIFICACIÓN ---
  },

  async down (queryInterface, Sequelize) {
    // --- INICIO DE LA MODIFICACIÓN ---
    const tableDescription = await queryInterface.describeTable('nutrition_logs');
    if (tableDescription.image_url) {
      await queryInterface.removeColumn('nutrition_logs', 'image_url');
    }
    // --- FIN DE LA MODIFICACIÓN ---
  }
};