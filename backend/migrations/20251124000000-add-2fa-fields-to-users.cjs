/* backend/migrations/20251124000000-add-2fa-fields-to-users.cjs */
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Campo para activar/desactivar 2FA
      await queryInterface.addColumn('users', 'two_factor_enabled', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      }, { transaction });
      // 2. Campo para elegir el método ('email' o 'app')
      await queryInterface.addColumn('users', 'two_factor_method', {
        type: Sequelize.ENUM('email', 'app'),
        allowNull: true,
      }, { transaction });
      // 3. Campo para guardar el secreto TOTP (solo para método App)
      await queryInterface.addColumn('users', 'two_factor_secret', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Secreto base32 para autenticación TOTP (Google Authenticator)'
      }, { transaction });
      // 4. Campo para códigos de recuperación
      await queryInterface.addColumn('users', 'two_factor_recovery_codes', {
        type: Sequelize.TEXT, 
        allowNull: true,
      }, { transaction });
      
      // 5. Campo para guardar el último slice de tiempo usado (NUEVO)
      await queryInterface.addColumn('users', 'last_totp_slice', {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Último time-slice usado para evitar replay attacks en TOTP'
      }, { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Obtenemos la definición actual de la tabla para verificar qué columnas existen
      const tableDefinition = await queryInterface.describeTable('users');

      // Solo borramos las columnas si realmente existen en la BBDD
      if (tableDefinition.two_factor_enabled) {
        await queryInterface.removeColumn('users', 'two_factor_enabled', { transaction });
      }
      if (tableDefinition.two_factor_method) {
        await queryInterface.removeColumn('users', 'two_factor_method', { transaction });
      }
      if (tableDefinition.two_factor_secret) {
        await queryInterface.removeColumn('users', 'two_factor_secret', { transaction });
      }
      if (tableDefinition.two_factor_recovery_codes) {
        await queryInterface.removeColumn('users', 'two_factor_recovery_codes', { transaction });
      }
      // Verificación clave para evitar tu error:
      if (tableDefinition.last_totp_slice) {
        await queryInterface.removeColumn('users', 'last_totp_slice', { transaction });
      }
      
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};