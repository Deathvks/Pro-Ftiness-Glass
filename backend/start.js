import { exec, spawn } from 'child_process';
import sequelize from './db.js';

const RETRY_DELAY_MS = 5000; // Esperar 5 segundos entre intentos
const MAX_RETRIES = 12; // Intentarlo durante un máximo de 60 segundos

// Usamos 'exec' para comandos cortos como las migraciones
function runExecCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`> ${command}`);
    const process = exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${command}\n${stderr}`);
        reject(error);
        return;
      }
      if (stdout) console.log(stdout);
      resolve(stdout);
    });
  });
}

// Usamos 'spawn' para el proceso del servidor, que es de larga duración
function runSpawnCommand(command, args) {
    console.log(`> ${command} ${args.join(' ')}`);
    const child = spawn(command, args, {
        // Esto asegura que los logs del servidor se muestren en los logs de Zeabur
        stdio: 'inherit' 
    });

    child.on('close', (code) => {
        console.log(`Server process exited with code ${code}`);
        process.exit(code);
    });

    child.on('error', (err) => {
        console.error('Failed to start server process.', err);
        process.exit(1);
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

async function start() {
  try {
    // 1. Esperar a que la base de datos esté disponible
    await waitForDatabase();

    // 2. Ejecutar las migraciones de la base de datos
    console.log('🚀 Running database migrations...');
    await runExecCommand('npx sequelize-cli db:migrate --env production');
    console.log('✅ Migrations completed.');

    // --- INICIO DE LA MODIFICACIÓN ---
    // 3. Ejecutar los seeders para poblar la base de datos
    console.log('🚀 Running database seeders...');
    await runExecCommand('npx sequelize-cli db:seed:all --env production');
    console.log('✅ Seeders completed.');
    // --- FIN DE LA MODIFICACIÓN ---

    // 4. Iniciar el servidor principal
    console.log('🚀 Starting application server...');
    runSpawnCommand('node', ['server.js']);

  } catch (error) {
    console.error('❌ Failed to start the application.', error.message);
    process.exit(1);
  }
}

start();