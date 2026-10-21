/* backend/controllers/newsController.js */
import { Op } from 'sequelize';
import models from '../models/index.js';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const { News } = models;

// Imágenes de portada curadas en alta resolución para fitness y nutrición
const CATEGORY_DEFAULT_IMAGES = {
  'Entrenamiento': 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
  'Nutrición': 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80',
  'Suplementación': 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=1200&q=80',
  'Salud': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
  'Novedades': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80'
};

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
 * Obtener listado público de noticias con paginación, filtros y búsqueda
 */
export const getPublicNews = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(30, Math.max(1, parseInt(req.query.limit) || 9));
    const offset = (page - 1) * limit;
    const { category, search } = req.query;

    const where = { is_published: true };

    if (category && category !== 'Todas') {
      where.category = category;
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      where[Op.or] = [
        { title: { [Op.like]: term } },
        { summary: { [Op.like]: term } },
        { tags: { [Op.like]: term } }
      ];
    }

    const { count, rows } = await News.findAndCountAll({
      where,
      order: [['published_at', 'DESC']],
      limit,
      offset,
      attributes: [
        'id', 'slug', 'title', 'summary', 'image_url', 'category',
        'tags', 'author_name', 'author_avatar', 'reading_time',
        'views_count', 'likes_count', 'published_at', 'updatedAt'
      ]
    });

    // Obtener recuento por categoría para las pestañas dinámicas
    const allPublished = await News.findAll({
      where: { is_published: true },
      attributes: ['category']
    });

    const categoryCounts = allPublished.reduce((acc, curr) => {
      const cat = (curr.category || '').trim();
      if (cat) {
        acc[cat] = (acc[cat] || 0) + 1;
      }
      return acc;
    }, {});

    // Categorías base recomendadas
    const DEFAULT_CATEGORIES = ['Entrenamiento', 'Nutrición', 'Suplementación', 'Salud', 'Novedades'];
    const dbCategories = Object.keys(categoryCounts);
    const extraCategories = dbCategories.filter(c => !DEFAULT_CATEGORIES.includes(c)).sort();
    const categories = ['Todas', ...DEFAULT_CATEGORIES, ...extraCategories];

    return res.json({
      news: rows,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      categories,
      categoryCounts
    });
  } catch (error) {
    console.error('Error al obtener noticias:', error);
    return res.status(500).json({ error: 'Error al cargar las noticias.' });
  }
};

/**
 * Obtener una noticia completa por su slug
 */
export const getNewsBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const isAdmin = req.user?.role === 'admin';

    const where = { slug };
    if (!isAdmin) {
      where.is_published = true;
    }

    const article = await News.findOne({ where });

    if (!article) {
      return res.status(404).json({ error: 'Noticia no encontrada.' });
    }

    // Artículos relacionados en la misma categoría o más recientes
    const relatedNews = await News.findAll({
      where: {
        is_published: true,
        id: { [Op.ne]: article.id },
        category: article.category
      },
      order: [['published_at', 'DESC']],
      limit: 3,
      attributes: ['id', 'slug', 'title', 'summary', 'image_url', 'category', 'reading_time', 'views_count', 'likes_count', 'published_at']
    });

    // Noticia siguiente y anterior para navegación continua entre lecturas
    const nextArticle = await News.findOne({
      where: { is_published: true, id: { [Op.gt]: article.id } },
      order: [['id', 'ASC']],
      attributes: ['id', 'slug', 'title', 'category', 'image_url']
    });

    const prevArticle = await News.findOne({
      where: { is_published: true, id: { [Op.lt]: article.id } },
      order: [['id', 'DESC']],
      attributes: ['id', 'slug', 'title', 'category', 'image_url']
    });

    return res.json({
      article,
      relatedNews,
      nextArticle,
      prevArticle
    });
  } catch (error) {
    console.error('Error al obtener noticia por slug:', error);
    return res.status(500).json({ error: 'Error al cargar la noticia.' });
  }
};

/**
 * Registrar una lectura única real en un artículo
 */
export const trackNewsView = async (req, res) => {
  try {
    const { slug } = req.params;

    const article = await News.findOne({
      where: { slug, is_published: true }
    });

    if (!article) {
      return res.status(404).json({ error: 'Noticia no encontrada.' });
    }

    await article.increment('views_count', { by: 1 });
    await article.reload();

    return res.json({
      success: true,
      views_count: article.views_count
    });
  } catch (error) {
    console.error('Error al registrar lectura de noticia:', error);
    return res.status(500).json({ error: 'Error al registrar lectura.' });
  }
};

