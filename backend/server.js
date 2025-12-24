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
import twoFactorRoutes from './routes/twoFactor.js';
import sessionRoutes from './routes/sessionRoutes.js';
import socialRoutes from './routes/social.js';
// --- INICIO DE LA MODIFICACIÓN ---
import reportRoutes from './routes/reports.js';
// --- FIN DE LA MODIFICACIÓN ---
import { startCronJobs } from './services/cronService.js';

const app = express();
app.set('trust proxy', 1);

// --- Configuración CORS ---
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

// --- Headers para Google Auth ---
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

app.use(express.json());

const staticPath = path.join(__dirname, 'public');
app.use(express.static(staticPath));
console.log(`Sirviendo archivos estáticos desde: ${staticPath}`);

// --- MODIFICACIÓN: Eliminado/Comentado Middleware lastSeen global ---
// Este middleware actualizaba la fecha en cada petición (imágenes, datos, etc.),
// causando problemas de rendimiento y lógica de "primera vez del día".
// La actualización de actividad se manejará en puntos clave (login, completar entreno).
/*
app.use(async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (payload && payload.userId) {
        await db.User.update(
          { lastSeen: new Date() },
          { where: { id: payload.userId } }
        );
      }
    } catch (err) { }
  }
  next();
});
*/

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
app.use('/api/notifications', notificationRoutes);
app.use('/api/2fa', twoFactorRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/social', socialRoutes);
// --- INICIO DE LA MODIFICACIÓN ---
app.use('/api/reports', reportRoutes);
// --- FIN DE LA MODIFICACIÓN ---

app.use(errorHandler);

const PORT = process.env.PORT || 3001;

db.sequelize.sync()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
    startCronJobs();
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });