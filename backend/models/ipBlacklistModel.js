import { DataTypes } from 'sequelize';
import sequelize from '../db.js';

const IpBlacklist = sequelize.define('IpBlacklist', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true // Si es nulo, es bloqueo permanente
  }
}, {
  tableName: 'ip_blacklists',
  timestamps: true
});

export default IpBlacklist;
