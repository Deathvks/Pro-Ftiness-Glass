'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('users');
    if (!tableInfo.training_reminder_hour) {
      await queryInterface.addColumn('users', 'training_reminder_hour', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
        comment: 'Hora local preferida (0-23) para recordatorios diarios de entrenamiento'
      });
    }
  },

  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable('users');
    if (tableInfo.training_reminder_hour) {
      await queryInterface.removeColumn('users', 'training_reminder_hour');
    }
  }
};
