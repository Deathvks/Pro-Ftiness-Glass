'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('messages').catch(() => ({}));
    if (!tableInfo.bot_push_status) {
      await queryInterface.addColumn('messages', 'bot_push_status', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'pending',
      }).catch(err => console.log('Column bot_push_status might already exist:', err.message));
    }
    if (!tableInfo.bot_email_status) {
      await queryInterface.addColumn('messages', 'bot_email_status', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'pending',
      }).catch(err => console.log('Column bot_email_status might already exist:', err.message));
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('messages', 'bot_push_status').catch(() => {});
    await queryInterface.removeColumn('messages', 'bot_email_status').catch(() => {});
  }
};
