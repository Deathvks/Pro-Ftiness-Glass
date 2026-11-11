import { createHash } from 'node:crypto';
import sharp from 'sharp';

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

const DEFAULT_POOL = [
  'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=1200&q=80'
];

const SITE_URL = 'https://profitnessglass.es';
const UNSPLASH_HOST = 'images.unsplash.com';
const RETIRED_PHOTOS = new Set(['photo-1550572017-edd951aa8f72', 'photo-1510519138197-06b8628cbf4f']);

function coverUrl(image) {
  if (typeof image !== 'string' || !image.trim()) return null;
  try {
    const url = new URL(image.trim(), SITE_URL);
    return ['http:', 'https:'].includes(url.protocol) ? url : null;
  } catch {
    return null;
  }
}

function unsplashId(url) {
  return url?.hostname === UNSPLASH_HOST && /^\/photo-\d+-[a-f\d]+$/i.test(url.pathname)
    ? url.pathname.slice(1)
    : null;
}

export const editorialCoverPath = slug => '/api/news/cover/' + encodeURIComponent(slug);

export function coverIdentity(image) {
  const url = coverUrl(image);
  if (!url) return null;
  const photo = unsplashId(url);
  if (photo) return 'unsplash:' + photo;
  return url.host + url.pathname + url.search;
}

export function isEditorialCover(image, slug) {
  const url = coverUrl(image);
  return url?.origin === SITE_URL && (slug ? url.pathname === editorialCoverPath(slug) : url.pathname.startsWith('/api/news/cover/'));
}

export function isMissingCover(image) {
  const url = coverUrl(image);
  return !url || url.pathname === '/entrenamiento.png' || RETIRED_PHOTOS.has(unsplashId(url));
}

export function createCoverInspector(fetchImage = fetch) {
  const checks = new Map();
  return function inspect(image) {
    if (isMissingCover(image)) return Promise.resolve('broken');
    const url = coverUrl(image);
    const photo = unsplashId(url);
    if (!photo) return Promise.resolve('unchecked');

    if (!checks.has(photo)) {
      const source = new URL('/' + photo, 'https://' + UNSPLASH_HOST);
      source.search = '?auto=format&fit=crop&w=1200&q=80';
      checks.set(photo, (async () => {
        try {
          const response = await fetchImage(source, {
            headers: { Range: 'bytes=0-1023' },
            redirect: 'error',
            signal: AbortSignal.timeout(4000),
          });
          await response.body?.cancel();
          if (response.ok) return /^image\//i.test(response.headers.get('content-type') || '') ? 'ok' : 'broken';
          return [404, 410].includes(response.status) ? 'broken' : 'unchecked';
        } catch {
          return 'unchecked';
        }
      })());
    }
    return checks.get(photo);
  };
}

export async function selectNewsCover({ category, slug, used, inspect = createCoverInspector() }) {
  const topic = String(category ?? '').trim().toLowerCase();
  const pool = Object.entries(CATEGORY_IMAGE_POOLS).find(([name]) => name.toLowerCase() === topic)?.[1] ?? DEFAULT_POOL;
  const available = pool.filter(image => !used.has(coverIdentity(image)));

  while (available.length) {
    const batch = [];
    while (batch.length < 3 && available.length) {
      const index = Math.floor(Math.random() * available.length);
      batch.push(available.splice(index, 1)[0]);
    }
    const status = await Promise.all(batch.map(inspect));
    const usable = batch[status.indexOf('ok')];
    if (usable) return usable;
  }
  return slug ? editorialCoverPath(slug) : null;
}

export async function getUsedNewsCoverIdentities(News, where) {
  const images = await News.findAll({ attributes: ['image_url'], where, raw: true });
  return new Set(images.map(article => coverIdentity(article.image_url)).filter(Boolean));
}

