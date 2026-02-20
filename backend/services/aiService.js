/* backend/services/aiService.js */
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Límites de seguridad (por debajo del límite real para evitar cobros)
const LIMITS = { RPM: 8, RPD: 200, TPM: 200000 };

// Estado actual (se reinicia si el servidor se reinicia)
let usage = { reqMinute: 0, reqDay: 0, tokensMinute: 0 };
let lastMinute = Date.now();
let lastDay = Date.now();

const checkAndIterateLimits = (estimatedTokens) => {
  const now = Date.now();
  
  // Reinicios de tiempo
  if (now - lastMinute > 60000) { usage.reqMinute = 0; usage.tokensMinute = 0; lastMinute = now; }
  if (now - lastDay > 86400000) { usage.reqDay = 0; lastDay = now; }

  // Comprobación
  if (
    usage.reqMinute >= LIMITS.RPM || 
    usage.reqDay >= LIMITS.RPD || 
    (usage.tokensMinute + estimatedTokens) > LIMITS.TPM
  ) {
    throw new Error('Límite de IA alcanzado por seguridad (gratuito). Intenta más tarde.');
  }

  // Sumar uso
  usage.reqMinute++;
  usage.reqDay++;
  usage.tokensMinute += estimatedTokens;
};

export const getTrainerAdvice = async (prompt, userContext = '') => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const systemPrompt = `Eres un entrenador personal y nutricionista experto. 
    Da respuestas directas, motivadoras, cortas y útiles. 
    Contexto del usuario: ${userContext}`;

    // Estimación rápida de tokens (1 token ≈ 4 caracteres) para no hacer peticiones extra
    const estimatedTokens = Math.ceil((systemPrompt.length + prompt.length) / 4);
    checkAndIterateLimits(estimatedTokens);

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: prompt }
    ]);

    return result.response.text();
  } catch (error) {
    console.error('Error AI Service:', error);
    // Si es nuestro error personalizado, lo devolvemos tal cual
    if (error.message.includes('Límite de IA alcanzado')) throw error;
    throw new Error('El Entrenador IA no está disponible en este momento.');
  }
};