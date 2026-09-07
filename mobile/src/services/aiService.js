/* frontend/src/services/aiService.js */
import apiClient from './apiClient';

export const askTrainerAI = async (prompt, context = '') => {
  try {
    const response = await apiClient('/ai/ask', {
      body: { prompt, context }
    });
    
    const data = response.data || response;

    // --- INICIO MODIFICACIÓN: Actualizar UI en tiempo real ---
    if (data && data.remaining !== undefined) {
      localStorage.setItem('ai_remaining_uses', data.remaining.toString());
      localStorage.setItem('ai_daily_limit', (data.limit || 5).toString());
      
      // Guardamos la fecha de la última petición usando la zona horaria correcta
      const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
      localStorage.setItem('ai_last_date', todayStr);
      
      // Disparamos un evento global para que el Sidebar y Header se enteren inmediatamente
      window.dispatchEvent(new Event('ai_limit_updated'));
    }
    // --- FIN MODIFICACIÓN ---

    return data;
  } catch (error) {
    console.error('Error en askTrainerAI:', error);
    throw error;
  }
};