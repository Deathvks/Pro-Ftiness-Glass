/* backend/models/bugReportModel.js */
import { Model, DataTypes } from 'sequelize';
import sequelize from '../db.js';

class BugReport extends Model { }

BugReport.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'bug'
    },
    subject: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    deviceInfo: {
        type: DataTypes.JSON,
        field: 'device_info'
    },
    images: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'open'
    }
}, {
    sequelize,
    modelName: 'BugReport',
    tableName: 'BugReports',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default BugReport;