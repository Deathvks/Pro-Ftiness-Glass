/* backend/models/exerciseModel.js */
import { DataTypes } from "sequelize";
import sequelize from "../db.js";

const RoutineExercise = sequelize.define(
  "RoutineExercise",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    routine_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'routines',
        key: 'id',
      }
    },
    exercise_list_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'exercise_list',
        key: 'id',
      }
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    muscle_group: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    sets: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reps: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    superset_group_id: {
      type: DataTypes.STRING, // Cambiado a STRING para que coincida con el controller (que usa UUIDs)
      allowNull: true,
    },
    exercise_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    
    // --- INICIO DE LA MODIFICACIÓN (FIX FINAL) ---
    // Añadir los campos que faltaban
    rest_seconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 60,
    },
    image_url_start: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    video_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // --- FIN DE LA MODIFICACIÓN ---
  },
  {
    tableName: 'routine_exercises',
    timestamps: false,
  }
);

export default RoutineExercise;