/**
 * Registrar o retirar valoración "Me ha servido" / Like en un artículo
 */
export const toggleLikeNews = async (req, res) => {
  try {
    const { slug } = req.params;
    const { action = 'like' } = req.body; // 'like' | 'unlike'

    const article = await News.findOne({
      where: { slug, is_published: true }
    });

    if (!article) {
      return res.status(404).json({ error: 'Artículo no encontrado.' });
    }

    if (action === 'unlike') {
      if (article.likes_count > 0) {
        await article.decrement('likes_count', { by: 1 });
      }
    } else {
      await article.increment('likes_count', { by: 1 });
    }

    await article.reload();

    return res.json({
      success: true,
      likes_count: article.likes_count,
      views_count: article.views_count
    });
  } catch (error) {
    console.error('Error al actualizar valoración del artículo:', error);
    return res.status(500).json({ error: 'Error al actualizar valoración del artículo.' });
  }
};

/**
 * Generar un artículo completo con IA (Gemini) para el administrador
 */
export const generateAINews = async (req, res) => {
  try {
    const { topic, category = 'Entrenamiento' } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: 'Debes proporcionar un tema o título base para generar el artículo.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY no configurada en el servidor.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            title: { type: SchemaType.STRING },
            slug: { type: SchemaType.STRING },
            summary: { type: SchemaType.STRING },
            category: { type: SchemaType.STRING },
            tags: { type: SchemaType.STRING },
            reading_time: { type: SchemaType.INTEGER },
            content: { type: SchemaType.STRING },
            seo_title: { type: SchemaType.STRING },
            seo_description: { type: SchemaType.STRING }
          },
          required: ['title', 'slug', 'summary', 'category', 'content']
        }
      }
    });

    const prompt = `Eres un redactor científico de fitness y nutrición de élite con profundo conocimiento en hipertrofia, biomecánica y dietética deportiva.
Genera un artículo de blog/noticia de alta calidad, dinámico, ameno de leer y perfectamente optimizado para SEO sobre el siguiente tema: "${topic}".
Categoría sugerida: ${category}.
REGLAS EDITORIALES OBLIGATORIAS PARA QUE EL ARTÍCULO SEA VISUALMENTE ATRACTIVO Y NO SEA TEXTO MONÓTONO:
1. Divide el texto con subtítulos claros usando ## (entre 3 y 5 secciones principales) y ### para subapartados.
2. Incluye al menos 1 o 2 bloques de alerta Markdown con formato GitHub:
   > [!TIP] para consejos de entrenamiento y trucos prácticos.
   > [!IMPORTANT] para datos de evidencia científica cruciales.
   > [!NOTE] para aclaraciones o mitos.
3. Incluye una tabla comparativa en formato Markdown (| Parámetro | Opción A | Opción B |) que resuma datos, dosis, repeticiones o alimentos de forma visual.
4. Usa listas numeradas y con viñetas para desglosar pasos prácticos.
5. Termina con una sección titulada "## Puntos clave para llevarte" con un resumen numerado accionable.
Extensión total: 600-900 palabras.`;

    const result = await model.generateContent(prompt);

    const responseText = result.response.text();
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing AI response JSON:', responseText);
      return res.status(500).json({ error: 'La IA no devolvió un JSON válido. Inténtalo de nuevo.' });
    }

    // Asignar imagen predeterminada por categoría si no se incluye
    if (!parsed.image_url) {
      parsed.image_url = CATEGORY_DEFAULT_IMAGES[parsed.category] || CATEGORY_DEFAULT_IMAGES['Entrenamiento'];
    }

    // Asegurar slug válido
    parsed.slug = slugify(parsed.slug || parsed.title);

    return res.json({ article: parsed });
  } catch (error) {
    console.error('Error al generar noticia con IA:', error);
    return res.status(500).json({ error: error.message || 'Error al generar el artículo con IA.' });
  }
};

/**
 * Crear noticia (Admin)
 */
