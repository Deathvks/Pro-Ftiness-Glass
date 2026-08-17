/* backend/models/messageModel.js */
import { DataTypes } from 'sequelize';
import sequelize from '../db.js';

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  sender_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  receiver_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  attachment_url: {
    type: DataTypes.STRING(1000),
    allowNull: true,
  },
  attachment_type: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  tableName: 'messages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

export default Message;
