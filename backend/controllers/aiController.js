/* backend/controllers/aiController.js */
import User from '../models/userModel.js';
import { getTrainerAdvice } from '../services/aiService.js';

const DAILY_LIMIT = 5;

export const askAI = async (req, res) => {
  try {
    const { prompt, context } = req.body;
    
    // Dependiendo de cómo se firme el JWT, puede ser id o userId
    const userId = req.user?.id || req.user?.userId; 

    if (!prompt) return res.status(400).json({ error: 'El prompt es requerido.' });
    if (!userId) return res.status(401).json({ error: 'Token inválido o sin ID.' });

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const isAdmin = req.user?.role === 'admin' || user.role === 'admin';

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

    // Llamada con modelo adaptativo: Gemini 3.5 Flash para admin, Gemini 3.5 Flash Lite para usuarios
    const advice = await getTrainerAdvice(prompt, context || '', { isAdmin });

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
        return res.status(503).json({ error: 'El servidor de IA está temporalmente saturado. Por favor intenta en unos minutos.' });
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

    const { analyzeFoodImage } = await import('../services/aiService.js');
    const foodData = await analyzeFoodImage(imageBase64, mimeType, { isAdmin });

    return res.json({ success: true, data: foodData, isAdmin });
  } catch (error) {
    console.error('Error en scanFood:', error);
    if (error.message && error.message.includes('Límite')) {
        return res.status(503).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error al escanear la imagen con IA.' });
  }
};
