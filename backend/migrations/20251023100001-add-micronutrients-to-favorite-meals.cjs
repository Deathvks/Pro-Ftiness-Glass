'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('favorite_meals', 'micronutrients', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'Micronutrientes (vitaminas, minerales) en formato JSON'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('favorite_meals', 'micronutrients');
  }
};