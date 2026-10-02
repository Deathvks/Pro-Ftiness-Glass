'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('workout_logs');
    if (!tableDescription.routine_id) {
      await queryInterface.addColumn('workout_logs', 'routine_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'routines',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('workout_logs');
    if (tableDescription.routine_id) {
      await queryInterface.removeColumn('workout_logs', 'routine_id');
    }
  }
};