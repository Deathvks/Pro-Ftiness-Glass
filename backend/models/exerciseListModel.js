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
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    video_url: {
      type: DataTypes.STRING(255), // Ya lo tenías, ¡perfecto!
      allowNull: true,
    },

    // --- INICIO DE LA MODIFICACIÓN ---
    // Nuevos campos para los datos de wger
    wger_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Permitir nulos si creas ejercicios manualmente
      unique: true
    },
    category: {
      type: DataTypes.STRING(100), // Ej: Fuerza, Cardio, Estiramiento
      allowNull: true,
    },
    equipment: {
      type: DataTypes.STRING(255), // Ej: Mancuerna, Barra, Ninguno
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
    // --- FIN DE LA MODIFICACIÓN ---
  },
  {
    tableName: 'exercise_list',
    timestamps: false,
  }
);

export default ExerciseList;