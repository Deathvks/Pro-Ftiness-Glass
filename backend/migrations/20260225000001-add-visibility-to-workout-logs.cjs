'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('workout_logs', 'visibility', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'friends'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('workout_logs', 'visibility');
  }
};