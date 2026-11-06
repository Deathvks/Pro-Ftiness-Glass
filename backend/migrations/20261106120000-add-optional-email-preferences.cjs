'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'email_activity_notifications', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Preferencia para recibir notificaciones de actividad por correo'
    });
    await queryInterface.addColumn('users', 'email_marketing_consent', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Consentimiento expreso para recordatorios promocionales por correo'
    });
    await queryInterface.addColumn('users', 'email_preferences_updated_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Fecha de la última actualización de preferencias de correo'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'email_preferences_updated_at');
    await queryInterface.removeColumn('users', 'email_marketing_consent');
    await queryInterface.removeColumn('users', 'email_activity_notifications');
  }
};
