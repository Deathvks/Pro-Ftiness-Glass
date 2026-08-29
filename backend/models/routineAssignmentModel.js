import { DataTypes } from 'sequelize';
import sequelize from '../db.js';

const RoutineAssignment = sequelize.define('RoutineAssignment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  routine_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'routines',
      key: 'id'
    }
  },
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'routine_assignments',
  timestamps: true,
  createdAt: 'assigned_at',
  updatedAt: false
});

export default RoutineAssignment;
