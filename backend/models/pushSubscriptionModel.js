/* backend/models/pushSubscriptionModel.js */
import { DataTypes } from "sequelize";
import sequelize from "../db.js";

const PushSubscription = sequelize.define(
  "PushSubscription",
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
      },
      onDelete: 'CASCADE'
    },
    endpoint: {
      // CAMBIO IMPORTANTE: Usamos STRING(500) en lugar de TEXT
      // Esto permite que 'unique: true' funcione en MySQL.
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
    },
    keys: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    // Columnas manuales para evitar el error 'Unknown column'
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    }
  },
  {
    tableName: 'push_subscriptions',
    timestamps: false, // Desactivamos timestamps automáticos
    underscored: true,
  }
);

export default PushSubscription;