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

export const analyzeFoodImage = async (base64Data, mimeType) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const systemPrompt = `Eres un experto en nutrición y reconocimiento de alimentos.
Tu tarea es analizar la imagen proporcionada y estimar los macronutrientes (proteínas, carbohidratos, grasas) y calorías totales.
Debes devolver la respuesta estrictamente en formato JSON, sin texto adicional, usando la siguiente estructura:
{
  "name": "Nombre descriptivo del plato o alimento principal",
  "calories": 450,
  "protein": 30,
  "carbs": 40,
  "fat": 15,
  "description": "Breve descripción de los ingredientes detectados (ej. pechuga de pollo a la plancha con arroz y ensalada)."
}
Haz una estimación razonable para una "ración normal" si no hay referencias de tamaño exactas.`;

    // Asumimos ~500 tokens para la imagen
    checkAndIterateLimits(500);

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: systemPrompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const textResponse = result.response.text();
    return JSON.parse(textResponse);
  } catch (error) {
    console.error('Error AI Scanner:', error);
    if (error.message.includes('Límite de IA alcanzado')) throw error;
    throw new Error('No se pudo analizar la imagen. La IA no está disponible o hubo un error.');
  }
};