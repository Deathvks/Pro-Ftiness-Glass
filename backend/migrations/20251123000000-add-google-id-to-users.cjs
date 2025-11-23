'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Añadir columna google_id
      await queryInterface.addColumn('users', 'google_id', {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true,
        comment: 'ID único proporcionado por Google'
      }, { transaction });

      // 2. Permitir que password_hash sea nulo (para usuarios solo de Google)
      await queryInterface.changeColumn('users', 'password_hash', {
        type: Sequelize.STRING(255),
        allowNull: true,
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
      // Revertir cambios
      // Nota: Si hay usuarios con password NULL, esto fallará al intentar poner allowNull: false.
      // Se asume reversión en entorno controlado.
      
      await queryInterface.removeColumn('users', 'google_id', { transaction });

      await queryInterface.changeColumn('users', 'password_hash', {
        type: Sequelize.STRING(255),
        allowNull: false, 
      }, { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};