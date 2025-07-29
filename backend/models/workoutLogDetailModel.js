import { DataTypes } from "sequelize";
import sequelize from "../db.js";

const WorkoutLogDetail = sequelize.define(
  "WorkoutLogDetail",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    workout_log_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'workout_logs', // Se enlaza con el registro de entrenamiento
        key: 'id',
      }
    },
    exercise_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    tableName: 'workout_log_details',
    timestamps: false,
  }
);

export default WorkoutLogDetail;