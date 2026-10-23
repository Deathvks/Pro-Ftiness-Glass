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

// Catálogo de imágenes curadas en alta resolución por categoría y temática
const CATEGORY_IMAGE_POOLS = {
  'Entrenamiento': [
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1200&q=80'
  ],
  'Nutrición': [
    'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80'
  ],
  'Suplementación': [
    'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1579722820308-d74e571900a9?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1550572017-edd951aa8f72?auto=format&fit=crop&w=1200&q=80'
  ],
  'Salud': [
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80'
  ],
  'Novedades': [
    'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80'
  ],
  'Descanso y Sueño': [
    'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1520206183501-b80df61043c2?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1511295742362-92c96b124e52?auto=format&fit=crop&w=1200&q=80'
  ],
  'Biohacking': [
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80'
  ],
  'Biomecánica': [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=80'
  ],
  'Longevidad': [
    'https://images.unsplash.com/photo-1447452001602-7090c7ab2db3?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80'
  ],
  'Psicología Deportiva': [
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80'
  ],
  'Cardio y Resistencia': [
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1486218119243-13883505764c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1200&q=80'
  ]
};

const DEFAULT_POOL = [
  'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80'
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

    // Asegurar que si nextRunAt ya pasó en el arranque, recalcularlo
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

    // Notificar en tiempo real a clientes admin mediante Socket.io
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

  pickThematicImage(category, keyword = '') {
    // 1. Si la categoría tiene un pool específico
    const pool = CATEGORY_IMAGE_POOLS[category];
    if (Array.isArray(pool) && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      return pool[idx];
    }

    // 2. Búsqueda por palabra clave si se creó una categoría no contemplada
    const lowerKey = `${category} ${keyword}`.toLowerCase();
    for (const [catName, images] of Object.entries(CATEGORY_IMAGE_POOLS)) {
      if (lowerKey.includes(catName.toLowerCase()) && images.length > 0) {
        return images[Math.floor(Math.random() * images.length)];
      }
    }

    // 3. Fallback a imágenes de fitness de alta calidad
    return DEFAULT_POOL[Math.floor(Math.random() * DEFAULT_POOL.length)];
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

      // PASO 1: Consultar los artículos existentes para evitar temas repetidos
      this.currentStep = 'Examinando noticias recientes en base de datos para evitar temas repetidos...';
      this.addLog('📚 Consultando los últimos 25 artículos publicados...', 'info');

      const existingArticles = await News.findAll({
        order: [['published_at', 'DESC']],
        limit: 25,
        attributes: ['title', 'category', 'slug']
      });

      const recentTitlesList = existingArticles.map((a, i) => `${i + 1}. [${a.category}] "${a.title}"`).join('\n');
      this.addLog(`🔍 Encontrados ${existingArticles.length} artículos previos. Asegurando originalidad...`, 'info');

      // PASO 2: Configurar modelo Gemini 2.5 Flash
      this.currentStep = 'Conectando con Gemini 2.5 Flash para idear y redactar el artículo viral...';
      this.addLog('🧠 Gemini analizando tendencias científicas, nutrición y biohacking de 2026...', 'info');

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
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

ESTRUCTURA EDITORIAL OBLIGATORIA DEL CONTENIDO (Markdown enriquecido):
1. TÍTULO ATRACTIVO: Gancho potente y profesional sin ser clickbait engañoso (máx. 85 caracteres).
2. RESUMEN EN 2 FRASES: Explicar el beneficio directo para el lector.
3. SUBTÍTULOS ## Y ###: Mínimo 4 secciones principales bien estructuradas.
4. ALERTAS GITHUB FLAVORED OBLIGATORIAS:
   > [!TIP] Para consejos prácticos accionables.
   > [!IMPORTANT] Para evidencia científica o datos de estudios contrastados.
   > [!NOTE] Para desmentir mitos comunes.
5. TABLA COMPARATIVA MARKDOWN (| Parámetro | Protocolo A | Protocolo B |) con datos visuales claros.
6. LISTAS Y ACCIONES NUMERADAS.
7. SECCIÓN FINAL OBLIGATORIA: "## Puntos clave para llevarte" con resumen numerado de 3 a 5 conclusiones prácticas.
8. SEO:
   - seo_title: Título optimizado para Google (50-60 caracteres).
   - seo_description: Meta descripción persuasiva con llamada a la acción (140-160 caracteres).
   - tags: 5 a 8 palabras clave separadas por comas.
   - reading_time: Tiempo de lectura estimado en minutos (entre 4 y 7).
   - theme_keyword: 1 o 2 palabras clave en inglés o español para elegir la mejor imagen de portada.

Extensión recomendada: 700 a 1000 palabras de altísimo valor pedagógico.`;

      this.addLog('⚡ Enviando directrices editoriales y SEO a Gemini...', 'info');
      const aiResponse = await model.generateContent(prompt);
      const rawText = aiResponse.response.text();

      this.currentStep = 'Procesando y validando artículo generado por Gemini...';
      let parsed;
      try {
        parsed = JSON.parse(rawText);
      } catch (err) {
        throw new Error('Gemini no devolvió un JSON con la estructura requerida.');
      }

      this.addLog(`💡 Tema ideado: "${parsed.title}" (Categoría: ${parsed.category})`, 'success');

      // PASO 3: Selección de portada temática coherente
      this.currentStep = 'Asignando fotografía de portada curada en alta resolución...';
      const selectedImage = this.pickThematicImage(parsed.category, parsed.theme_keyword);
      this.addLog(`🖼️ Portada seleccionada correspondiente a [${parsed.category}]`, 'info');

      // PASO 4: Generar slug único y validado
      let baseSlug = slugify(parsed.slug || parsed.title);
      if (!baseSlug) baseSlug = `articulo-${Date.now()}`;

      // Verificar si ya existe en BD para evitar colisión de clave única
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

      // Emitir evento Socket.io de nuevo artículo a todos los usuarios conectados
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

      return {
        success: true,
        article: createdArticle,
        durationSeconds
      };
    } catch (err) {
      console.error('[NewsAutomation] Error en executeDailyNewsGeneration:', err);
      this.status = 'error';
      this.currentStep = `Error durante la generación: ${err.message}`;
      this.addLog(`❌ ERROR: ${err.message}`, 'error');

      this.lastResult = {
        success: false,
        error: err.message,
        failedAt: new Date().toISOString()
      };

      this.savePersistedState();
      this.broadcastStatus();

      return {
        success: false,
        error: err.message
      };
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
