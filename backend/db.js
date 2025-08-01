import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(
  // Usa la variable de producción si existe, si no, la de desarrollo
  isProduction ? process.env.MYSQL_DATABASE : process.env.DB_NAME,
  isProduction ? process.env.MYSQL_USERNAME : process.env.DB_USER,
  isProduction ? process.env.MYSQL_PASSWORD : process.env.DB_PASSWORD,
  {
    host: isProduction ? process.env.MYSQL_HOST : process.env.DB_HOST,
    dialect: 'mysql',
    // Aplica SSL solo en producción
    dialectOptions: isProduction ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {}
  }
);

export default sequelize;