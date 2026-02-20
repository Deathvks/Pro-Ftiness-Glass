/* backend/models/squadModel.js */
import { DataTypes } from 'sequelize';
import sequelize from '../db.js';

const Squad = sequelize.define('Squad', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { len: [3, 50] }
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  admin_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  invite_code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'squads',
  timestamps: true
});

export default Squad;