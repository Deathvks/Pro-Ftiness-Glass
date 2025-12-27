/* backend/models/exerciseListModel.js */
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
      type: DataTypes.STRING(255), // Ampliado de 100 a 255 para soportar listas de músculos
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
    wger_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: true
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    equipment: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    image_url_start: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    image_url_end: {
      type: DataTypes.STRING(255),
      allowNull: true,
    }
  },
  {
    tableName: 'exercise_list',
    timestamps: false,
  }
);

export default ExerciseList;