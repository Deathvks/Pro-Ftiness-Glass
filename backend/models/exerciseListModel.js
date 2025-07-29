import { DataTypes } from "sequelize";
import sequelize from "../db.js";

const ExerciseList = sequelize.define(
  "ExerciseList",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    muscle_group: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    video_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: 'exercise_list',
    timestamps: false,
  }
);

export default ExerciseList;