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
    // --- ESTAS SON LAS LÍNEAS IMPORTANTES ---
    // Definen las nuevas columnas que añadimos a la base de datos
    total_volume: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    best_set_weight: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
    },
    // --- FIN DE LA SECCIÓN IMPORTANTE ---
  },
  {
    tableName: 'workout_log_details',
    timestamps: false,
  }
);

export default WorkoutLogDetail;