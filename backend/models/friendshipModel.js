/* backend/models/friendshipModel.js */
import { DataTypes } from 'sequelize';
import sequelize from '../db.js';

const Friendship = sequelize.define('Friendship', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    requester_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users', // Cambiado a minúscula para asegurar coincidencia
            key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    addressee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users', // Cambiado a minúscula
            key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'blocked'),
        defaultValue: 'pending'
    }
    // create_at y updated_at se gestionan automáticamente con timestamps: true
}, {
    tableName: 'friendships',
    timestamps: true,      // Activamos timestamps
    underscored: true,     // Fuerza created_at y updated_at (snake_case)
    indexes: [
        {
            unique: true,
            fields: ['requester_id', 'addressee_id']
        }
    ]
});

export default Friendship;