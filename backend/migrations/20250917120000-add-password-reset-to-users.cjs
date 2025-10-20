'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Añadimos dos nuevas columnas a la tabla 'users'
    await queryInterface.addColumn('users', 'password_reset_token', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Token para resetear la contraseña'
    });
    await queryInterface.addColumn('users', 'password_reset_expires_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Fecha de expiración del token de reseteo'
    });
  },

  async down(queryInterface, Sequelize) {
    // Revertimos los cambios eliminando las columnas
    await queryInterface.removeColumn('users', 'password_reset_token');
    await queryInterface.removeColumn('users', 'password_reset_expires_at');
  }
};