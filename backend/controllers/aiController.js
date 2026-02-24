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

    // Incrementamos el uso
    user.ai_requests_count += 1;
    await user.save();

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