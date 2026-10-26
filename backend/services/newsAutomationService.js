import { sanitizeNewsContent } from '../utils/newsSanitizer.js';
/* backend/services/newsAutomationService.js */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import models from '../models/index.js';
import { invalidateNewsCache } from '../controllers/newsController.js';
import { io } from '../server.js';

const { News } = models;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATE_FILE_PATH = path.resolve(__dirname, '../data/news_automation_state.json');

// Catálogo ampliado de imágenes curadas en alta resolución por categoría y temática
const CATEGORY_IMAGE_POOLS = {
  'Entrenamiento': [
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1200&q=80'
  ],
  'Nutrición': [
    'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1494390248081-4e521a5940db?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=1200&q=80'
  ],
  'Suplementación': [
    'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1579722820308-d74e571900a9?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1550572017-edd951aa8f72?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1577401239170-897942555fb3?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=1200&q=80'
  ],
  'Salud': [
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1447452001602-7090c7ab2db3?auto=format&fit=crop&w=1200&q=80'
  ],
  'Novedades': [
    'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1576243345690-4e4b79b63288?auto=format&fit=crop&w=1200&q=80'
  ],
  'Descanso y Sueño': [
    'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1520206183501-b80df61043c2?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1511295742362-92c96b124e52?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1455642305367-68834a1da7ab?auto=format&fit=crop&w=1200&q=80'
  ],
  'Biohacking': [
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=80'
  ],
  'Biomecánica': [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1200&q=80'
  ],
  'Longevidad': [
    'https://images.unsplash.com/photo-1447452001602-7090c7ab2db3?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80'
  ],
  'Psicología Deportiva': [
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80'
  ],
  'Cardio y Resistencia': [
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1486218119243-13883505764c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=1200&q=80'
  ]
};


// Banco SEO de consultas reales de gimnasio con alto volumen de búsqueda en España y Latinoamérica (Long-Tail SEO)
const HIGH_INTENT_GYM_SEARCH_TOPICS = [
  'Rutina Push Pull Legs (Empuje, Tirón, Pierna) de 3 y 6 días: estructura exacta y series para hipertrofia',
  'Rutina Torso Pierna 4 días en el gimnasio: cómo distribuir ejercicios para ganar masa muscular y fuerza',
  'Cómo subir tu 1RM en Press de Banca sin dolor de hombro: retracción escapular, leg drive y progresión',
  'Cuántas series por grupo muscular a la semana necesitas realmente para hipertrofia según la ciencia',
  'Sentadilla Búlgara en el gimnasio: cómo colocar el pie y el torso para enfocar glúteo vs cuádriceps',
  'Mejores ejercicios de espalda en gimnasio para amplitud dorsal (forma en V) vs densidad muscular',
  'Volumen limpio o definición: qué hacer primero si eres principiante con grasa abdominal (recomposición corporal)',
  'Elevaciones laterales con mancuernas vs polea baja: biomecánica para construir hombros 3D',
  'Qué es el RIR y el RPE en el gimnasio: a cuántas repeticiones del fallo entrenar en cada ejercicio',
  'Peso Muerto Rumano vs Peso Muerto Convencional: cuál elegir para hipertrofiar isquiosurales y glúteos',
  'Press Inclinado con mancuernas a 30 grados vs Press Plano: cómo llenar el pecho superior (haz clavicular)',
  'Cómo estructurar una dieta de volumen limpio de 2500 a 3000 kcal sin ganar grasa excesiva',
  'Dominadas pronas vs Jalón al pecho: diferencias reales de activación dorsal y cómo progresar en lastre',
  'Hip Thrust con barra vs Prensa de piernas: cómo combinarlos para maximizar el desarrollo del glúteo',
  'Tríceps gigantes en el gimnasio: por qué necesitas entrenar la cabeza larga con extensiones trasnuca (overhead)'
];

const DEFAULT_POOL = [
  'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=1200&q=80'
];

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

/**
 * Calcula la próxima fecha de ejecución diaria (por defecto a las 09:00 hora de Madrid / España)
 */