export const createNews = async (req, res) => {
  try {
    const {
      title,
      slug: userSlug,
      summary,
      content,
      image_url,
      category,
      tags,
      reading_time,
      is_published,
      author_name,
      seo_title,
      seo_description
    } = req.body;

    if (!title || !content || !summary) {
      return res.status(400).json({ error: 'Título, resumen y contenido son obligatorios.' });
    }

    let finalSlug = slugify(userSlug || title);
    
    // Verificar colisión de slug
    const existing = await News.findOne({ where: { slug: finalSlug } });
    if (existing) {
      finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
    }

    const calculatedReadingTime = reading_time || Math.max(2, Math.ceil(content.split(/\s+/).length / 200));

    const newArticle = await News.create({
      title,
      slug: finalSlug,
      summary,
      content,
      image_url: image_url || CATEGORY_DEFAULT_IMAGES[category] || CATEGORY_DEFAULT_IMAGES['Entrenamiento'],
      category: category || 'Entrenamiento',
      tags: tags || '',
      reading_time: calculatedReadingTime,
      is_published: is_published !== false,
      published_at: new Date(),
      author_name: author_name || req.user?.username || 'Equipo Pro Fitness Glass',
      author_avatar: req.user?.profile_image_url || null,
      seo_title: seo_title || title,
      seo_description: seo_description || summary
    });

    return res.status(201).json({ message: 'Noticia creada con éxito.', article: newArticle });
  } catch (error) {
    console.error('Error al crear noticia:', error);
    return res.status(500).json({ error: 'Error al crear la noticia.' });
  }
};

/**
 * Actualizar noticia (Admin)
 */
export const updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const article = await News.findByPk(id);

    if (!article) {
      return res.status(404).json({ error: 'Noticia no encontrada.' });
    }

    const {
      title,
      slug: newSlug,
      summary,
      content,
      image_url,
      category,
      tags,
      reading_time,
      is_published,
      author_name,
      seo_title,
      seo_description
    } = req.body;

    let finalSlug = article.slug;
    if (newSlug && newSlug !== article.slug) {
      finalSlug = slugify(newSlug);
      const existing = await News.findOne({ where: { slug: finalSlug, id: { [Op.ne]: id } } });
      if (existing) {
        finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
      }
    }

    await article.update({
      title: title ?? article.title,
      slug: finalSlug,
      summary: summary ?? article.summary,
      content: content ?? article.content,
      image_url: image_url ?? article.image_url,
      category: category ?? article.category,
      tags: tags ?? article.tags,
      reading_time: reading_time ?? article.reading_time,
      is_published: is_published !== undefined ? is_published : article.is_published,
      author_name: author_name ?? article.author_name,
      seo_title: seo_title ?? article.seo_title,
      seo_description: seo_description ?? article.seo_description
    });

    return res.json({ message: 'Noticia actualizada con éxito.', article });
  } catch (error) {
    console.error('Error al actualizar noticia:', error);
    return res.status(500).json({ error: 'Error al actualizar la noticia.' });
  }
};

/**
 * Eliminar noticia (Admin)
 */
export const deleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    const article = await News.findByPk(id);

    if (!article) {
      return res.status(404).json({ error: 'Noticia no encontrada.' });
    }

    await article.destroy();
    return res.json({ message: 'Noticia eliminada correctamente.' });
  } catch (error) {
    console.error('Error al eliminar noticia:', error);
    return res.status(500).json({ error: 'Error al eliminar la noticia.' });
  }
};

/**
 * Obtener todos los slugs publicados para Sitemap XML
 */
export const getSitemapNews = async () => {
  try {
    return await News.findAll({
      where: { is_published: true },
      attributes: ['slug', 'updatedAt', 'published_at'],
      order: [['published_at', 'DESC']]
    });
  } catch (error) {
    console.error('Error en sitemap news:', error);
    return [];
  }
};

/**
 * Semillero inicial de artículos científicos de alta calidad si la tabla está vacía
 */
