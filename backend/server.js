/* backend/server.js */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http'; // Necesario para unir Express + Socket.io
import { Server } from 'socket.io';  // Servidor de WebSockets
import jwt from 'jsonwebtoken';      // Para autenticar conexiones socket
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
import { startCronJobs } from './services/cronService.js';

const app = express();
const httpServer = createServer(app); // Envolvemos Express en un servidor HTTP

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
    origin: allowedOrigins, // Reutilizamos los orígenes permitidos
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware de autenticación para Socket.io (Seguridad)
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: Token required'));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // Adjuntamos usuario al socket
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid token'));
  }
});

// Gestión de conexiones
io.on('connection', (socket) => {
  // console.log(`🔌 Cliente conectado: ${socket.user.userId} (${socket.id})`);
  
  socket.on('disconnect', () => {
    // console.log(`🔌 Cliente desconectado: ${socket.id}`);
  });
});

// Hacemos 'io' accesible en toda la aplicación (Controladores)
app.set('io', io);

// Headers para Google Auth y Seguridad de Imágenes
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

app.use(express.json());

// --- ARCHIVOS ESTÁTICOS ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
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

app.use(errorHandler);

const PORT = process.env.PORT || 3001;

db.sequelize.sync()
  .then(() => {
    // CAMBIO IMPORTANTE: Usamos httpServer.listen en lugar de app.listen
    httpServer.listen(PORT, () => {
      console.log(`✅ Server (HTTP + Socket.io) is running on port ${PORT}`);
      console.log(`📂 Uploads folder serving at: http://localhost:${PORT}/uploads`);
    });
    startCronJobs();
  })
  .catch(err => {
    console.error('❌ Unable to connect to the database:', err);
  });