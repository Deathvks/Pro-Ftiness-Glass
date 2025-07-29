import { DataTypes } from "sequelize";
import sequelize from "../db.js";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true, // Asegura que el email sea único
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      allowNull: true,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    activity_level: {
      type: DataTypes.DECIMAL(4, 3),
      allowNull: true,
    },
    goal: {
      type: DataTypes.ENUM('lose', 'maintain', 'gain'),
      allowNull: true,
    },
  },
  {
    tableName: 'users',
    // Sequelize gestionará la columna 'created_at', pero no 'updated_at'
    timestamps: true,
    updatedAt: false, // Desactivamos updatedAt porque no existe en tu tabla
    createdAt: 'created_at',
  }
);

export default User;