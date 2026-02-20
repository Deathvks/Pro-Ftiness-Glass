/* backend/server.js */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression'; // OPTIMIZACIÓN: Ahorro de ancho de banda (Gzip)
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import db from './models/index.js';
import errorHandler from './middleware/errorHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from './routes/auth.js';
import bodyweightRoutes from './routes/bodyweight.js';
import bodyMeasurementRoutes from './routes/bodyMeasurements.js';
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
import reportRoutes from './routes/reports.js';
import storyRoutes from './routes/stories.js';
import squadRoutes from './routes/squads.js';
import aiRoutes from './routes/ai.js'; // Nueva ruta IA importada
import { startCronJobs } from './services/cronService.js';

const app = express();
const httpServer = createServer(app);

app.set('trust proxy', 1);

// OPTIMIZACIÓN: Compresión global antes de cualquier ruta o archivo estático
app.use(compression());

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

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`El origen ${origin} no está permitido por CORS`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// --- INICIALIZACIÓN SOCKET.IO ---
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error: Token required'));
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket) => {
  socket.on('disconnect', () => {});
});

app.set('io', io);

// Headers de seguridad
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

app.use(express.json());

// --- ARCHIVOS ESTÁTICOS ---
const staticPath = path.join(__dirname, 'public');
app.use(express.static(staticPath));

// --- Rutas API ---
app.use('/api/auth', authRoutes);
app.use('/api/bodyweight', bodyweightRoutes);
app.use('/api/measurements', bodyMeasurementRoutes);
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
app.use('/api/reports', reportRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/squads', squadRoutes);
app.use('/api/ai', aiRoutes); // Nueva ruta IA registrada

app.use(errorHandler);

const PORT = process.env.PORT || 3001;

db.sequelize.sync()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`✅ Server (HTTP + Socket.io) running on port ${PORT}`);
    });
    startCronJobs();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err);
  });