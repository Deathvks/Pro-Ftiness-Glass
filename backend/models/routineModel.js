import { DataTypes } from "sequelize";
import sequelize from "../db.js";

const Routine = sequelize.define(
  "Routine",
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true, // La descripción puede ser nula
    },
  },
  {
    tableName: 'routines',
    // Le decimos a Sequelize que gestione los timestamps,
    // pero que use los nombres de columna de tu BBDD.
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Routine;