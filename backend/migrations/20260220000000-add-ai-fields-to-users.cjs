/* backend/migrations/20260220000000-add-ai-fields-to-users.cjs */
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'ai_requests_count', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });

    await queryInterface.addColumn('users', 'last_ai_request_date', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'ai_requests_count');
    await queryInterface.removeColumn('users', 'last_ai_request_date');
  }
};