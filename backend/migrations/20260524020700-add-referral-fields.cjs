/* backend/migrations/20260524020700-add-referral-fields.cjs */
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'referred_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'ID del usuario que invitó a este usuario'
    });

    await queryInterface.addColumn('users', 'referral_code', {
      type: Sequelize.STRING,
      unique: true,
      allowNull: true,
      comment: 'Código único para que este usuario invite a otros'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'referral_code');
    await queryInterface.removeColumn('users', 'referred_by');
  }
};