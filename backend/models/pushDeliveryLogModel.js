/* backend/models/pushDeliveryLogModel.js */
import { DataTypes } from 'sequelize';
import sequelize from '../db.js';

const PushDeliveryLog = sequelize.define(
  'PushDeliveryLog',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "'fcm' para Android nativo, 'webpush' para navegador",
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "'success' o 'error'",
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
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
    tableName: 'push_delivery_logs',
    timestamps: false,
    underscored: true,
  }
);

export default PushDeliveryLog;
