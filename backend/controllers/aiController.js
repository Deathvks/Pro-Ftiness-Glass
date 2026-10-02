/* backend/controllers/aiController.js */
import User from '../models/userModel.js';
import { getTrainerAdvice } from '../services/aiService.js';

const DAILY_LIMIT = 5;

export const askAI = async (req, res) => {
  try {
    const { prompt, context } = req.body;
    
    // CORRECCIÓN: Dependiendo de cómo se firme el JWT, puede ser id o userId
    const userId = req.user?.id || req.user?.userId; 

    if (!prompt) return res.status(400).json({ error: 'El prompt es requerido.' });
    if (!userId) return res.status(401).json({ error: 'Token inválido o sin ID.' });

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    // Extraer la fecha de hoy basándonos de forma estricta en la zona horaria del usuario
    const tz = user.timezone || 'Europe/Madrid';
    const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: tz }); // Formato YYYY-MM-DD
    
    // Manejar correctamente el formato de fecha que devuelve la base de datos
    let lastReqDateStr = user.last_ai_request_date;
    if (lastReqDateStr instanceof Date) {
        lastReqDateStr = lastReqDateStr.toISOString().split('T')[0];
    } else if (typeof lastReqDateStr === 'string') {
        lastReqDateStr = lastReqDateStr.split('T')[0];
    }

    // Comprobar límite diario
    if (lastReqDateStr === todayStr) {
      if (user.ai_requests_count >= DAILY_LIMIT) {
        return res.status(429).json({ 
          error: 'Has agotado tus consultas de IA hoy. Vuelve mañana.',
          remaining: 0,
          limit: DAILY_LIMIT
        });
      }
    } else {
      // Si la fecha no coincide (es un día nuevo), reseteamos la fecha y el contador
      user.last_ai_request_date = todayStr;
      user.ai_requests_count = 0;
    }

    const advice = await getTrainerAdvice(prompt, context || '');

    // Verificamos si la respuesta de la IA es un rechazo por prompt inválido
    let isErrorResponse = false;
    try {
        const jsonString = advice.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(jsonString);
        if (parsed.isValid === false || parsed.error) {
            isErrorResponse = true;
        }
    } catch (e) {
        // No es JSON válido, asumimos que es respuesta normal
    }

    // Siempre incrementamos el uso, ya que la petición a la IA se realizó
    user.ai_requests_count += 1;
    await user.save();

    if (!isErrorResponse) {
        // Gamification: Solo damos XP/avances de retos si fue un éxito
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
      remaining: DAILY_LIMIT - user.ai_requests_count,
      limit: DAILY_LIMIT 
    });

  } catch (error) {
    console.error('Error en askAI:', error);
    if (error.message && error.message.includes('Límite de IA alcanzado')) {
        return res.status(503).json({ error: 'El servidor de IA está saturado temporalmente.' });
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

    const { analyzeFoodImage } = await import('../services/aiService.js');
    const foodData = await analyzeFoodImage(imageBase64, mimeType);


    return res.json({ success: true, data: foodData });
  } catch (error) {
    console.error('Error en scanFood:', error);
    if (error.message && error.message.includes('Límite')) {
        return res.status(503).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error al escanear la imagen con IA.' });
  }
};