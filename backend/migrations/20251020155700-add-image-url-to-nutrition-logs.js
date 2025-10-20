'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const tableDescription = await queryInterface.describeTable('nutrition_logs', { transaction });

      if (!tableDescription.image_url) {
        await queryInterface.addColumn('nutrition_logs', 'image_url', {
          type: Sequelize.STRING(255),
          allowNull: true,
          comment: 'URL de la imagen de la comida'
        }, { transaction });
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const tableDescription = await queryInterface.describeTable('nutrition_logs', { transaction });

      if (tableDescription.image_url) {
        await queryInterface.removeColumn('nutrition_logs', 'image_url', { transaction });
      }
      
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};