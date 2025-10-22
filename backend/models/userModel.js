/* backend/models/userModel.js */
const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.WorkoutLog, { foreignKey: 'userId' });
      User.hasMany(models.PersonalRecord, { foreignKey: 'userId' });
      User.hasMany(models.Routine, { foreignKey: 'userId' });
      User.hasMany(models.BodyWeight, { foreignKey: 'userId' });
      User.hasMany(models.NutritionLog, { foreignKey: 'userId' });
      User.hasMany(models.FavoriteMeal, { foreignKey: 'userId' });
      User.hasMany(models.TemplateRoutine, { foreignKey: 'userId' });
      User.hasMany(models.CreatinaLog, { foreignKey: 'userId' });
    }

    // Método para verificar la contraseña
    validPassword(password) {
      return bcrypt.compareSync(password, this.password);
    }
  }

  User.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true // Permitimos nulo temporalmente por la migración de 'username'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'user' // 'user' o 'admin'
    },
    goal: {
      type: DataTypes.STRING, // 'loss', 'maintenance', 'gain'
      allowNull: true
    },
    weight: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    height: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    gender: {
      type: DataTypes.STRING, // 'male', 'female', 'other'
      allowNull: true
    },
    activityLevel: {
      type: DataTypes.STRING, // 'sedentary', 'light', 'moderate', 'active', 'very_active'
      allowNull: true
    },
    targetCalories: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    targetProtein: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    targetCarbs: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    targetFat: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    verification_code: {
      type: DataTypes.STRING,
      allowNull: true
    },
    verification_expires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    password_reset_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password_reset_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    profile_image_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // --- INICIO DE LA MODIFICACIÓN ---
    lastSeen: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // --- FIN DE LA MODIFICACIÓN ---
  }, {
    sequelize,
    modelName: 'User',
    hooks: {
      // Hook para hashear la contraseña antes de crear o actualizar el usuario
      beforeSave: async (user, options) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  return User;
};