export async function coverForPublication({ requested, category, slug, used }) {
  if (isEditorialCover(requested, slug)) return editorialCoverPath(slug);
  const inspect = createCoverInspector();
  const identity = coverIdentity(requested);
  if (identity && !used.has(identity) && !isEditorialCover(requested)) {
    const status = await inspect(requested);
    if (status === 'ok' || (status === 'unchecked' && !unsplashId(coverUrl(requested)))) return requested.trim();
  }
  return selectNewsCover({ category, slug, used, inspect });
}

export async function planNewsCoverRepairs(articles, inspect = createCoverInspector()) {
  const used = new Set(articles.map(article => coverIdentity(article.image_url)).filter(Boolean));
  const seen = new Set();
  const repairs = [];

  // Probe in small batches to avoid opening a connection for every article at once.
  for (let offset = 0; offset < articles.length; offset += 6) {
    const batch = articles.slice(offset, offset + 6);
    const status = await Promise.all(batch.map(article => inspect(article.image_url)));
    for (const [index, article] of batch.entries()) {
      const identity = coverIdentity(article.image_url);
      const wrongEditorialCover = isEditorialCover(article.image_url) && !isEditorialCover(article.image_url, article.slug);
      if (identity && status[index] !== 'broken' && !wrongEditorialCover && !seen.has(identity)) {
        seen.add(identity);
        continue;
      }
      const newImage = await selectNewsCover({ category: article.category, slug: article.slug, used, inspect });
      used.add(coverIdentity(newImage));
      seen.add(coverIdentity(newImage));
      repairs.push({ article, newImage });
    }
  }
  return repairs;
}

let coverWrite = Promise.resolve();

export function serializeCoverWrite(work) {
  const next = coverWrite.then(work);
  coverWrite = next.catch(() => {});
  return next;
}

const escapeXml = value => String(value).replace(/[<>&"']/g, character =>
  ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character]);

function wrapCoverTitle(title) {
  const lines = [];
  let line = '';
  const words = String(title).trim().split(/\s+/).flatMap(word => word.match(/.{1,24}/gu) ?? []);
  for (const word of words) {
    if (line && line.length + word.length > 27) {
      lines.push(line);
      line = '';
    }
    line = line ? line + ' ' + word : word;
  }
  if (line) lines.push(line);
  if (lines.length > 4) return [...lines.slice(0, 3), lines[3].slice(0, 26) + '…'];
  return lines;
}

export function renderEditorialCover({ slug, title, category }) {
  const seed = createHash('sha256').update(slug).digest();
  const hue = seed[0] * 360 / 256;
  const circles = [0, 1, 2].map(index =>
    '<circle cx="' + (820 + seed[index + 1]) + '" cy="' + (150 + seed[index + 4]) +
    '" r="' + (155 + index * 105) + '" fill="none" stroke="hsl(' + hue + ', 68%, 72%)" stroke-opacity=".22" stroke-width="3"/>');
  const titleLines = wrapCoverTitle(title).map((line, index) =>
    '<tspan x="86" y="' + (265 + index * 72) + '">' + escapeXml(line) + '</tspan>');
  const artwork = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">',
    '<defs><linearGradient id="background" x2="1" y2="1"><stop stop-color="#111827"/><stop offset="1" stop-color="hsl(' + hue + ', 57%, 25%)"/></linearGradient></defs>',
    '<rect width="1200" height="675" fill="url(#background)"/>',
    ...circles,
    '<g font-family="sans-serif" font-weight="700">',
    '<text x="86" y="130" font-size="28" fill="#e2e8f0">' + escapeXml(String(category).slice(0, 45)) + '</text>',
    '<text font-size="60" fill="#ffffff">' + titleLines.join('') + '</text>',
    '<text x="86" y="600" font-size="23" fill="#e2e8f0">PRO FITNESS GLASS</text>',
    '</g></svg>',
  ].join('');
  return sharp(Buffer.from(artwork)).jpeg({ quality: 86 }).toBuffer();
}
