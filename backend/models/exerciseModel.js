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
        model: 'routines', // Nombre de la tabla a la que hace referencia
        key: 'id',
      }
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    muscle_group: {
      type: DataTypes.STRING(100),
      allowNull: true, // El grupo muscular es opcional
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