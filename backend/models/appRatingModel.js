import { Model, DataTypes } from 'sequelize';
import sequelize from '../db.js';

class AppRating extends Model {}

AppRating.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 5
        }
    },
    comment: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'AppRating',
    tableName: 'app_ratings',
    timestamps: true,
    updatedAt: false, // We only care about createdAt
});

export default AppRating;
