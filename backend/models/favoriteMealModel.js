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
    // --- INICIO DE LA MODIFICACIÓN ---
    weight_g: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      comment: 'Peso de la comida en gramos'
    },
    // --- FIN DE LA MODIFICACIÓN ---
    image_url: { // <-- Nuevo campo para guardar la URL de la imagen
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'URL de la imagen de la comida'
    }
  },
  {
    tableName: 'favorite_meals',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default FavoriteMeal;