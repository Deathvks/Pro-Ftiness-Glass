'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('users').catch(() => ({}));
    
    if (!tableInfo.force_password_reset) {
      await queryInterface.addColumn('users', 'force_password_reset', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: true,
      }).catch(err => console.log('Column might already exist:', err.message));
    }

    if (!tableInfo.trainer_id) {
      await queryInterface.addColumn('users', 'trainer_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
      }).catch(err => console.log('Column might already exist:', err.message));
    }

    if (!tableInfo.anamnesis_data) {
      await queryInterface.addColumn('users', 'anamnesis_data', {
        type: Sequelize.JSON,
        allowNull: true,
      }).catch(err => console.log('Column might already exist:', err.message));
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'force_password_reset').catch(() => {});
    await queryInterface.removeColumn('users', 'trainer_id').catch(() => {});
    await queryInterface.removeColumn('users', 'anamnesis_data').catch(() => {});
  }
};
