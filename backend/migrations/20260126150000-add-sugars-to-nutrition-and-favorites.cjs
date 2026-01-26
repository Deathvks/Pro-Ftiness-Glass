/* backend/migrations/20260126150000-add-sugars-to-nutrition-and-favorites.cjs */
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. Modificaciones en 'nutrition_logs' (Solo campos de azúcar)
      await queryInterface.addColumn('nutrition_logs', 'sugars_g', {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: true,
        comment: 'Azúcar en gramos'
      }, { transaction });

      await queryInterface.addColumn('nutrition_logs', 'sugars_per_100g', {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: true,
        comment: 'Azúcar por cada 100g'
      }, { transaction });

      // 2. Modificaciones en 'favorite_meals' (Azúcar + Campos per_100g faltantes)
      
      // Azúcar
      await queryInterface.addColumn('favorite_meals', 'sugars_g', {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: true,
        comment: 'Azúcar en gramos'
      }, { transaction });

      await queryInterface.addColumn('favorite_meals', 'sugars_per_100g', {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: true,
        comment: 'Azúcar por cada 100g'
      }, { transaction });

      // Resto de valores por 100g (para sincronizar con nutrition_logs)
      await queryInterface.addColumn('favorite_meals', 'calories_per_100g', {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: true,
        comment: 'Calorías por cada 100g'
      }, { transaction });

      await queryInterface.addColumn('favorite_meals', 'protein_per_100g', {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: true,
        comment: 'Proteínas por cada 100g'
      }, { transaction });

      await queryInterface.addColumn('favorite_meals', 'carbs_per_100g', {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: true,
        comment: 'Carbohidratos por cada 100g'
      }, { transaction });

      await queryInterface.addColumn('favorite_meals', 'fat_per_100g', {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: true,
        comment: 'Grasas por cada 100g'
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Revertir cambios en 'nutrition_logs'
      await queryInterface.removeColumn('nutrition_logs', 'sugars_g', { transaction });
      await queryInterface.removeColumn('nutrition_logs', 'sugars_per_100g', { transaction });

      // Revertir cambios en 'favorite_meals'
      await queryInterface.removeColumn('favorite_meals', 'sugars_g', { transaction });
      await queryInterface.removeColumn('favorite_meals', 'sugars_per_100g', { transaction });
      await queryInterface.removeColumn('favorite_meals', 'calories_per_100g', { transaction });
      await queryInterface.removeColumn('favorite_meals', 'protein_per_100g', { transaction });
      await queryInterface.removeColumn('favorite_meals', 'carbs_per_100g', { transaction });
      await queryInterface.removeColumn('favorite_meals', 'fat_per_100g', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};