import { DataTypes } from 'sequelize';
import sequelize from '../db.js';

const EmailDeliveryLog = sequelize.define('EmailDeliveryLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  recipient_email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'sent' // sent, failed
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sent_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'email_delivery_logs',
  timestamps: false
});

export default EmailDeliveryLog;
