/* frontend/src/services/aiService.js */
import apiClient from './apiClient';

export const askTrainerAI = async (prompt, context = '') => {
  try {
    const response = await apiClient('/ai/ask', {
      body: { prompt, context }
    });
    return response.data || response;
  } catch (error) {
    console.error('Error en askTrainerAI:', error);
    throw error;
  }
};