export const seedInitialNewsIfEmpty = async () => {
  try {
    const count = await News.count();
    if (count > 0) return;

    console.log('🌱 Inicializando artículos científicos de lanzamiento en noticias...');

    const initialArticles = [
      {
        title: 'Creatina Monohidrato: Guía Científica Definitiva de Dosis, Beneficios y Mitos',
        slug: 'guia-cientifica-creatina-monohidrato-dosis-beneficios-mitos',
        category: 'Suplementación',
        reading_time: 5,
        summary: 'Descubre qué dice la ciencia sobre la creatina: dosis óptima diaria, si es necesaria la fase de carga, cuándo tomarla y el desmentido de los mitos más comunes.',
        image_url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=1200&q=80',
        tags: 'creatina, suplementacion, masa muscular, fuerza, ciencia',
        author_name: 'Equipo Científico Pro Fitness',
        seo_title: 'Creatina Monohidrato: Dosis, Beneficios y Mitos | Pro Fitness Glass',
        seo_description: 'Guía científica completa sobre la creatina monohidrato: cómo tomarla, dosis recomendada, mitos sobre el daño renal y retención de agua.',
        content: `## El suplemento con mayor evidencia del mundo

La **creatina monohidrato** es el suplemento ergogénico con mayor respaldo científico en la historia de la nutrición deportiva. Avalada por la *International Society of Sports Nutrition (ISSN)*, su eficacia y perfil de seguridad han sido demostrados en cientos de ensayos clínicos.

### ¿Cómo funciona la creatina en tu cuerpo?
El cuerpo almacena la creatina en forma de **fosfocreatina** en el tejido muscular esquelético. Durante esfuerzos de alta intensidad (como una serie pesada de sentadilla o un sprint), la fosfocreatina dona un grupo fosfato al ADP para regenerar rápidamente **ATP** (la molécula energética universal). 

Tener los depósitos de fosfocreatina saturados te permite:
- Realizar **1 a 2 repeticiones extra** con cargas máximas.
- Recuperarte más rápido entre series de alta demanda.
- Estimular una mayor síntesis proteica gracias a una mayor hidratación intracelular.

---

### ¿Fase de carga: sí o no?
Existen dos protocolos validados por la evidencia:

1. **Protocolo constante (Recomendado):** Consumir entre **3 g y 5 g al día** (o 0.07 g por kg de peso corporal) todos los días de forma continuada. Los depósitos se saturan por completo en 3-4 semanas sin molestias gastrointestinales.
2. **Protocolo con carga rápida:** Consumir 20 g al día divididos en 4 tomas durante 5-7 días, seguido de 3-5 g diarios de mantenimiento. Satura los depósitos en solo una semana, pero puede provocar pesadez estomacal en personas sensibles.

> [!TIP]
> La creatina funciona por **acumulación**, no por efecto agudo. Lo más importante no es el momento exacto en que la tomes, sino tomarla **todos los días**, incluso los días de descanso.

---

### Mitos desmentidos por la ciencia

* **¿Daña los riñones?:** En personas con función renal sana, decenas de estudios a largo plazo (hasta 5 años de consumo ininterrumpido) han demostrado una seguridad absoluta. El ligero aumento de creatinina en sangre es un subproducto normal e inocuo de la degradación muscular de la creatina, no un indicador de daño.
* **¿Causa caída del cabello?:** Este mito nació de un único estudio de 2009 en jugadores de rugby donde aumentó la DHT pero dentro de rangos normales. Ningún otro estudio posterior ha logrado replicar este efecto ni ha demostrado alopecia inducida por creatina.
* **¿Retiene líquidos bajo la piel?:** Falso. La creatina retiene agua **intracelular** (dentro del miocito), lo que da a los músculos un aspecto más lleno, tenso y anabólico, nunca "blando".

---

### Puntos clave para llevarte
1. La **creatina monohidrato** (sello Creapure o monohidrato estándar 200 mesh) es la forma más económica y efectiva.
2. Toma **3 a 5 gramos diarios** a cualquier hora con agua o tu batido post-entreno.
3. No es necesario realizar descansos cíclicos.`
      },
      {
        title: 'Sobrecarga Progresiva: El Único Principio que Realmente Construye Músculo',
        slug: 'sobrecarga-progresiva-principio-hipertrofia-muscular',
        category: 'Entrenamiento',
        reading_time: 6,
        summary: 'Aprende a programar la sobrecarga progresiva más allá de simplemente subir kilos a la barra. Estrategias prácticas de series, técnica, densidad y RIR.',
        image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
        tags: 'sobrecarga progresiva, hipertrofia, entrenamiento, fuerza, rir',
        author_name: 'Coach Pro Fitness',
        seo_title: 'Sobrecarga Progresiva: Cómo Ganar Masa Muscular Real',
        seo_description: 'Domina el principio de la sobrecarga progresiva en el gimnasio: cómo aplicar peso, repeticiones y tempo para estimular el crecimiento muscular.',
        content: `## La regla de oro del estímulo muscular

Si tu entrenamiento no desafía a tus fibras musculares con una tensión mecánica creciente a lo largo del tiempo, tu cuerpo no tendrá ningún motivo biológico para invertir energía en sintetizar nuevo tejido muscular.

La **sobrecarga progresiva** no significa batir un récord personal en cada sesión; significa imponer un estrés gradualmente mayor a medida que tu cuerpo se adapta.

---

### Las 5 formas reales de progresar

Muchos atletas se estancan porque creen que sobrecargar es únicamente poner más discos a la barra. En realidad, existen 5 variables clave:

1. **Aumento de carga externa:** Mover 80 kg a 8 repeticiones hoy cuando el mes pasado movías 75 kg a las mismas 8 repeticiones con idéntica técnica.
2. **Aumento de repeticiones con la misma carga:** Si haces press de banca con 70 kg por 8 reps, alcanzar 10 o 12 reps con el mismo peso representa un aumento directo del volumen de trabajo.
3. **Mejora en la calidad técnica y control:** Realizar la fase excéntrica en 3 segundos con pausa controlada en el punto de estiramiento máximo genera mucha mayor tensión mecánica que realizar repeticiones con rebote.
4. **Mayor rango de movimiento (ROM):** Bajar 2 centímetros más en sentadilla profunda con el mismo peso incrementa el trabajo mecánico realizado.
5. **Densidad del entrenamiento:** Completar el mismo volumen de series efectivas reduciendo los descansos de 3 minutos a 2 minutos manteniendo las cargas.

---

### El papel del RIR (Repeticiones en Reserva)

Para que una serie cuente como estímulo hipertrófico efectivo, debe acercarse al fallo muscular real:
* **RIR 1-3:** La zona óptima de estímulo/fatiga para la mayoría de series efectivas.
* **RIR 0 (Fallo muscular):** Excelente para la última serie de ejercicios en máquina o aislamiento, pero debe dosificarse en ejercicios multiarticulares pesados para no disparar la fatiga del sistema nervioso central.

> [!IMPORTANT]
> Registrar rigurosamente cada serie, carga y repeticiones en tu aplicación es el 50% del éxito. Sin datos históricos, estás adivinando en lugar de progresar.`
      },
      {
        title: 'Déficit Calórico Inteligente: Cómo Perder Grasa sin Perder Músculo',
        slug: 'deficit-calorico-inteligente-perder-grasa-preservar-musculo',
        category: 'Nutrición',
        reading_time: 5,
        summary: 'Estrategia paso a paso para definir tu físico: cálculo del déficit óptimo, cantidad de proteína necesaria y cómo evitar que tu metabolismo se ralentice.',
        image_url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80',
        tags: 'deficit calorico, perdida de grasa, definicion, macros, proteina',
        author_name: 'Nutricionista Deportivo Pro Fitness',
        seo_title: 'Déficit Calórico: Perder Grasa y Mantener Músculo | Guía',
        seo_description: 'Aprende a estructurar un déficit calórico moderado para perder grasa manteniendo tu fuerza y masa muscular. Consejos de macros y timing.',
        content: `## Perder grasa no tiene por qué significar pasar hambre

El único requisito termodinámico ineludible para oxidar grasa corporal es mantener un **balance energético negativo** (ingerir menos calorías de las que tu organismo gasta). Sin embargo, un déficit mal planteado puede destruir tu masa muscular, tu energía en el gimnasio y tu perfil hormonal.

---

### El cálculo del déficit perfecto: Ni muy lento, ni muy agresivo

* **Déficit moderado óptimo:** Un recorte de entre el **15% y el 20%** sobre tus calorías de mantenimiento diario (habitualmente entre 300 y 500 kcal).
* **Ritmo seguro de pérdida de peso:** Entre el **0.5% y el 1% de tu peso corporal por semana**. Si pesas 80 kg, perder entre 400 g y 800 g semanales garantiza que el 85-90% de lo perdido sea tejido adiposo y no masa magra.

---

### Los 3 pilares para blindar tu músculo en definición

1. **Proteína elevada (1.8 a 2.4 g/kg):** Cuando la disponibilidad energética es baja, el cuerpo recurre a la gluconeogénesis con mayor facilidad. Una ingesta alta de aminoácidos protege tu masa muscular y maximiza la saciedad.
2. **Mantener la intensidad del entrenamiento:** No cometas el error de cambiar a "series de 20 repeticiones con poco peso para definir". Las series pesadas de 6 a 12 repeticiones son la señal principal que le dice al cuerpo: *"Necesito este músculo para sobrevivir, no lo consumas"*.
3. **NEAT y pasos diarios:** Caminar entre 8.000 y 12.000 pasos al día permite quemar calorías adicionales sin generar fatiga que interfiera con tus sesiones de fuerza en el gimnasio.`
      }
    ];

    await News.bulkCreate(initialArticles);
    console.log('✅ Artículos iniciales de noticias sembrados con éxito.');
  } catch (error) {
    console.warn('Advertencia al sembrar noticias iniciales:', error.message);
  }
};
