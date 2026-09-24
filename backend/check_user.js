import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql'
});

async function run() {
    const [results] = await sequelize.query('SELECT id, name, role, trainer_id FROM Users WHERE id = 44');
    console.log(results);
    process.exit(0);
}
run();
