/* backend/models/userModel.js */
import { Model, DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../db.js';

class User extends Model {
  // Método para verificar la contraseña
  validPassword(password) {
    // Si el usuario no tiene contraseña (login solo con Google), retornamos false
    if (!this.password_hash) return false;
    // Compara la contraseña proporcionada con el hash almacenado
    return bcrypt.compareSync(password, this.password_hash);
  }
}

User.init({
  // --- Columnas que SÍ existen en la BBDD según las migraciones ---
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: { // Añadido por migración inicial o ...copy-name...
    type: DataTypes.STRING,
    allowNull: true
  },
  email: { // Añadido por migración inicial
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password_hash: { // Añadido por migración inicial
    type: DataTypes.STRING,
    allowNull: true // CAMBIO: Permitir nulo para usuarios de Google
  },
  // --- INICIO DE LA MODIFICACIÓN ---
  google_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  // --- FIN DE LA MODIFICACIÓN ---
  role: { // Añadido por migración inicial (ENUM en BBDD)
    type: DataTypes.STRING, // Usamos STRING en modelo por flexibilidad
    defaultValue: 'user'
  },
  goal: { // Añadido por migración inicial (ENUM en BBDD)
    type: DataTypes.STRING, // Usamos STRING en modelo
    allowNull: true
  },
  height: { // Añadido por migración inicial (INTEGER en BBDD)
    type: DataTypes.INTEGER, // Coincide con BBDD
    allowNull: true
  },
  age: { // Añadido por migración inicial
    type: DataTypes.INTEGER,
    allowNull: true
  },
  gender: { // Añadido por migración inicial (ENUM en BBDD)
    type: DataTypes.STRING, // Usamos STRING en modelo
    allowNull: true
  },
  activity_level: { // Añadido por migración inicial (DECIMAL(4,3) en BBDD)
    type: DataTypes.DECIMAL(4, 3), // Coincide con BBDD
    allowNull: true
  },
  is_verified: { // Añadido por migración ...add-is-verified...
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verification_code: { // Añadido por migración ...add-verification-fields...
    type: DataTypes.STRING, // STRING(6) en BBDD, STRING genérico está bien
    allowNull: true
  },
  verification_code_expires_at: { // Añadido por migración ...add-verification-fields...
    type: DataTypes.DATE,
    allowNull: true
  },
  password_reset_token: { // Añadido por migración ...add-password-reset...
    type: DataTypes.STRING,
    allowNull: true,
  },
  password_reset_expires_at: { // Añadido por migración ...add-password-reset...
    type: DataTypes.DATE,
    allowNull: true,
  },
  username: { // Añadido por migración ...add-username...
    type: DataTypes.STRING, // STRING(100) en BBDD
    allowNull: true,
    unique: true
  },
  profile_image_url: { // Añadido por migración ...add-username...
    type: DataTypes.STRING, // STRING(255) en BBDD
    allowNull: true,
  },
  lastSeen: { // Añadido por migración ...add-last-seen...
    type: DataTypes.DATE,
    allowNull: true,
  },
  
  // --- NUEVOS CAMPOS PARA 2FA ---
  two_factor_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  two_factor_method: {
    type: DataTypes.STRING, // 'email' o 'app'
    allowNull: true
  },
  two_factor_secret: {
    type: DataTypes.STRING, // Secreto TOTP base32
    allowNull: true
  },
  two_factor_recovery_codes: {
    type: DataTypes.TEXT, // JSON stringified con los códigos
    allowNull: true
  },
  // --- NUEVO CAMPO ---
  last_totp_slice: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  // --- NUEVO CAMPO PREFERENCIA EMAIL 2FA ---
  login_email_notifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },

  // created_at es manejado por timestamps abajo

}, {
  sequelize,
  modelName: 'User',
  tableName: 'users', // Nombre exacto de la tabla en BBDD
  timestamps: true, // Habilitar timestamps
  createdAt: 'created_at', // Mapear createdAt al nombre de columna correcto
  updatedAt: false, // Deshabilitar updatedAt si no existe en BBDD
  hooks: {
    beforeSave: async (user, options) => {
      // Hashear contraseña si cambió y no es nula
      if (user.changed('password_hash') && user.password_hash) {
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
      }
    }
  }
});

// Definir asociaciones fuera de init, como es común
User.associate = function(models) {
    User.hasMany(models.Routine, { foreignKey: 'user_id', as: 'Routines' });
    User.hasMany(models.WorkoutLog, { foreignKey: 'user_id', as: 'WorkoutLogs' });
    User.hasMany(models.BodyWeightLog, { foreignKey: 'user_id', as: 'BodyWeightLogs' });
    User.hasMany(models.NutritionLog, { foreignKey: 'user_id', as: 'NutritionLogs' });
    User.hasMany(models.WaterLog, { foreignKey: 'user_id', as: 'WaterLogs' });
    User.hasMany(models.FavoriteMeal, { foreignKey: 'user_id', as: 'FavoriteMeals' });
    User.hasMany(models.PersonalRecord, { foreignKey: 'user_id', as: 'PersonalRecords' });
    User.hasMany(models.TemplateRoutine, { foreignKey: 'user_id', as: 'TemplateRoutines' }); // Asumiendo FK user_id
    User.hasMany(models.CreatinaLog, { foreignKey: 'user_id', as: 'creatinaLogs' });
    User.hasMany(models.PushSubscription, { foreignKey: 'userId', onDelete: 'CASCADE', as: 'PushSubscriptions' });
    User.hasMany(models.Notification, { foreignKey: 'user_id', onDelete: 'CASCADE', as: 'Notifications' });
};

export default User;