/* backend/models/bodyMeasurementModel.js */
import { DataTypes } from "sequelize";
import sequelize from "../db.js";

const BodyMeasurementLog = sequelize.define(
    "BodyMeasurementLog",
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
                model: 'users',
                key: 'id',
            }
        },
        measure_type: {
            type: DataTypes.STRING(50), // Ej: 'biceps', 'waist', 'chest', 'thigh'
            allowNull: false,
        },
        value: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
        },
        unit: {
            type: DataTypes.STRING(10),
            allowNull: false,
            defaultValue: 'cm',
        },
        log_date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: 'body_measurement_logs',
        timestamps: false,
    }
);

export default BodyMeasurementLog;