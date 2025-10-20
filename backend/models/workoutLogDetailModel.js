/* backend/models/workoutLogDetailModel.js */
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
        model: 'workout_logs',
        key: 'id',
      }
    },
    exercise_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    total_volume: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    best_set_weight: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
    },
    // --- LÍNEA AÑADIDA ---
    // Guarda el ID del grupo de la superserie para poder agruparlos en el historial.
    superset_group_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // --- INICIO DE LA MODIFICACIÓN ---
    // Añadimos el campo para guardar el 1RM estimado
    estimated_1rm: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: true,
        comment: 'Estimación del 1RM basada en la mejor serie del ejercicio en este log.'
    },
    // --- FIN DE LA MODIFICACIÓN ---
  },
  {
    tableName: 'workout_log_details',
    timestamps: false,
  }
);

export default WorkoutLogDetail;