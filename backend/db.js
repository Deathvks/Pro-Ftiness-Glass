/* backend/db.js */
import { Sequelize } from 'sequelize';
import config from './config/config.cjs';

const env = process.env.NODE_ENV || (process.env.MYSQL_HOST ? 'production' : 'development');
const dbConfig = config[env];

console.log(`🔌 Conectando a Base de Datos: ${dbConfig.database} en ${dbConfig.host}`);

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    timezone: '+00:00',
    port: dbConfig.port,
    dialectOptions: {
      ...dbConfig.dialectOptions || {},
      timezone: '+00:00',
    },
    logging: false,
    // OPTIMIZACIÓN: Pool de conexiones para ahorrar RAM
    pool: {
      max: 5,      // Límite bajo para no saturar memoria
      min: 0,      // Permite cerrar todas las conexiones si está inactivo (Crucial para Zeabur)
      acquire: 30000,
      idle: 10000  // Cierra conexión tras 10s sin uso
    }
  }
);

export default sequelize;