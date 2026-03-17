'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('local_foods', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      name: { type: Sequelize.STRING, allowNull: false },
      calories: { type: Sequelize.FLOAT, defaultValue: 0 },
      protein_g: { type: Sequelize.FLOAT, defaultValue: 0 },
      carbs_g: { type: Sequelize.FLOAT, defaultValue: 0 },
      fats_g: { type: Sequelize.FLOAT, defaultValue: 0 },
      sugars_g: { type: Sequelize.FLOAT, defaultValue: 0 },
      image_url: { type: Sequelize.STRING, allowNull: true }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('local_foods');
  }
};