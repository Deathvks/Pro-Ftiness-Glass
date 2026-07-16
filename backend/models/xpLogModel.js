import { DataTypes } from 'sequelize';
import sequelize from '../db.js';

const XpLog = sequelize.define('XpLog', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    reason: {
        type: DataTypes.STRING,
        allowNull: true
    },
    previous_xp: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    new_xp: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
}, {
    tableName: 'xp_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default XpLog;
