'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('messages').catch(() => ({}));
    if (!tableInfo.is_closed) {
      await queryInterface.addColumn('messages', 'is_closed', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      }).catch(err => console.log('Column is_closed might already exist:', err.message));
    }
    if (!tableInfo.bot_reminder_level) {
      await queryInterface.addColumn('messages', 'bot_reminder_level', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      }).catch(err => console.log('Column bot_reminder_level might already exist:', err.message));
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('messages', 'is_closed').catch(() => {});
    await queryInterface.removeColumn('messages', 'bot_reminder_level').catch(() => {});
  }
};
