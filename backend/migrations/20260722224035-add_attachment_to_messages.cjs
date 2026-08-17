'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('messages', 'attachment_url', {
      type: Sequelize.STRING(1000),
      allowNull: true,
    });
    await queryInterface.addColumn('messages', 'attachment_type', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('messages', 'attachment_url');
    await queryInterface.removeColumn('messages', 'attachment_type');
  }
};
