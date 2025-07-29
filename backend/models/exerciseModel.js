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
    // --- INICIO DE LA MODIFICACIÓN ---
    exercise_list_id: { // Referencia a la tabla maestra de ejercicios
      type: DataTypes.INTEGER,
      allowNull: true, // Puede ser nulo si es un ejercicio personalizado
      references: {
        model: 'exercise_list',
        key: 'id',
      }
    },
    // --- FIN ---
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
  },
  {
    tableName: 'routine_exercises',
    timestamps: false,
  }
);

export default RoutineExercise;