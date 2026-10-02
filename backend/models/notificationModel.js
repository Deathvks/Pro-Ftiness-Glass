/* backend/models/notificationModel.js */
import { DataTypes } from "sequelize";
import sequelize from "../db.js";

const Notification = sequelize.define(
  "Notification",
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
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'info',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    // Definimos MANUALMENTE las columnas para que coincidan 100% con tu CSV
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
    tableName: 'notifications',
    // Desactivamos timestamps automáticos para evitar conflictos.
    // Nosotros ya hemos definido created_at y updated_at arriba.
    timestamps: false,
    underscored: true,
    indexes: [
      {
        fields: ['user_id', 'is_read']
      },
      {
        fields: ['created_at']
      }
    ]
  }
);

export default Notification;