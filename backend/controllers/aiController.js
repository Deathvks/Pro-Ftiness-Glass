/* backend/controllers/aiController.js */
import User from '../models/userModel.js';
import { getTrainerAdvice } from '../services/aiService.js';

const DAILY_LIMIT = 5;

// Cooldown anti-spam por usuario: impide que un usuario consuma sus 5 preguntas en ráfaga (máximo 2 consultas por minuto por usuario)
const userLastRequestTimes = new Map();
const USER_COOLDOWN_MS = 30000; // 30 segundos de espera entre preguntas sucesivas
const FOOD_COOLDOWN_MS = 15000; // 15 segundos entre escaneos de alimentos
const MAX_PROMPT_LENGTH = 15000; // Máximo para prevenir abusos de tokens

const cleanupOldCooldowns = () => {
  if (userLastRequestTimes.size > 2000) {
    const threshold = Date.now() - 60000;
    for (const [key, timestamp] of userLastRequestTimes.entries()) {
      if (timestamp < threshold) userLastRequestTimes.delete(key);
    }
  }
};

export const askAI = async (req, res) => {
  try {
    const { prompt, context } = req.body;
    
    // Dependiendo de cómo se firme el JWT, puede ser id o userId
    const userId = req.user?.id || req.user?.userId; 

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'El prompt es requerido.' });
    }
    if (!userId) return res.status(401).json({ error: 'Token inválido o sin ID.' });

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const isAdmin = req.user?.role === 'admin' || user.role === 'admin';

    // 1. Filtro de longitud de prompt (evita que se peguen textos gigantescos que agoten tokens)
    if (prompt.trim().length < 3) {
      return res.status(400).json({ error: 'La pregunta es demasiado corta. Sé un poco más específico con tu duda.' });
    }
    if (prompt.length > MAX_PROMPT_LENGTH && !isAdmin) {
      return res.status(400).json({ error: 'La consulta es demasiado larga. Por favor sé más conciso con tu duda.' });
    }

    // 2. Cooldown anti-ráfaga por usuario (exento para admin)
    // Garantiza que ningún usuario lance 5 preguntas en 5 segundos y sature las 15 RPM
    if (!isAdmin) {
      const now = Date.now();
      const lastRequestTime = userLastRequestTimes.get(`ask_${userId}`) || 0;
      const elapsed = now - lastRequestTime;
      if (elapsed < USER_COOLDOWN_MS) {
        const waitSeconds = Math.ceil((USER_COOLDOWN_MS - elapsed) / 1000);
        return res.status(429).json({ 
          error: `Por favor espera ${waitSeconds} segundo${waitSeconds > 1 ? 's' : ''} antes de realizar otra consulta a la IA para que el entrenador procese tu respuesta.`,
          retryAfter: waitSeconds
        });
      }
    }

    // Extraer la fecha de hoy basándonos de forma estricta en la zona horaria del usuario
    const tz = user.timezone || 'Europe/Madrid';
    const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: tz }); // Formato YYYY-MM-DD
    
    let lastReqDateStr = user.last_ai_request_date;
    if (lastReqDateStr instanceof Date) {
        lastReqDateStr = lastReqDateStr.toISOString().split('T')[0];
    } else if (typeof lastReqDateStr === 'string') {
        lastReqDateStr = lastReqDateStr.split('T')[0];
    }

    // Comprobar límite diario (exento para administradores)
    if (!isAdmin) {
      if (lastReqDateStr === todayStr) {
        if (user.ai_requests_count >= DAILY_LIMIT) {
          return res.status(429).json({ 
            error: 'Has agotado tus consultas de IA hoy. Vuelve mañana.',
            remaining: 0,
            limit: DAILY_LIMIT
          });
        }
      } else {
        // Día nuevo: reiniciamos contador
        user.last_ai_request_date = todayStr;
        user.ai_requests_count = 0;
      }
    }

    // Llamada con modelo adaptativo: Gemini 3.6 Flash para admin, Gemini 3.5 Flash Lite para usuarios
    const advice = await getTrainerAdvice(prompt, context || '', { isAdmin });

    // Registramos la marca de tiempo de este usuario para activar su cooldown de 10s
    if (!isAdmin) {
      userLastRequestTimes.set(`ask_${userId}`, Date.now());
      cleanupOldCooldowns();
    }

    // Verificamos si la respuesta de la IA es un rechazo por prompt inválido
    let isErrorResponse = false;
    try {
        const jsonString = advice.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(jsonString);
        if (parsed.isValid === false || parsed.error) {
            isErrorResponse = true;
        }
    } catch (e) {
        // No es JSON válido, respuesta normal de texto
    }

    // Incrementamos el contador para usuarios no admin
    if (!isAdmin) {
      user.ai_requests_count += 1;
      await user.save();
    }

    if (!isErrorResponse) {
        // Gamification: Solo otorgamos XP/retos si la petición fue válida
        try {
            const { trackChallenge } = await import('../services/challengeService.js');
            await trackChallenge(userId, 'ai_ask_query', 1);
            if (prompt.toLowerCase().includes('rutina')) {
                await trackChallenge(userId, 'ai_create_routine', 1);
            }
            if (prompt.toLowerCase().includes('ejercicio') || prompt.toLowerCase().includes('explica')) {
                await trackChallenge(userId, 'ai_explain_exercise', 1);
            }
        } catch (err) {}
    }

    return res.json({ 
      response: advice, 
      remaining: isAdmin ? 999 : Math.max(0, DAILY_LIMIT - user.ai_requests_count),
      limit: isAdmin ? 999 : DAILY_LIMIT,
      isAdmin
    });

  } catch (error) {
    console.error('Error en askAI:', error);
    if (error.message && error.message.includes('Límite de IA alcanzado')) {
        return res.status(503).json({ error: 'El entrenador IA está atendiendo a varios alumnos en este momento. Por favor espera unos segundos y vuelve a intentarlo.' });
    }
    res.status(500).json({ error: 'Error al consultar la IA.' });
  }
};

export const scanFood = async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    const userId = req.user?.id || req.user?.userId;

    if (!imageBase64 || !mimeType) {
      return res.status(400).json({ error: 'Se requiere una imagen en base64 y su mimeType.' });
    }
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado.' });
    }

    let isAdmin = req.user?.role === 'admin';
    if (!isAdmin) {
      const user = await User.findByPk(userId, { attributes: ['id', 'role'] });
      if (user?.role === 'admin') isAdmin = true;
    }

    // Cooldown para escáner de fotos (8 segundos entre fotos)
    if (!isAdmin) {
      const now = Date.now();
      const lastFoodTime = userLastRequestTimes.get(`food_${userId}`) || 0;
      const elapsed = now - lastFoodTime;
      if (elapsed < FOOD_COOLDOWN_MS) {
        const waitSeconds = Math.ceil((FOOD_COOLDOWN_MS - elapsed) / 1000);
        return res.status(429).json({
          error: `Espera ${waitSeconds} segundo(s) antes de escanear otro plato.`,
          retryAfter: waitSeconds
        });
      }
    }

    const { analyzeFoodImage } = await import('../services/aiService.js');
    const foodData = await analyzeFoodImage(imageBase64, mimeType, { isAdmin });

    if (!isAdmin) {
      userLastRequestTimes.set(`food_${userId}`, Date.now());
      cleanupOldCooldowns();
    }

    return res.json({ success: true, data: foodData, isAdmin });
  } catch (error) {
    console.error('Error en scanFood:', error);
    if (error.message && error.message.includes('Límite')) {
        return res.status(503).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error al escanear la imagen con IA.' });
  }
};
