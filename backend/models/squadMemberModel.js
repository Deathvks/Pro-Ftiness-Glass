/* backend/models/squadMemberModel.js */
import { DataTypes } from 'sequelize';
import sequelize from '../db.js';

const SquadMember = sequelize.define('SquadMember', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  squad_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'member'),
    defaultValue: 'member',
    allowNull: false
  }
}, {
  tableName: 'squad_members',
  timestamps: true
});

export default SquadMember;