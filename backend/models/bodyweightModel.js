import { DataTypes } from "sequelize";
import sequelize from "../db.js"; // Asegúrate de que db.js exporte una instancia de Sequelize

const BodyWeightLog = sequelize.define(
  "BodyWeightLog",
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
        model: 'users', // Nombre de la tabla a la que hace referencia
        key: 'id',
      }
    },
    weight_kg: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    log_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    // Sequelize por defecto busca las tablas en plural, 'BodyWeightLogs'.
    // Si tu tabla se llama 'body_weight_logs', esta línea es opcional pero recomendada.
    tableName: 'body_weight_logs',
    // Desactivamos los campos createdAt y updatedAt que Sequelize añade por defecto.
    timestamps: false,
  }
);

export default BodyWeightLog;