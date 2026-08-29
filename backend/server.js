/* backend/server.js */
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
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
import gamificationRoutes from './routes/gamificationRoutes.js';
import storyRoutes from './routes/stories.js';
import squadRoutes from './routes/squads.js';
import aiRoutes from './routes/ai.js';
import trainerRoutes from './routes/trainerRoutes.js';
import chatRoutes from './routes/chat.js';
import securityRoutes from './routes/securityRoutes.js';
import { checkBlacklist } from './middleware/securityMonitor.js';
import { startCronJobs } from './services/cronService.js';

const app = express();
const httpServer = createServer(app);

app.set('trust proxy', 1);

// OPTIMIZACIÓN: Cabeceras de seguridad
app.use(helmet({ crossOriginResourcePolicy: false }));

// Middleware de Seguridad (Bloqueo de IPs)
app.use(checkBlacklist);

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
    // Si no hay origen (ej. curl, postman) o si estamos en desarrollo, permitimos más flexibilidad
    if (!origin) {
      return callback(null, true);
    }
    
    // Permitir subredes locales típicas en desarrollo (192.168.x.x, 10.x.x.x, 172.x.x.x, localhost, 127.0.0.1)
    const isLocalNetwork = !isProduction && /^http:\/\/(192\.168\.|10\.|172\.|localhost|127\.0\.0\.1)/.test(origin);
    
    if (allowedOrigins.includes(origin) || isLocalNetwork || (!isProduction && origin.includes('localhost'))) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Origen bloqueado: ${origin}`);
      callback(new Error(`El origen ${origin} no está permitido por CORS`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

const io = new Server(httpServer, {
  cors: {
    origin: corsOptions.origin,
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    console.error('Socket error: Token required for socket', socket.id);
    return next(new Error('Authentication error: Token required'));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    console.error('Socket error: Invalid token for socket', socket.id, err.message);
    return next(new Error('Authentication error: Invalid token'));
  }
});

io.engine.on("connection_error", (err) => {
  console.error("🔴 Engine.io connection error:", err.code, err.message, err.context);
});

io.on('connection', (socket) => {
  // Unimos el socket a una sala única con su ID de usuario para poder enviarle eventos directos
  const userId = socket.user?.userId || socket.user?.id;
  if (userId) {
    socket.join(userId.toString());
  }

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

// --- ARCHIVOS ESTÁTICOS (con caché para ahorrar tráfico) ---
const staticPath = path.join(__dirname, 'public');
app.use(express.static(staticPath, {
  maxAge: '7d',        // El navegador/app guarda los archivos 7 días sin volver a pedirlos
  etag: true,          // Si el archivo cambia en el servidor, se descarga la versión nueva
  lastModified: true,  // Permite al navegador verificar si el archivo fue modificado
  immutable: false     // Los archivos pueden cambiar (ej: foto de perfil actualizada)
}));

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
app.use('/api/gamification', gamificationRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/squads', squadRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/trainer', trainerRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin/security', securityRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3001;

db.sequelize.sync({ alter: true })
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`✅ Server (HTTP + Socket.io) running on port ${PORT}`);
    });
    startCronJobs();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    console.error(err.stack);
  });

export { io };
