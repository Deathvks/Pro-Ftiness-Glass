'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('users');
    if (!columns.push_consents) {
      await queryInterface.addColumn('users', 'push_consents', { type: Sequelize.JSON, allowNull: true });
    }
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'push_consents');
  }
};
