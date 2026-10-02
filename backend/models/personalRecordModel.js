import { DataTypes } from "sequelize";
import sequelize from "../db.js";

const PersonalRecord = sequelize.define(
  "PersonalRecord",
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
    exercise_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    weight_kg: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: 'personal_records',
    timestamps: false,
    // --- CORRECCIÓN CLAVE ---
    // Evita que Sequelize pluralice o infiera nombres de tablas incorrectamente.
    freezeTableName: true,
  }
);

export default PersonalRecord;