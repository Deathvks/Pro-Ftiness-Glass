'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('workout_log_sets', 'rir', {
      type: Sequelize.DECIMAL(3, 1),
      allowNull: true,
      defaultValue: null,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('workout_log_sets', 'rir');
  }
};