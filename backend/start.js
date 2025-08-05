import { exec } from 'child_process';
import sequelize from './db.js';

const RETRY_DELAY_MS = 5000; // Esperar 5 segundos entre intentos
const MAX_RETRIES = 12; // Intentarlo durante un máximo de 60 segundos

async function runCommand(command) {
  return new Promise((resolve, reject) => {
    const process = exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${command}`, stderr);
        reject(error);
        return;
      }
      resolve(stdout);
    });

    // Redirigir la salida del proceso al log principal
    process.stdout.pipe(process.stdout);
    process.stderr.pipe(process.stderr);
  });
}

async function waitForDatabase() {
  for (let i = 1; i <= MAX_RETRIES; i++) {
    try {
      await sequelize.authenticate();
      console.log('✅ Database connection successful.');
      return;
    } catch (error) {
      console.log(`Attempt ${i}/${MAX_RETRIES}: Database not ready, retrying in ${RETRY_DELAY_MS / 1000}s...`);
      if (i === MAX_RETRIES) {
        console.error('❌ Could not connect to the database after multiple retries. Aborting.');
        throw error;
      }
      await new Promise(res => setTimeout(res, RETRY_DELAY_MS));
    }
  }
}

async function startServer() {
  try {
    // 1. Esperar a que la base de datos esté disponible
    await waitForDatabase();

    // 2. Ejecutar las migraciones de la base de datos
    console.log('🚀 Running database migrations...');
    await runCommand('npx sequelize-cli db:migrate --env production');
    console.log('✅ Migrations completed.');

    // 3. Iniciar el servidor principal
    console.log('🚀 Starting application server...');
    await runCommand('node server.js');

  } catch (error) {
    console.error('❌ Failed to start the application.', error);
    process.exit(1); // Salir con un código de error
  }
}

startServer();
