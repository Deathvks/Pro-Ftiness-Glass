'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('messages', 'bot_push_status', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'pending',
    });
    await queryInterface.addColumn('messages', 'bot_email_status', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'pending',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('messages', 'bot_push_status');
    await queryInterface.removeColumn('messages', 'bot_email_status');
  }
};
