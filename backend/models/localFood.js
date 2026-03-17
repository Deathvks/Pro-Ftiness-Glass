/* backend/models/localFood.js */
export default (sequelize, DataTypes) => {
    const LocalFood = sequelize.define('LocalFood', {
        name: { type: DataTypes.STRING, allowNull: false, unique: true },
        calories: { type: DataTypes.FLOAT, defaultValue: 0 },
        protein_g: { type: DataTypes.FLOAT, defaultValue: 0 },
        carbs_g: { type: DataTypes.FLOAT, defaultValue: 0 },
        fats_g: { type: DataTypes.FLOAT, defaultValue: 0 },
        sugars_g: { type: DataTypes.FLOAT, defaultValue: 0 },
        image_url: { type: DataTypes.STRING, allowNull: true }
    }, {
        tableName: 'local_foods',
        timestamps: false
    });

    return LocalFood;
};