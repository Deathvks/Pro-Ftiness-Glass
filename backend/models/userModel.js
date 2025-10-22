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
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      allowNull: false,
      defaultValue: 'user',
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
    is_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    // --- INICIO DE LA MODIFICACIÓN ---
    username: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      comment: 'Nombre de usuario público',
    },
    profile_image_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'URL de la imagen de perfil del usuario',
    },
    // --- FIN DE LA MODIFICACIÓN ---
    verification_code: {
      type: DataTypes.STRING(6),
      allowNull: true,
    },
    verification_code_expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    password_reset_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // --- INICIO DE LA CORRECCIÓN ---
    // Se corrige el nombre de la columna para que coincida con la migración.
    password_reset_expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // --- FIN DE LA CORRECCIÓN ---
  },
  {
    tableName: 'users',
    timestamps: true,
    updatedAt: false,
    createdAt: 'created_at',
  }
);

export default User;