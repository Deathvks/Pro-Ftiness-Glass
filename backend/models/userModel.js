/* backend/models/userModel.js */
import { Model, DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../db.js';

class User extends Model {
  // Método para verificar la contraseña
  validPassword(password) {
    if (!this.password_hash) return false;
    return bcrypt.compareSync(password, this.password_hash);
  }
}

User.init({
  // --- Columnas básicas ---
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: true
  },
  google_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'user'
  },

  // --- Datos físicos y demográficos ---
  goal: {
    type: DataTypes.STRING,
    allowNull: true
  },
  height: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  gender: {
    type: DataTypes.STRING,
    allowNull: true
  },
  activity_level: {
    type: DataTypes.DECIMAL(4, 3),
    allowNull: true
  },

  // --- Metas Nutricionales (NUEVO) ---
  target_calories: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: true
  },
  target_protein: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: true
  },

  // --- Verificación y Seguridad ---
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verification_code: {
    type: DataTypes.STRING,
    allowNull: true
  },
  verification_code_expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  password_reset_token: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  password_reset_expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  // --- Perfil Social y Visibilidad ---
  username: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  profile_image_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  lastSeen: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // --- NUEVOS CAMPOS DE PRIVACIDAD ---
  is_public_profile: {
    type: DataTypes.BOOLEAN,
    defaultValue: true, // Público por defecto
    allowNull: false
  },
  show_level_xp: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  show_badges: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },

  // --- 2FA ---
  two_factor_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  two_factor_method: {
    type: DataTypes.STRING,
    allowNull: true
  },
  two_factor_secret: {
    type: DataTypes.STRING,
    allowNull: true
  },
  two_factor_recovery_codes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  last_totp_slice: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  login_email_notifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },

  // --- GAMIFICACIÓN ---
  xp: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false
  },
  streak: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  last_activity_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  unlocked_badges: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '[]'
  }

}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  hooks: {
    beforeSave: async (user, options) => {
      if (user.changed('password_hash') && user.password_hash) {
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
      }
    }
  }
});

export default User;