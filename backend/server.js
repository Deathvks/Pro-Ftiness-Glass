/* backend/server.js */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import db from './models/index.js';
import errorHandler from './middleware/errorHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from './routes/auth.js';
import bodyweightRoutes from './routes/bodyweight.js';
import creatinaRoutes from './routes/creatina.js';
import exerciseRoutes from './routes/exercises.js';
import exerciseListRoutes from './routes/exerciseList.js';
import favoriteMealsRoutes from './routes/favoriteMeals.js';
import nutritionRoutes from './routes/nutrition.js';
import personalRecordsRoutes from './routes/personalRecords.js';
import routineRoutes from './routes/routines.js';
import templateRoutinesRoutes from './routes/templateRoutines.js';
import userRoutes from './routes/users.js';
import workoutRoutes from './routes/workouts.js';
import adminRoutes from './routes/admin.js';
import notificationRoutes from './routes/notifications.js';
// --- INICIO DE LA MODIFICACIÓN ---
// Importamos el servicio de Cron (ahora corregido)
import { startCronJobs } from './services/cronService.js';
// --- FIN DE LA MODIFICACIÓN ---

const app = express();
app.set('trust proxy', 1);

// --- Configuración CORS (Sin cambios) ---
const isProduction = process.env.NODE_ENV === 'production';

const allowedOrigins = [
  'capacitor://localhost',
  'https://localhost',
  process.env.FRONTEND_URL
].filter(Boolean);

if (!isProduction) {
  allowedOrigins.push(process.env.CORS_ORIGIN || 'http://localhost:5173');
  allowedOrigins.push('http://localhost');
}

console.log("Orígenes CORS permitidos:", allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error('CORS Error: Origen no permitido:', origin);
      callback(new Error(`El origen ${origin} no está permitido por CORS`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
// --- Fin Configuración CORS ---

// --- INICIO DE LA MODIFICACIÓN: Headers para Google Auth (COOP/COEP) ---
app.use((req, res, next) => {
  // Estos encabezados son necesarios para que el Popup de Google funcione sin warnings
  // y pueda comunicarse con la ventana padre (tu app) de forma segura.
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});
// --- FIN DE LA MODIFICACIÓN ---

app.use(express.json());

const staticPath = path.join(__dirname, 'public');
app.use(express.static(staticPath));
console.log(`Sirviendo archivos estáticos desde: ${staticPath}`);

// Middleware para actualizar 'lastSeen'
app.use(async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      // Corrección: El payload del token usa 'id', no 'userId'
      if (payload && payload.id) {
        await db.User.update(
          { lastSeen: new Date() },
          { where: { id: payload.id } } // Usamos payload.id
        );
      }
    } catch (err) { /* Ignorar errores de token inválido */ }
  }
  next();
});

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/bodyweight', bodyweightRoutes);
app.use('/api/creatina', creatinaRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/exercise-list', exerciseListRoutes);
app.use('/api/meals', favoriteMealsRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/records', personalRecordsRoutes);
app.use('/api/routines', routineRoutes);
app.use('/api/template-routines', templateRoutinesRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes); // Añadimos la nueva ruta

app.use(errorHandler);

const PORT = process.env.PORT || 3001;

db.sequelize.sync()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
    
    // --- INICIO DE LA MODIFICACIÓN ---
    // Iniciar las tareas programadas (Cron Jobs)
    startCronJobs();
    // --- FIN DE LA MODIFICACIÓN ---
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });