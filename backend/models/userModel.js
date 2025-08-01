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
      unique: true,
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
    // Se ajusta la configuración de timestamps para que coincida con la migración
    timestamps: true,
    updatedAt: false, // Se mantiene desactivado porque la tabla no lo tiene
    createdAt: 'created_at',
  }
);

export default User;