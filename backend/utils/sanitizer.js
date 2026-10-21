/* backend/utils/sanitizer.js */
import sanitizeHtml from 'sanitize-html';

/**
 * Sanitiza texto plano eliminando completamente cualquier etiqueta HTML, scripts o atributos peligrosos (onerror, onclick, etc.).
 * Ideal para: comentarios de rutinas, mensajes de chat, nombres de usuario, biografías y notas de entrenamientos.
 */
export const sanitizePlainText = (input) => {
  if (typeof input !== 'string') return input;

  // 1. Parser estricto: cero etiquetas y cero atributos permitidos
  const cleaned = sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard'
  });

  // 2. Desactivar prefijos de ejecución javascript: y data:text/html
  return cleaned
    .replace(/javascript\s*:/gi, '')
    .replace(/data\s*:\s*text\/html/gi, '')
    .trim();
};

/**
 * Sanitiza contenido editorial o Markdown manteniendo formato seguro (p, b, i, links seguros)
 * pero bloqueando absolutamente scripts, iframes, onerror, onclick y esquemas no seguros.
 */
export const sanitizeRichText = (input) => {
  if (typeof input !== 'string') return input;

  return sanitizeHtml(input, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'span'],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      span: ['class']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' })
    }
  }).trim();
};
