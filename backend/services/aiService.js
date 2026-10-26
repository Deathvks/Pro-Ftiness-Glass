/* backend/services/aiService.js */
import { GoogleGenerativeAI } from '@google/generative-ai';

// Modelos Gemini configurados por rol:
// - Administradores y redacción/adaptación: Gemini 3.5 Flash (máxima calidad)
// - Usuarios regulares y fallback de resiliencia: Gemini 3.5 Flash Lite (500 RPD, 15 RPM)
export const MODEL_ADMIN = 'gemini-3.5-flash';
export const MODEL_USER = 'gemini-3.5-flash-lite';

// Función para obtener la instancia del cliente con la clave del entorno activa
const getGenAI = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY no configurada en las variables de entorno.');
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

// Límites de seguridad para usuarios regulares (por debajo del límite de 500 RPD / 15 RPM de Gemini 3.5 Flash Lite)
const LIMITS = { RPM: 15, RPD: 450, TPM: 250000 };

// Estado actual (se reinicia si el servidor se reinicia)
let usage = { reqMinute: 0, reqDay: 0, tokensMinute: 0 };
let lastMinute = Date.now();
let lastDay = Date.now();

const checkAndIterateLimits = (estimatedTokens, isAdmin = false) => {
  if (isAdmin) {
    // El administrador tiene acceso prioritario sin bloqueo por cuota de usuario
    return;
  }

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

/**
 * Ejecutor con fallback automático:
 * Intenta con preferredModel (ej. Gemini 3.5 Flash). Si Google devuelve 429 (cuota), 503 (alta demanda) o error temporal,
 * conmuta transparentemente a fallbackModel (Gemini 3.5 Flash Lite) para garantizar que la petición nunca falle.
 */
export const executeWithModelFallback = async ({ preferredModel, fallbackModel = MODEL_USER, getModel, generateFn }) => {
  try {
    const model = getModel(preferredModel);
    return await generateFn(model, preferredModel);
  } catch (error) {
    const errorMsg = error?.message || '';
    const isOverloadedOrRateLimited =
      preferredModel !== fallbackModel &&
      (errorMsg.includes('429') ||
       errorMsg.includes('503') ||
       errorMsg.includes('quota') ||
       errorMsg.includes('high demand') ||
       errorMsg.includes('RESOURCE_EXHAUSTED') ||
       errorMsg.includes('UNAVAILABLE') ||
       errorMsg.includes('Service Unavailable'));

    if (isOverloadedOrRateLimited) {
      console.warn(`[AI Service] Modelo ${preferredModel} ocupado o con límite (${errorMsg.substring(0, 90)}...). Activando fallback automático a ${fallbackModel}...`);
      const fallback = getModel(fallbackModel);
      return await generateFn(fallback, fallbackModel);
    }
    throw error;
  }
};

export const getTrainerAdvice = async (prompt, userContext = '', options = {}) => {
  const isAdmin = !!options.isAdmin;
  const preferredModel = isAdmin ? MODEL_ADMIN : MODEL_USER;

  try {
    const genAI = getGenAI();
    const systemPrompt = `Eres un entrenador personal y nutricionista experto de Pro Fitness Glass. 
    Da respuestas directas, motivadoras, cortas y útiles. 
    Contexto del usuario: ${userContext}`;

    // Estimación rápida de tokens (1 token ≈ 4 caracteres)
    const estimatedTokens = Math.ceil((systemPrompt.length + prompt.length) / 4);
    checkAndIterateLimits(estimatedTokens, isAdmin);

    return await executeWithModelFallback({
      preferredModel,
      fallbackModel: MODEL_USER,
      getModel: (modelName) => genAI.getGenerativeModel({ model: modelName }),
      generateFn: async (model) => {
        const result = await model.generateContent([
          { text: systemPrompt },
          { text: prompt }
        ]);
        return result.response.text();
      }
    });
  } catch (error) {
    console.error(`Error AI Service (${preferredModel}):`, error);
    if (error.message.includes('Límite de IA alcanzado')) throw error;
    throw new Error('El Entrenador IA no está disponible en este momento.');
  }
};

export const analyzeFoodImage = async (base64Data, mimeType, options = {}) => {
  const isAdmin = !!options.isAdmin;
  const preferredModel = isAdmin ? MODEL_ADMIN : MODEL_USER;

  try {
    const genAI = getGenAI();
    const systemPrompt = `Eres un experto en nutrición y reconocimiento de alimentos de Pro Fitness Glass.
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
    checkAndIterateLimits(500, isAdmin);

    return await executeWithModelFallback({
      preferredModel,
      fallbackModel: MODEL_USER,
      getModel: (modelName) => genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json"
        }
      }),
      generateFn: async (model) => {
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
          ]
        });

        const textResponse = result.response.text();
        return JSON.parse(textResponse);
      }
    });
  } catch (error) {
    console.error(`Error AI Scanner (${preferredModel}):`, error);
    if (error.message.includes('Límite de IA alcanzado')) throw error;
    throw new Error('No se pudo analizar la imagen. La IA no está disponible o hubo un error.');
  }
};
