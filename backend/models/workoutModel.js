/* backend/models/workoutModel.js */
import { DataTypes } from "sequelize";
import sequelize from "../db.js";

const WorkoutLog = sequelize.define(
  "WorkoutLog",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      }
    },
    routine_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'routines',
        key: 'id',
      },
      onDelete: 'SET NULL'
    },
    routine_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    workout_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    duration_seconds: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    calories_burned: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    notes: {
      // CAMBIO: TEXT('long') para soportar JSONs grandes de GPS
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
  },
  {
    tableName: 'workout_logs',
    timestamps: false,
  }
);

export default WorkoutLog;