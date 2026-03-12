/* backend/migrations/20260312140724-add-social-ids-to-users.cjs */
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Cambiado 'Users' por 'users'
    await queryInterface.addColumn('users', 'facebook_id', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });

    // Cambiado 'Users' por 'users'
    await queryInterface.addColumn('users', 'x_id', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Cambiado 'Users' por 'users'
    await queryInterface.removeColumn('users', 'facebook_id');
    await queryInterface.removeColumn('users', 'x_id');
  }
};