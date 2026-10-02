/* backend/models/favoriteMealModel.js */
import { DataTypes } from "sequelize";
import sequelize from "../db.js";

const FavoriteMeal = sequelize.define(
  "FavoriteMeal",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      }
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    calories: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    protein_g: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
    },
    carbs_g: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
    },
    fats_g: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
    },
    // --- AÑADIDO: Azúcar ---
    sugars_g: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
      comment: 'Azúcar en gramos'
    },
    weight_g: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      comment: 'Peso de la comida en gramos'
    },
    image_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'URL de la imagen de la comida'
    },
    micronutrients: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Micronutrientes (vitaminas, minerales) en formato JSON'
    },
    // --- Campos por 100g ---
    calories_per_100g: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
      comment: 'Calorías por cada 100g'
    },
    protein_per_100g: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
      comment: 'Proteínas por cada 100g'
    },
    carbs_per_100g: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
      comment: 'Carbohidratos por cada 100g'
    },
    fat_per_100g: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
      comment: 'Grasas por cada 100g'
    },
    sugars_per_100g: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
      comment: 'Azúcar por cada 100g'
    },
  },
  {
    tableName: 'favorite_meals',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default FavoriteMeal;