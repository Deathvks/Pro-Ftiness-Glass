/* backend/models/templateDietModel.js */
import { DataTypes } from "sequelize";
import sequelize from "../db.js";

const TemplateDiet = sequelize.define(
    "TemplateDiet",
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
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        goal: {
            type: DataTypes.ENUM('lose', 'maintain', 'gain'),
            allowNull: false,
        },
        total_calories: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        total_protein: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        total_carbs: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        total_fats: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    },
    {
        tableName: 'template_diets',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

export default TemplateDiet;