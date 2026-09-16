import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UploadLog = sequelize.define('UploadLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  uploader_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  file_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  file_type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('success', 'error'),
    allowNull: false,
  },
  cloudinary_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'upload_logs',
  timestamps: true,
  updatedAt: false
});

export default UploadLog;