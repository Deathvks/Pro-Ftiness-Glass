/* backend/controllers/notificationController.js */

// --- INICIO DE LA MODIFICACIÓN (Convertido a ESM) ---
import { body, validationResult } from 'express-validator';
import db from '../models/index.js'; 
// Accedemos de forma segura por si db no se ha cargado bien
const PushSubscription = db && db.PushSubscription; 
// --- FIN DE LA MODIFICACIÓN ---


// 1. Controlador para enviar la VAPID Key pública al frontend
const getVapidKey = (req, res) => {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;

  console.log('--- DEBUG PUSH NOTIFICATIONS ---');
  console.log('Sirviendo VAPID_PUBLIC_KEY...');

  if (!vapidPublicKey) {
    console.error('VAPID_PUBLIC_KEY no está definida en .env');
    return res.status(500).json({ 
      error: 'Error de configuración del servidor (VAPID).' 
    });
  }

  res.status(200).json({ key: vapidPublicKey });
};

// 2. Controlador para suscribir a un usuario
const subscribe = [
  body('endpoint').isURL().withMessage('Endpoint no válido.'),
  body('keys.p256dh').isString().notEmpty().withMessage('Clave p256dh requerida.'),
  body('keys.auth').isString().notEmpty().withMessage('Clave auth requerida.'),

  async (req, res) => {
    // 0. Validaciones básicas
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // 1. Verificar que el modelo existe (Debug de importación)
    if (!PushSubscription) {
        console.error('[Push] ERROR CRÍTICO: El modelo PushSubscription es undefined. Revisa models/index.js');
        return res.status(500).json({ error: 'Error interno: El servidor no pudo cargar el modelo de suscripción.' });
    }

    try {
        // 2. Verificar usuario
        // --- CORRECCIÓN: Usar req.user.userId en lugar de req.user.id ---
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ error: 'Usuario no autenticado.' });
        }

        const userId = req.user.userId; // Usar userId del token
        const { endpoint, keys } = req.body;
        
        console.log(`[Push] Procesando suscripción para usuario ${userId}...`);

        // 3. Lógica simplificada: Buscar primero, luego crear o actualizar
        let subscription = await PushSubscription.findOne({ 
            where: { endpoint: endpoint } 
        });

        if (subscription) {
            console.log('[Push] La suscripción ya existe. Actualizando usuario y claves...');
            subscription.userId = userId;
            subscription.keys = keys;
            await subscription.save();
        } else {
            console.log('[Push] Creando nueva suscripción...');
            await PushSubscription.create({
                userId: userId,
                endpoint: endpoint,
                keys: keys
            });
        }
      
        console.log('[Push] Guardado exitoso. Enviando respuesta OK.');
        return res.status(201).json({ message: 'Suscripción guardada correctamente.' });

    } catch (error) {
        console.error('[Push] EXCEPCIÓN en subscribe:', error);
        const msg = error.message || 'Error desconocido';
        return res.status(500).json({ error: `Error del servidor al guardar: ${msg}` });
    }
  }
];

// 3. Controlador para desuscribir a un usuario
const unsubscribe = [
  body('endpoint').isURL().withMessage('Endpoint no válido.'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verificar modelo
    if (!PushSubscription) {
        return res.status(500).json({ error: 'Error interno: Modelo PushSubscription no cargado.' });
    }

    try {
        // --- CORRECCIÓN: Usar req.user.userId en lugar de req.user.id ---
        if (!req.user || !req.user.userId) {
             return res.status(401).json({ error: 'Usuario no autenticado.' });
        }

        const userId = req.user.userId; // Usar userId del token
        const { endpoint } = req.body; 

        console.log(`[Push] Intentando eliminar suscripción para user ${userId}...`);

        // Borrado directo
        const result = await PushSubscription.destroy({
            where: {
                endpoint: endpoint,
                userId: userId, 
            }
        });

        if (result === 0) {
            console.warn(`[Push] No se encontró suscripción para borrar.`);
        } else {
            console.log(`[Push] Suscripción eliminada correctamente.`);
        }
      
        return res.status(200).json({ message: 'Suscripción eliminada.' });

    } catch (error) {
        console.error('[Push] EXCEPCIÓN en unsubscribe:', error);
        const msg = error.message || 'Error desconocido';
        return res.status(500).json({ error: `Error al desuscribir: ${msg}` });
    }
  }
];

export default {
  getVapidKey,
  subscribe,
  unsubscribe,
};