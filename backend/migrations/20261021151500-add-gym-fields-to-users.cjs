'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('users').catch(() => ({}));

    if (!tableInfo.show_gym) {
      await queryInterface.addColumn('users', 'show_gym', {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      }).catch(err => console.log('Column show_gym might already exist:', err.message));
    }

    if (!tableInfo.gym_data) {
      await queryInterface.addColumn('users', 'gym_data', {
        type: Sequelize.TEXT,
        allowNull: true,
      }).catch(err => console.log('Column gym_data might already exist:', err.message));
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'show_gym').catch(() => {});
    await queryInterface.removeColumn('users', 'gym_data').catch(() => {});
  }
};
