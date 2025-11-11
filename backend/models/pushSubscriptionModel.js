/* backend/models/pushSubscriptionModel.js */

'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
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
        // --- INICIO DE LA MODIFICACIÓN ---
        model: 'users', // Cambiado de 'Users' a 'users' (minúscula)
        // --- FIN DE LA MODIFICACIÓN ---
        key: 'id',
      },
    },
    // El 'endpoint' es la URL única que identifica al servicio de push
    endpoint: {
      // --- INICIO DE LA MODIFICACIÓN ---
      type: DataTypes.STRING(512), // Cambiado de TEXT a STRING(512) (VARCHAR)
      // --- FIN DE LA MODIFICACIÓN ---
      allowNull: false,
      unique: true, // Esto ahora funcionará
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
    // timestamps: true, // Creado por defecto (createdAt, updatedAt)
  });
  return PushSubscription;
};