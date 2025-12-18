/* backend/models/userSessionModel.js */
import { Model, DataTypes } from 'sequelize';
import sequelize from '../db.js';

class UserSession extends Model { }

UserSession.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    token: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    device_type: {
        type: DataTypes.STRING, // mobile, tablet, console, smarttv, wearable, embedded
        allowNull: true
    },
    device_name: {
        type: DataTypes.STRING, // Nombre legible del navegador/SO
        allowNull: true
    },
    ip_address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    last_active: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'UserSession',
    tableName: 'user_sessions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

UserSession.associate = function (models) {
    UserSession.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
};

export default UserSession;