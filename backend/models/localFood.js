/* backend/models/localFood.js */
export default (sequelize, DataTypes) => {
    const LocalFood = sequelize.define('LocalFood', {
        name: { type: DataTypes.STRING, allowNull: false, unique: true },
        barcode: { type: DataTypes.STRING(50), allowNull: true },
        brand: { type: DataTypes.STRING(100), allowNull: true },
        serving_quantity: { type: DataTypes.FLOAT, allowNull: true },
        calories: { type: DataTypes.FLOAT, defaultValue: 0 },
        protein_g: { type: DataTypes.FLOAT, defaultValue: 0 },
        carbs_g: { type: DataTypes.FLOAT, defaultValue: 0 },
        fats_g: { type: DataTypes.FLOAT, defaultValue: 0 },
        sugars_g: { type: DataTypes.FLOAT, defaultValue: 0 },
        image_url: { type: DataTypes.STRING, allowNull: true },
        last_synced_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    }, {
        tableName: 'local_foods',
        timestamps: false
    });

    return LocalFood;
};
