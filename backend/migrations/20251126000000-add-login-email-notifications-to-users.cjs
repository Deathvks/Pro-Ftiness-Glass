/* backend/migrations/20251126000000-add-login-email-notifications-to-users.cjs */
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Añadimos la columna 'login_email_notifications' a la tabla 'users'
    await queryInterface.addColumn('users', 'login_email_notifications', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true, // Por defecto activado para mantener la seguridad actual
      comment: 'Preferencia para recibir emails de alerta al iniciar sesión con 2FA'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'login_email_notifications');
  }
};