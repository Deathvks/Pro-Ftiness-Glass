'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('user_sessions');
    if (!tableInfo.app_version) {
      await queryInterface.addColumn('user_sessions', 'app_version', {
        type: Sequelize.STRING(32),
        allowNull: true,
        defaultValue: null,
      });
    }
    if (!tableInfo.app_channel) {
      await queryInterface.addColumn('user_sessions', 'app_channel', {
        type: Sequelize.STRING(16),
        allowNull: true,
        defaultValue: null,
      });
    }
    if (!tableInfo.app_os) {
      await queryInterface.addColumn('user_sessions', 'app_os', {
        type: Sequelize.STRING(16),
        allowNull: true,
        defaultValue: null,
      });
    }
  },

  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable('user_sessions');
    if (tableInfo.app_os) {
      await queryInterface.removeColumn('user_sessions', 'app_os');
    }
    if (tableInfo.app_channel) {
      await queryInterface.removeColumn('user_sessions', 'app_channel');
    }
    if (tableInfo.app_version) {
      await queryInterface.removeColumn('user_sessions', 'app_version');
    }
  },
};
