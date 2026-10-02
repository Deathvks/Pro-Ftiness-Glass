/* backend/models/workoutCommentModel.js */
import { Model, DataTypes } from 'sequelize';
import sequelize from '../db.js';

class WorkoutComment extends Model {}

WorkoutComment.init({
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
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  }
}, {
  sequelize,
  modelName: 'WorkoutComment',
  tableName: 'workout_comments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

export default WorkoutComment;