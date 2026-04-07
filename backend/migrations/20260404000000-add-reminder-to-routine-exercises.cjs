/* backend/migrations/20260404000000-add-reminder-to-routine-exercises.cjs */
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('routine_exercises', 'reminder', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('routine_exercises', 'reminder');
  }
};