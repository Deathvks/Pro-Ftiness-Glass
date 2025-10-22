'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn('users', 'username', {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true,
        comment: 'Nombre de usuario público',
      }, { transaction });

      await queryInterface.addColumn('users', 'profile_image_url', {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'URL de la imagen de perfil del usuario',
      }, { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('users', 'username', { transaction });
      await queryInterface.removeColumn('users', 'profile_image_url', { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};