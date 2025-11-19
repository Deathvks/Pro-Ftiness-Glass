/* backend/migrations/20251120100000-add-per-100g-to-nutrition-logs.cjs */
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('nutrition_logs', 'calories_per_100g', {
      type: Sequelize.DECIMAL(6, 2),
      allowNull: true,
      comment: 'Calorías por cada 100g'
    });
    await queryInterface.addColumn('nutrition_logs', 'protein_per_100g', {
      type: Sequelize.DECIMAL(6, 2),
      allowNull: true,
      comment: 'Proteínas por cada 100g'
    });
    await queryInterface.addColumn('nutrition_logs', 'carbs_per_100g', {
      type: Sequelize.DECIMAL(6, 2),
      allowNull: true,
      comment: 'Carbohidratos por cada 100g'
    });
    await queryInterface.addColumn('nutrition_logs', 'fat_per_100g', {
      type: Sequelize.DECIMAL(6, 2),
      allowNull: true,
      comment: 'Grasas por cada 100g'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('nutrition_logs', 'calories_per_100g');
    await queryInterface.removeColumn('nutrition_logs', 'protein_per_100g');
    await queryInterface.removeColumn('nutrition_logs', 'carbs_per_100g');
    await queryInterface.removeColumn('nutrition_logs', 'fat_per_100g');
  }
};