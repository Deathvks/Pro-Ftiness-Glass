import { Model, DataTypes } from 'sequelize';
import sequelize from '../db.js';

class SystemSettings extends Model {}

SystemSettings.init({
  key: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'SystemSettings',
  tableName: 'system_settings',
  timestamps: true
});

export default SystemSettings;