const calculateNextRun = (targetHour = 9, targetMinute = 0) => {
  const now = new Date();
  const next = new Date(now);
  next.setHours(targetHour, targetMinute, 0, 0);

  if (now.getTime() >= next.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next.toISOString();
};

class NewsAutomationService {
  constructor() {
    this.status = 'idle'; // 'idle' | 'generating' | 'completed' | 'error'
    this.currentStep = 'En espera de la próxima ejecución programada';
    this.scheduledHour = 9;
    this.scheduledMinute = 0;
    this.nextRunAt = calculateNextRun(this.scheduledHour, this.scheduledMinute);
    this.lastRunAt = null;
    this.logs = [];
    this.lastResult = null;
    this.history = [];
    this.isGenerating = false;

    this.loadPersistedState();

    // Hidratar historial y último resultado directamente desde la BD en el arranque
    this.ensureHydrated().catch((err) => {
      console.warn('[NewsAutomation] Error hidratando desde base de datos:', err.message);
    });

    // Auto-sanear portadas duplicadas existentes en base de datos al iniciar el servicio
    setTimeout(() => {
      this.ensureUniqueCovers().catch((err) => {
        console.warn('[NewsAutomation] Error asegurando portadas únicas:', err.message);
      });
    }, 4000);
  }

  async ensureHydrated() {
    if (this.history && this.history.length > 0 && this.lastResult) {
      return;
    }
    try {
      const recentNews = await News.findAll({
        order: [['published_at', 'DESC'], ['id', 'DESC']],
        limit: 10,
        attributes: ['id', 'title', 'slug', 'category', 'image_url', 'published_at', 'createdAt']
      });

      if (recentNews && recentNews.length > 0) {
        if (!this.history || this.history.length === 0) {
          this.history = recentNews.map((n) => ({
            id: n.id,
            title: n.title,
            slug: n.slug,
            category: n.category,
            image_url: n.image_url,
            createdAt: n.published_at || n.createdAt,
            durationSeconds: null
          }));
        }

        if (!this.lastResult) {
          const latest = recentNews[0];
          this.lastResult = {
            success: true,
            articleId: latest.id,
            articleTitle: latest.title,
            articleSlug: latest.slug,
            category: latest.category,
            image_url: latest.image_url,
            completedAt: latest.published_at || latest.createdAt,
            durationSeconds: null
          };
          if (!this.lastRunAt && (latest.published_at || latest.createdAt)) {
            this.lastRunAt = new Date(latest.published_at || latest.createdAt).toISOString();
          }
        }
      }
    } catch (e) {
      console.warn('[NewsAutomation] Error hidratando historial desde BD:', e.message);
    }
  }

  loadPersistedState() {
    try {
      if (fs.existsSync(STATE_FILE_PATH)) {
        const raw = fs.readFileSync(STATE_FILE_PATH, 'utf8');
        const data = JSON.parse(raw);
        if (data) {
          this.scheduledHour = data.scheduledHour ?? 9;
          this.scheduledMinute = data.scheduledMinute ?? 0;
          this.nextRunAt = data.nextRunAt || calculateNextRun(this.scheduledHour, this.scheduledMinute);
          this.lastRunAt = data.lastRunAt || null;
          this.lastResult = data.lastResult || null;
          this.history = Array.isArray(data.history) ? data.history.slice(0, 15) : [];
          this.logs = Array.isArray(data.logs) ? data.logs.slice(-30) : [];
          if (data.status && data.status !== 'generating') {
            this.status = data.status;
          }
        }
      }
    } catch (e) {
      console.warn('[NewsAutomation] Error cargando estado persistido:', e.message);
    }

    if (!this.nextRunAt || new Date(this.nextRunAt).getTime() < Date.now() - 60000) {
      this.nextRunAt = calculateNextRun(this.scheduledHour, this.scheduledMinute);
    }
  }

  savePersistedState() {
    try {
      const dataDir = path.dirname(STATE_FILE_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const data = {
        status: this.status,
        scheduledHour: this.scheduledHour,
        scheduledMinute: this.scheduledMinute,
        nextRunAt: this.nextRunAt,
        lastRunAt: this.lastRunAt,
        lastResult: this.lastResult,
        history: this.history.slice(0, 15),
        logs: this.logs.slice(-30)
      };
      fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.warn('[NewsAutomation] Error guardando estado persistido:', e.message);
    }
  }

  addLog(message, level = 'info') {
    const timestamp = new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const logItem = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      time: timestamp,
      message,
      level
    };
    this.logs.push(logItem);
    if (this.logs.length > 50) this.logs.shift();

    try {
      if (io) {
        io.emit('news_automation_log', logItem);
        io.emit('news_automation_status', this.getStatus());
      }
    } catch {}

    this.savePersistedState();
    return logItem;
  }

  broadcastStatus() {
    try {
      if (io) {
        io.emit('news_automation_status', this.getStatus());
      }
    } catch {}
  }

  getStatus() {
    const now = Date.now();
    const nextTime = new Date(this.nextRunAt).getTime();
    const remainingMs = Math.max(0, nextTime - now);

    return {
      status: this.status,
      currentStep: this.currentStep,
      isGenerating: this.isGenerating,
      scheduledHour: this.scheduledHour,
      scheduledMinute: this.scheduledMinute,
      nextRunAt: this.nextRunAt,
      lastRunAt: this.lastRunAt,
      remainingMs,
      logs: this.logs,
      lastResult: this.lastResult,
      history: this.history.slice(0, 10)
    };
  }

  /**
   * Selecciona una portada temática en alta resolución que NUNCA esté repetida en la base de datos
   */
  pickThematicImage(category, keyword = '', usedImages = new Set()) {
    // 1. Obtener candidatos por categoría
    let candidates = CATEGORY_IMAGE_POOLS[category] || [];

    // Si la categoría no está mapeada, buscar por coincidencia léxica
    if (candidates.length === 0) {
      const lowerKey = `${category} ${keyword}`.toLowerCase();
      for (const [catName, images] of Object.entries(CATEGORY_IMAGE_POOLS)) {
        if (lowerKey.includes(catName.toLowerCase()) && images.length > 0) {
          candidates = images;
          break;
        }
      }
    }

    if (candidates.length === 0) {
      candidates = DEFAULT_POOL;
    }

    // Filtrar candidatos estrictamente para evitar imágenes ya utilizadas
    const availableUnused = candidates.filter(img => !usedImages.has(img));

    if (availableUnused.length > 0) {
      const idx = Math.floor(Math.random() * availableUnused.length);
      return availableUnused[idx];
    }

    // Si todas las de la categoría ya fueron usadas, buscar cualquier imagen no usada en todo el catálogo
    const allPoolImages = Object.values(CATEGORY_IMAGE_POOLS).flat().concat(DEFAULT_POOL);
    const globalUnused = allPoolImages.filter(img => !usedImages.has(img));

    if (globalUnused.length > 0) {
      const idx = Math.floor(Math.random() * globalUnused.length);
      return globalUnused[idx];
    }

    // Fallback garantizado: imagen única con hash/timestamp para garantizar unicidad visual
    const uniqueSeed = Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const baseUnsplash = candidates[Math.floor(Math.random() * candidates.length)] || DEFAULT_POOL[0];
    const separator = baseUnsplash.includes('?') ? '&' : '?';
    return `${baseUnsplash}${separator}pfg_sig=${uniqueSeed}`;
  }

  /**
   * Sanea y asegura que ningún artículo existente comparta la misma imagen de portada
   */
  async ensureUniqueCovers() {
    try {
      const allNews = await News.findAll({ order: [['id', 'ASC']] });
      const seenUrls = new Set();
      const updatedArticles = [];

      for (const article of allNews) {
        if (!article.image_url || seenUrls.has(article.image_url)) {
          // Asignar una imagen temática fresca y no usada
          const allUsed = new Set([...seenUrls, ...allNews.map(n => n.image_url).filter(Boolean)]);
          const newImage = this.pickThematicImage(article.category, '', allUsed);
          await article.update({ image_url: newImage });
          seenUrls.add(newImage);
          updatedArticles.push({ id: article.id, title: article.title, newImage });
          console.log(`[NewsAutomation] Portada duplicada corregida en artículo [${article.id}] "${article.title}"`);
        } else {
          seenUrls.add(article.image_url);
        }
      }

      if (updatedArticles.length > 0) {
        invalidateNewsCache();
        this.addLog(`🖼️ Se desduplicaron y asignaron portadas únicas a ${updatedArticles.length} artículo(s).`, 'info');
      }

      return { success: true, updatedCount: updatedArticles.length, updatedArticles };
    } catch (e) {
      console.warn('[NewsAutomation] Error en ensureUniqueCovers:', e.message);
      return { success: false, error: e.message };
    }
  }

  /**
   * Ejecuta el ciclo completo de creación de noticia con Gemini
   */
  async executeDailyNewsGeneration({ isManual = false, forcedTopic = null } = {}) {
    if (this.isGenerating) {
      console.warn('[NewsAutomation] Ya hay un proceso de generación en curso.');
      return { success: false, error: 'Ya hay un proceso en curso' };
    }

    this.isGenerating = true;
    this.status = 'generating';
    this.currentStep = 'Iniciando escaneo de actualidad y análisis de historial...';
    this.addLog(`🚀 ${isManual ? 'Lanzamiento manual' : 'Disparo automático'} iniciado.`, 'info');
    this.broadcastStatus();

    const startTime = Date.now();

    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY no está configurada en las variables de entorno.');
      }

      // PASO 1: Consultar artículos existentes para evitar temas e imágenes repetidas
      this.currentStep = 'Examinando noticias e imágenes en base de datos para garantizar originalidad...';
      this.addLog('📚 Consultando los últimos artículos publicados...', 'info');

      const existingArticles = await News.findAll({
        order: [['published_at', 'DESC']],
        limit: 30,
        attributes: ['title', 'category', 'slug', 'image_url']
      });

      const recentTitlesList = existingArticles.map((a, i) => `${i + 1}. [${a.category}] "${a.title}"`).join('\n');
      const usedImages = new Set(existingArticles.map(a => a.image_url).filter(Boolean));
      this.addLog(`🔍 Encontrados ${existingArticles.length} artículos previos. Asegurando originalidad...`, 'info');

      // PASO 2: Configurar modelo Gemini 3.5 Flash con fallback a Gemini 3.5 Flash Lite
      this.currentStep = 'Conectando con Gemini 3.5 Flash para idear y redactar el artículo de élite...';
      this.addLog('🧠 Gemini 3.5 Flash analizando tendencias científicas, nutrición y biohacking...', 'info');

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const createGenerativeModel = (modelName) => genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              topic_rationale: { type: SchemaType.STRING },
              title: { type: SchemaType.STRING },
              slug: { type: SchemaType.STRING },
              summary: { type: SchemaType.STRING },
              category: { type: SchemaType.STRING },
              tags: { type: SchemaType.STRING },
              reading_time: { type: SchemaType.INTEGER },
              content: { type: SchemaType.STRING },
              seo_title: { type: SchemaType.STRING },
              seo_description: { type: SchemaType.STRING },
              theme_keyword: { type: SchemaType.STRING }
            },
            required: ['title', 'slug', 'summary', 'category', 'content', 'seo_title', 'seo_description']
          }
        }
      });

      const prompt = `Eres el redactor científico en jefe y estratega de contenido de Pro Fitness Glass (plataforma de entrenamiento, sobrecarga progresiva y nutrición deportiva).
Tu objetivo es crear una NOTICIA/GUÍA DE ÉLITE que capte la atención inmediatamente, retenga la lectura hasta el final y tenga un SEO orgánico perfecto.

${forcedTopic ? `TEMA SOLICITADO: "${forcedTopic}"` : `INSTRUCCIÓN DE TEMA:
1. Elige un tema de actualidad científica, debate candente o descubrimiento reciente sobre hipertrofia, nutrición deportiva, biohacking, recuperación, descanso, biomecánica o recomposición corporal.
2. IMPORTANTE: NO repitas temas ya tratados. Aquí tienes los títulos recientes que NO debes duplicar:
${recentTitlesList || '(No hay artículos previos)'}`}

CATEGORÍAS PERMITIDAS:
Puedes elegir una de las estándar: "Entrenamiento", "Nutrición", "Suplementación", "Salud", "Novedades".
O SI EL TEMA LO REQUIERE, puedes crear y nombrar una NUEVA categoría coherente en mayúsculas/minúsculas correctas (por ejemplo: "Longevidad", "Descanso y Sueño", "Biohacking", "Biomecánica", "Psicología Deportiva", "Cardio y Resistencia").

ESTRUCTURA EDITORIAL Y DE RETENCIÓN OBLIGATORIA (Markdown enriquecido):
1. TÍTULO ATRACTIVO: Gancho potente y profesional sin ser clickbait engañoso (máx. 85 caracteres).
2. RESUMEN EN 2 FRASES: Explicar el beneficio directo y tangible para el lector.
3. EXTENSIÓN ESTRICTA PARA MÁXIMA RETENCIÓN: Entre 450 y 650 palabras en total. PROHIBIDO crear artículos largos, densos, aburridos o con exceso de tecnicismos. Debe poder leerse completo en 3 minutos.
4. RITMO Y PÁRRAFOS CORTOS:
   - Máximo 2 a 3 líneas por párrafo. Prohibidas las paredes de texto.
   - Gancho potente al inicio ("Hook"): Ve directo al grano sin introducciones tópicas ni rodeos ("Desde la antigüedad...", "El deporte es vital...").
   - Explica la ciencia de forma visual, amena y conversacional, como un entrenador de élite hablando con su atleta. Cero jerga pesada o aburrida.
5. SUBTÍTULOS ## Y ### (3 a 4 secciones bien estructuradas):
   - REGLA TÉCNICA ESTRICTA: Usa siempre ## para secciones principales y ### para subapartados. CADA SUBTÍTULO DEBE IR OBLIGATORIAMENTE EN SU PROPIA LÍNEA SEGUIDO DE DOS SALTOS DE LÍNEA ANTES DEL PÁRRAFO. NUNCA coloques el párrafo pegado en la misma línea que el ##. NUNCA uses # solo.
6. ALERTAS GITHUB FLAVORED (1 o 2 máximo):
   > [!TIP]
   > **Consejo Práctico:** Explica aquí el consejo o truco directo.
   O
   > [!IMPORTANT]
   > **Dato Científico:** El estudio o dato relevante explicado en lenguaje simple.
   O
   > [!NOTE]
   > **Desmintiendo el Mito:** Aclaración clara y directa.
   REGLAS: NUNCA uses almohadillas (## o ###) dentro de una alerta (>), ni corchetes sueltos como [ESTUDIO].
7. TABLA COMPARATIVA MARKDOWN COMPACTA (| Parámetro | Opción A | Opción B |) de 3-4 filas máx, muy visual.
8. ENLACES INTERNOS SEO NATURALES (OBLIGATORIO): Incluye de forma natural dentro del texto 1 o 2 enlaces en formato Markdown hacia nuestras herramientas públicas gratuitas cuando menciones fuerza, calorías o ejercicios:
   - [Calculadora de 1RM y Porcentajes](/calculadora-1rm)
   - [Calculadora de Calorías y Macros](/calculadora-calorias-macros)
   - [Guía de Ejercicios y Rutinas de Gimnasio](/ejercicios)
9. SECCIÓN FINAL OBLIGATORIA: "## Puntos clave para llevarte" con 3 a 4 puntos accionables muy directos para el gimnasio o la nutrición.
9. SEO Y METADATOS:
   - seo_title: Título optimizado para Google (50-60 caracteres).
   - seo_description: Meta descripción persuasiva con llamada a la acción (140-160 caracteres).
   - tags: 5 a 8 palabras clave separadas por comas.
   - reading_time: Tiempo de lectura estimado en minutos (debe ser 2 o 3 minutos).
   - theme_keyword: 1 o 2 palabras clave en inglés o español para elegir la mejor imagen de portada.

Extensión recomendada: 450 a 650 palabras de máxima retención y alto valor práctico.`;

      this.addLog('⚡ Enviando directrices editoriales y SEO a Gemini 3.5 Flash...', 'info');
      let aiResponse;
      try {
        const model = createGenerativeModel('gemini-3.5-flash');
        aiResponse = await model.generateContent(prompt);
      } catch (genErr) {
        this.addLog(`⚠️ Gemini 3.5 Flash ocupado (${genErr.message.substring(0, 70)}...). Conectando con Gemini 3.5 Flash Lite...`, 'warn');
        const fallbackModel = createGenerativeModel('gemini-3.5-flash-lite');
        aiResponse = await fallbackModel.generateContent(prompt);
      }
      const rawText = aiResponse.response.text();

      this.currentStep = 'Procesando y validando artículo generado por Gemini...';
      let parsed;
      try {
        parsed = JSON.parse(rawText);
      if (parsed.content) {
        
        parsed.content = sanitizeNewsContent(parsed.content);
      }
      } catch (err) {
        throw new Error('Gemini no devolvió un JSON con la estructura requerida.');
      }

      this.addLog(`💡 Tema ideado: "${parsed.title}" (Categoría: ${parsed.category})`, 'success');

      // PASO 3: Selección de portada temática que NO esté repetida en la BD
      this.currentStep = 'Asignando fotografía de portada curada única en alta resolución...';
      const selectedImage = this.pickThematicImage(parsed.category, parsed.theme_keyword, usedImages);
      this.addLog(`🖼️ Portada única asignada para [${parsed.category}] (sin duplicidad)`, 'info');

      // PASO 4: Generar slug único y validado
      let baseSlug = slugify(parsed.slug || parsed.title);
      if (!baseSlug) baseSlug = `articulo-${Date.now()}`;

      let finalSlug = baseSlug;
      let counter = 1;
      while (await News.findOne({ where: { slug: finalSlug } })) {
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      // PASO 5: Guardar y publicar el artículo en la base de datos
      this.currentStep = 'Guardando artículo en la base de datos y publicando...';
      this.addLog(`💾 Insertando artículo en base de datos con slug: "${finalSlug}"...`, 'info');

      const createdArticle = await News.create({
        title: parsed.title,
        slug: finalSlug,
        summary: parsed.summary,
        content: parsed.content,
        category: parsed.category.trim(),
        tags: parsed.tags || '',
        image_url: selectedImage,
        author_name: 'Equipo Científico Pro Fitness Glass',
        reading_time: parsed.reading_time || Math.max(3, Math.ceil(parsed.content.split(/\s+/).length / 200)),
        views_count: 0,
        likes_count: 0,
        is_published: true,
        published_at: new Date(),
        seo_title: parsed.seo_title || parsed.title,
        seo_description: parsed.seo_description || parsed.summary
      });

      // PASO 6: Limpiar cachés del servidor y SWR
      invalidateNewsCache();
      this.addLog('🧹 Cachés de servidor y SWR invalidadas para entrega instantánea.', 'info');

      // PASO 7: Actualizar tiempos y estados
      const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
      this.lastRunAt = new Date().toISOString();
      this.nextRunAt = calculateNextRun(this.scheduledHour, this.scheduledMinute);
      this.status = 'completed';
      this.currentStep = 'Noticia publicada con éxito. Próxima automatización programada.';

      this.lastResult = {
        success: true,
        articleId: createdArticle.id,
        articleTitle: createdArticle.title,
        articleSlug: createdArticle.slug,
        category: createdArticle.category,
        image_url: createdArticle.image_url,
        completedAt: this.lastRunAt,
        durationSeconds
      };

      this.history.unshift({
        id: createdArticle.id,
        title: createdArticle.title,
        slug: createdArticle.slug,
        category: createdArticle.category,
        image_url: createdArticle.image_url,
        createdAt: this.lastRunAt,
        success: true
      });
      if (this.history.length > 20) this.history.pop();

      this.addLog(`🎉 ¡ÉXITO! Noticia creada en ${durationSeconds}s: "${createdArticle.title}"`, 'success');
      this.savePersistedState();
      this.broadcastStatus();

      try {
        if (io) {
          io.emit('new_public_article', {
            id: createdArticle.id,
            title: createdArticle.title,
            slug: createdArticle.slug,
            category: createdArticle.category,
            image_url: createdArticle.image_url
          });
        }
      } catch {}

      // PASO 8: Notificar indexación inmediata a motores de búsqueda (Bing, Yandex vía IndexNow)
      this.notifySearchEngines(createdArticle.slug).catch((err) => {
        console.warn('[NewsAutomation] Error notificando IndexNow:', err.message);
      });

      return {
        success: true,
        article: createdArticle,
        durationSeconds
      };
    } catch (err) {
      console.error('[NewsAutomation] Error en executeDailyNewsGeneration:', err);
      const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
      this.status = 'error';
      this.currentStep = `Error: ${err.message}`;
      this.addLog(`❌ ERROR al generar artículo: ${err.message}`, 'error');

      this.lastResult = {
        success: false,
        error: err.message,
        completedAt: new Date().toISOString(),
        durationSeconds
      };

      this.savePersistedState();
      this.broadcastStatus();
      return { success: false, error: err.message };
    } finally {
      this.isGenerating = false;
      this.broadcastStatus();
    }
  }

  /**
   * Notifica a los motores de búsqueda (Bing, Yandex, etc.) mediante el protocolo IndexNow
   */
  async notifySearchEngines(slug) {
    const baseUrl = 'https://pro-fitness-glass.zeabur.app';
    const articleUrl = `${baseUrl}/noticias/${slug}`;
    const host = 'pro-fitness-glass.zeabur.app';
    const key = 'f478a2e99b0c41d6832fb91e0a8d5c3f';
    const keyLocation = `${baseUrl}/${key}.txt`;

    try {
      this.addLog(`📡 Notificando a motores de búsqueda (IndexNow / Bing) sobre "${slug}"...`, 'info');
      const response = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          host,
          key,
          keyLocation,
          urlList: [articleUrl, `${baseUrl}/calculadora-1rm`, `${baseUrl}/calculadora-calorias-macros`, `${baseUrl}/ejercicios`, `${baseUrl}/sitemap.xml`, `${baseUrl}/rss.xml`]
        })
      });

      if (response.ok || response.status === 200 || response.status === 202) {
        this.addLog(`✅ Motores de búsqueda notificados vía IndexNow (HTTP ${response.status}).`, 'success');
      } else {
        this.addLog(`⚠️ IndexNow respondió con estado HTTP ${response.status}.`, 'warn');
      }
    } catch (err) {
      this.addLog(`⚠️ No se pudo enviar notificación IndexNow: ${err.message}`, 'warn');
    }
  }


  /**
   * Re-optimiza y adapta las noticias existentes en la BD al nuevo estándar de retención
   * (450-650 palabras, ~3 min lectura, párrafos cortos y enlaces internos SEO hacia las calculadoras y ejercicios),
   * conservando intactos su ID, slug, imagen de portada, visitas y likes.
   */
  async optimizeExistingArticlesWithAI({ articleId = null, forceAll = false } = {}) {
    if (this.isGenerating) {
      return { success: false, error: 'Ya hay un proceso de IA en curso' };
    }

    this.isGenerating = true;
    this.status = 'generating';
    this.currentStep = 'Iniciando adaptación de noticias existentes al nuevo formato de retención y SEO...';
    this.addLog('🪄 Iniciando adaptación inteligente de noticias existentes (conservando URLs, visitas y portadas)...', 'info');
    this.broadcastStatus();

    const startTime = Date.now();

    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY no está configurada en las variables de entorno.');
      }

      const where = articleId ? { id: articleId } : {};
      const allArticles = await News.findAll({
        where,
        order: [['id', 'ASC']]
      });

      if (!allArticles || allArticles.length === 0) {
        this.addLog('ℹ️ No se encontraron artículos para adaptar.', 'info');
        this.status = 'completed';
        this.currentStep = 'No hay artículos pendientes de adaptar.';
        return { success: true, updatedCount: 0 };
      }

      // Si no es un artículo individual ni forceAll, priorizar los que aún no tienen enlaces internos o son demasiado largos
      let targets = allArticles;
      if (!articleId && !forceAll) {
        const unadapted = allArticles.filter((a) => {
          const text = a.content || '';
          const hasInternalLinks =
            text.includes('/calculadora-1rm') ||
            text.includes('/calculadora-calorias-macros') ||
            text.includes('/ejercicios');
          const wordCount = text.split(/\s+/).length;
          return !hasInternalLinks || wordCount > 700;
        });
        if (unadapted.length > 0) {
          targets = unadapted;
        }
      }

      this.addLog(`📚 Se van a adaptar y optimizar ${targets.length} artículo(s) existente(s) con Gemini 3.5 Flash...`, 'info');

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const createOptimizationModel = (modelName) => genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING },
              summary: { type: SchemaType.STRING },
              content: { type: SchemaType.STRING },
              reading_time: { type: SchemaType.INTEGER },
              seo_title: { type: SchemaType.STRING },
              seo_description: { type: SchemaType.STRING },
              tags: { type: SchemaType.STRING }
            },
            required: ['title', 'summary', 'content', 'reading_time', 'seo_title', 'seo_description']
          }
        }
      });

      let currentModelName = 'gemini-3.5-flash';
      let model = createOptimizationModel(currentModelName);

      let updatedCount = 0;

      for (let i = 0; i < targets.length; i++) {
        const art = targets[i];
        this.currentStep = `Adaptando [${i + 1}/${targets.length}]: "${art.title}"...`;
        this.addLog(`⚡ [${i + 1}/${targets.length}] Adaptando "${art.title}" (formato ágil 3 min + enlaces SEO)...`, 'info');
        this.broadcastStatus();

        try {
          const prompt = `Eres el editor jefe y especialista en retención de lectores y SEO de Pro Fitness Glass.
Reescribe y adapta el siguiente artículo ya publicado para que cumpla nuestro NUEVO ESTÁNDAR DE ALTA RETENCIÓN Y SEO DE GIMNASIO, manteniendo exactamente su temática central.

ARTÍCULO ACTUAL:
- Título actual: "${art.title}"
- Categoría: "${art.category}"
- Resumen actual: "${art.summary}"
- Contenido actual:
${art.content}

REGLAS OBLIGATORIAS DE ADAPTACIÓN:
1. EXTENSIÓN ÁGIL DE MÁXIMA RETENCIÓN (450 a 600 palabras en total, 3 minutos de lectura):
   - Elimina cualquier relleno, introducción lenta o jerga médica/académica aburrida.
   - Párrafos súper cortos (máximo 2 a 3 líneas por párrafo). Cero paredes de texto.
   - Gancho directo en las primeras 2 líneas explicando por qué esto cambia tus resultados en el gimnasio o en tu dieta hoy mismo.
2. SUBTÍTULOS ## Y ### (3 o 4 secciones dinámicas):
   - Cada subtítulo (## o ###) debe ir en su propia línea seguido de dos saltos de línea antes del párrafo. NUNCA uses # solo.
3. ENLACES INTERNOS SEO NATURALES (OBLIGATORIO):
   - Incluye de forma natural dentro del texto 1 o 2 enlaces en formato Markdown hacia nuestras herramientas públicas gratuitas:
     * [Calculadora de 1RM y Porcentajes](/calculadora-1rm)
     * [Calculadora de Calorías y Macros](/calculadora-calorias-macros)
     * [Guía de Ejercicios y Rutinas de Gimnasio](/ejercicios)
4. BLOQUES VISUALES:
   - Incluye 1 o 2 alertas GitHub Flavored (> [!TIP] o > [!IMPORTANT]) con consejos accionables (sin usar ## dentro de la alerta).
   - Incluye 1 tabla comparativa Markdown muy compacta (máximo 3 a 4 filas).
5. CIERRE OBLIGATORIO:
   - Termina con "## Puntos clave para llevarte" con 3 o 4 puntos numerados directos al grano.
6. SEO:
   - Puedes pulir ligeramente el título si mejora el CTR en búsquedas de gimnasio, pero manteniendo la promesa exacta del artículo.
   - reading_time debe ser 3.`;

          let aiRes;
          try {
            aiRes = await model.generateContent(prompt);
          } catch (itemModelErr) {
            if (currentModelName !== 'gemini-3.5-flash-lite') {
              this.addLog(`⚠️ Gemini 3.5 Flash ocupado (${itemModelErr.message.substring(0, 60)}...). Conmutando a Gemini 3.5 Flash Lite para las adaptaciones...`, 'warn');
              currentModelName = 'gemini-3.5-flash-lite';
              model = createOptimizationModel(currentModelName);
              aiRes = await model.generateContent(prompt);
            } else {
              throw itemModelErr;
            }
          }
          const parsed = JSON.parse(aiRes.response.text());

          const cleanContent = sanitizeNewsContent(parsed.content || art.content);
          const wordCount = cleanContent.split(/\s+/).length;
          const readingTime = Math.min(4, Math.max(2, Math.round(wordCount / 190)));

          await art.update({
            title: parsed.title || art.title,
            summary: parsed.summary || art.summary,
            content: cleanContent,
            reading_time: readingTime,
            seo_title: parsed.seo_title || parsed.title || art.seo_title,
            seo_description: parsed.seo_description || parsed.summary || art.seo_description,
            tags: parsed.tags || art.tags
          });

          updatedCount++;
          invalidateNewsCache();
          this.addLog(`✅ [${i + 1}/${targets.length}] Adaptado con éxito: "${art.title}" (${wordCount} palabras, ~${readingTime} min lectura)`, 'success');
        } catch (itemErr) {
          this.addLog(`⚠️ Error adaptando "${art.title}": ${itemErr.message}`, 'warn');
        }
      }

      const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
      this.status = 'completed';
      this.currentStep = `¡Adaptación completada! ${updatedCount} artículo(s) actualizados al nuevo formato.`;
      this.lastRunAt = new Date().toISOString();
      this.lastResult = {
        success: true,
        articleTitle: `${updatedCount} noticia(s) adaptadas al nuevo formato SEO y retención`,
        category: 'Optimización IA',
        completedAt: this.lastRunAt,
        durationSeconds
      };

      this.addLog(`🎉 ¡PROCESO COMPLETADO en ${durationSeconds}s! Se han adaptado ${updatedCount} noticia(s) existentes conservando sus URLs.`, 'success');
      this.savePersistedState();
      this.broadcastStatus();

      return { success: true, updatedCount, durationSeconds };
    } catch (err) {
      console.error('[NewsAutomation] Error en optimizeExistingArticlesWithAI:', err);
      this.status = 'error';
      this.currentStep = `Error: ${err.message}`;
      this.addLog(`❌ Error en adaptación de noticias: ${err.message}`, 'error');
      this.savePersistedState();
      this.broadcastStatus();
      return { success: false, error: err.message };
    } finally {
      this.isGenerating = false;
      this.broadcastStatus();
    }
  }

  updateSchedule(hour, minute = 0) {
    this.scheduledHour = parseInt(hour, 10) || 9;
    this.scheduledMinute = parseInt(minute, 10) || 0;
    this.nextRunAt = calculateNextRun(this.scheduledHour, this.scheduledMinute);
    this.addLog(`⏰ Hora programada actualizada a las ${String(this.scheduledHour).padStart(2, '0')}:${String(this.scheduledMinute).padStart(2, '0')}`, 'info');
    this.savePersistedState();
    this.broadcastStatus();
    return this.getStatus();
  }
}

export const newsAutomationService = new NewsAutomationService();
export default newsAutomationService;
