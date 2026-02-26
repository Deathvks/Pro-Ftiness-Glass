/* backend/models/workoutLikeModel.js */
import { Model, DataTypes } from 'sequelize';
import sequelize from '../db.js';

class WorkoutLike extends Model {}

WorkoutLike.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  workout_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'workout_logs',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  sequelize,
  modelName: 'WorkoutLike',
  tableName: 'workout_likes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'workout_id'] // Un usuario solo puede dar un like por entrenamiento
    }
  ]
});

export default WorkoutLike;