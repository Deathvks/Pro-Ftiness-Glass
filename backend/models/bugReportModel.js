/* backend/models/bugReportModel.js */
import { Model, DataTypes } from 'sequelize';
import sequelize from '../db.js'; // Importamos la instancia configurada

class BugReport extends Model { }

BugReport.init({
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    subject: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    deviceInfo: {
        type: DataTypes.JSON,
        field: 'device_info' // Mapeamos camelCase a snake_case de la DB
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