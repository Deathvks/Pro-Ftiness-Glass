import { DataTypes } from "sequelize";
import sequelize from "../db.js";

const TemplateDietMeal = sequelize.define(
    "TemplateDietMeal",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        template_diet_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'template_diets',
                key: 'id',
            },
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: 'Nombre de la comida (ej: Desayuno, Almuerzo)',
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: 'Descripción detallada o ingredientes',
        },
        meal_order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            comment: 'Orden de la comida en el día',
        },
        calories: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        protein_g: {
            type: DataTypes.DECIMAL(6, 2),
            allowNull: true,
        },
        carbs_g: {
            type: DataTypes.DECIMAL(6, 2),
            allowNull: true,
        },
        fats_g: {
            type: DataTypes.DECIMAL(6, 2),
            allowNull: true,
        },
    },
    {
        tableName: 'template_diet_meals',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

export default TemplateDietMeal;