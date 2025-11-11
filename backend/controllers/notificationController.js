/* backend/controllers/notificationController.js */

// --- INICIO DE LA MODIFICACIÓN (Convertido a ESM) ---
import { body, validationResult } from 'express-validator';
import db from '../models/index.js'; // Importamos 'db'
const { PushSubscription } = db; // Obtenemos el modelo
// --- FIN DE LA MODIFICACIÓN ---


// 1. Controlador para enviar la VAPID Key pública al frontend
const getVapidKey = (req, res) => {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;

  // --- INICIO DE LA MODIFICACIÓN (Añadir Log) ---
  console.log('--- DEBUG PUSH NOTIFICATIONS ---');
  console.log('Sirviendo VAPID_PUBLIC_KEY desde process.env:');
  console.log(vapidPublicKey);
  console.log('---------------------------------');
  // --- FIN DE LA MODIFICACIÓN ---

  if (!vapidPublicKey) {
    console.error('VAPID_PUBLIC_KEY no está definida en .env');
    return res.status(500).json({ 
      message: 'Error de configuración del servidor (VAPID).' 
    });
  }

  res.status(200).json({ key: vapidPublicKey });
};

// 2. Controlador para suscribir a un usuario
const subscribe = [
  // Validación de la entrada
  body('endpoint').isURL().withMessage('Endpoint no válido.'),
  body('keys.p256dh').isString().notEmpty().withMessage('Clave p256dh requerida.'),
  body('keys.auth').isString().notEmpty().withMessage('Clave auth requerida.'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // El ID del usuario viene del middleware 'authenticateToken'
    const userId = req.user.id;
    const { endpoint, keys } = req.body;
    const subscriptionObject = { endpoint, keys };

    try {
      // Usamos findOrCreate para evitar duplicados
      const [subscription, created] = await PushSubscription.findOrCreate({
        where: { endpoint: subscriptionObject.endpoint },
        defaults: {
          userId: userId,
          keys: subscriptionObject.keys,
        }
      });

      if (!created) {
        subscription.userId = userId;
        await subscription.save();
      }
      
      console.log(`[Push] Suscripción ${created ? 'creada' : 'actualizada'} para el usuario ${userId}`);

      res.status(201).json({ message: 'Suscripción guardada.' });

    } catch (error) {
      console.error('Error al guardar la suscripción push:', error);
      res.status(500).json({ message: 'Error al procesar la suscripción.' });
    }
  }
];

// 3. Controlador para desuscribir a un usuario
const unsubscribe = [
  // Validación de la entrada
  // --- INICIO DE LA MODIFICACIÓN (Cambiado body a endpoint) ---
  // El frontend envía un body JSON con { endpoint: "..." }
  body('endpoint').isURL().withMessage('Endpoint no válido.'),
  // --- FIN DE LA MODIFICACIÓN ---

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    // --- INICIO DE LA MODIFICACIÓN ---
    const { endpoint } = req.body; // Extraemos el endpoint del body
    // --- FIN DE LA MODIFICACIÓN ---

    try {
      // Buscamos y destruimos la suscripción
      const result = await PushSubscription.destroy({
        where: {
          // --- INICIO DE LA MODIFICACIÓN ---
          endpoint: endpoint, // Usamos el endpoint del body
          // --- FIN DE LA MODIFICACIÓN ---
          userId: userId, // Aseguramos que el usuario solo borre sus propias suscripciones
        }
      });

      if (result === 0) {
        console.warn(`[Push] Intento de borrado fallido (no encontrada) para endpoint: ...${String(endpoint).slice(-20)}`);
      } else {
        console.log(`[Push] Suscripción eliminada para el usuario ${userId}`);
      }
      
      res.status(200).json({ message: 'Suscripción eliminada.' });

    } catch (error) {
      console.error('Error al eliminar la suscripción push:', error);
      res.status(500).json({ message: 'Error al procesar la desuscripción.' });
    }
  }
];

// --- INICIO DE LA MODIFICACIÓN (Convertido a ESM) ---
export default {
  getVapidKey,
  subscribe,
  unsubscribe,
};
// --- FIN DE LA MODIFICACIÓN ---