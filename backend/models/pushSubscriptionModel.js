/* backend/models/pushSubscriptionModel.js */
import { Model, DataTypes } from 'sequelize';
import sequelize from '../db.js';

class PushSubscription extends Model {
  /**
   * Helper method for defining associations.
   * This method is not a part of Sequelize lifecycle.
   * The `models/index` file will call this method automatically.
   */
  static associate(models) {
    // Una suscripción pertenece a un usuario
    PushSubscription.belongsTo(models.User, {
      foreignKey: 'userId',
      onDelete: 'CASCADE', // Si se borra el usuario, se borran sus suscripciones
    });
  }
}

PushSubscription.init({
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users', // Cambiado de 'Users' a 'users' (minúscula)
      key: 'id',
    },
  },
  // El 'endpoint' es la URL única que identifica al servicio de push
  endpoint: {
    type: DataTypes.TEXT, // Revertido a TEXT para soportar URLs largas de cualquier navegador
    allowNull: false,
    unique: true,
  },
  // 'keys' almacena las claves p256dh y auth necesarias para encriptar
  keys: {
    type: DataTypes.JSON,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'PushSubscription',
  tableName: 'PushSubscriptions',
  timestamps: true, // Creado por defecto (createdAt, updatedAt)
});

export default PushSubscription;