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

    const today = new Date().toISOString().split('T')[0];
    
    if (user.last_ai_request_date === today) {
      if (user.ai_requests_count >= DAILY_LIMIT) {
        return res.status(429).json({ 
          error: 'Has agotado tus consultas de IA hoy. Vuelve mañana.',
          remaining: 0,
          limit: DAILY_LIMIT
        });
      }
    } else {
      user.last_ai_request_date = today;
      user.ai_requests_count = 0;
    }

    const advice = await getTrainerAdvice(prompt, context || '');

    user.ai_requests_count += 1;
    await user.save();

    return res.json({ 
      response: advice, 
      remaining: DAILY_LIMIT - user.ai_requests_count,
      limit: DAILY_LIMIT 
    });

  } catch (error) {
    console.error('Error en askAI:', error);
    res.status(500).json({ error: 'Error al consultar la IA.' });
  }
};