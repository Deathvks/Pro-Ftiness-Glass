/* backend/migrations/20260201000000-add-is-hdr-to-stories.cjs */
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Stories', 'is_hdr', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      after: 'privacy' // Para mantener orden visual en herramientas DB
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Stories', 'is_hdr');
  }
};