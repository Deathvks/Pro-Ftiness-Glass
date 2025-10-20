import { DataTypes } from "sequelize";
import sequelize from "../db.js";

const NutritionLog = sequelize.define('NutritionLog', {
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
  log_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  meal_type: {
    type: DataTypes.ENUM('breakfast', 'lunch', 'dinner', 'snack'),
    allowNull: false,
  },
  description: {
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
  weight_g: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    comment: 'Peso de la comida en gramos'
  },
  // --- INICIO DE LA MODIFICACIÓN ---
  image_url: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'URL de la imagen de la comida'
  },
  // --- FIN DE LA MODIFICACIÓN ---
}, {
  tableName: 'nutrition_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default NutritionLog;