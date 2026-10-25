/* backend/utils/newsSanitizer.js */

/**
 * Sanitiza y normaliza el contenido editorial en Markdown generado por IA o editado manualmente.
 * - Corrige corchetes y etiquetas textuales sueltas ([EVIDENCIA CIENTÍFICA], [!IMPORTANT]) convirtiéndolas en alertas limpias.
 * - Elimina almohadillas crudas (## o ###) dentro de alertas (>), transformándolas en títulos en negrita.
 * - Separa subtítulos ## que tengan párrafos pegados en la misma línea para que no se muestre el numeral.
 * - Garantiza que los corchetes nunca aparezcan como texto visible sin estilo.
 */
export function sanitizeNewsContent(rawContent = '') {
  if (!rawContent || typeof rawContent !== 'string') return '';

  let text = rawContent;
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  text = text.replace(/^(?:>\s*)?\[?(?:EVIDENCIA CIENT[IÍ]FICA|ESTUDIO CIENT[IÍ]FICO)\]?:?\s*$/gim, '> [!IMPORTANT]');
  text = text.replace(/^(?:>\s*)?\[?(?:CONSEJO PR[AÁ]CTICO|CONSEJO)\]?:?\s*$/gim, '> [!TIP]');
  text = text.replace(/^(?:>\s*)?\[?(?:ATENCI[OÓ]N|ADVERTENCIA)\]?:?\s*$/gim, '> [!WARNING]');
  text = text.replace(/^(?:>\s*)?\[?(?:NOTA CLAVE|NOTA|APUNTE)\]?:?\s*$/gim, '> [!NOTE]');

  text = text.replace(/^(?:>\s*)?\[!(IMPORTANT|TIP|WARNING|NOTE|CAUTION)\][^\S\r\n]+([^\r\n]+)$/gim, (m, type, rest) => {
    return `> [!${type.toUpperCase()}]\n> ${rest.trim()}`;
  });

  // Limpieza de marcadores de cita duplicados o anidados accidentalmente
  text = text.replace(/^>\s*>+\s*/gm, '> ');

  text = text.replace(/^>\s*#{1,4}\s*(.+)$/gm, (m, heading) => {
    const raw = heading.trim();
    const qSplit = raw.match(/^(.{4,65}\?)\s+([A-ZÁÉÍÓÚ].{20,})$/);
    if (qSplit) {
      return `> **${qSplit[1].trim()}**\n> ${qSplit[2].trim()}`;
    }
    const cSplit = raw.match(/^([A-ZÁÉÍÓÚ][^:.?]{4,45}:)\s+([A-ZÁÉÍÓÚ].{20,})$/);
    if (cSplit) {
      return `> **${cSplit[1].trim()}**\n> ${cSplit[2].trim()}`;
    }
    return `> **${raw}**`;
  });

  const lines = text.split('\n');
  const sanitizedLines = [];

  for (let line of lines) {
    const trimmed = line.trim();
    if (/^#{1,3}\s+/.test(trimmed)) {
      const level = trimmed.match(/^#+/)[0];
      const raw = trimmed.replace(/^#+\s*/, '').trim();

      const qSplit = raw.match(/^(.{4,65}\?)\s+([A-ZÁÉÍÓÚ].{25,})$/);
      if (qSplit) {
        sanitizedLines.push(`${level} ${qSplit[1].trim()}`);
        sanitizedLines.push('');
        sanitizedLines.push(qSplit[2].trim());
        continue;
      }

      const cSplit = raw.match(/^([A-ZÁÉÍÓÚ][^:.?]{4,45}:)\s+([A-ZÁÉÍÓÚ].{30,})$/);
      if (cSplit) {
        sanitizedLines.push(`${level} ${cSplit[1].trim()}`);
        sanitizedLines.push('');
        sanitizedLines.push(cSplit[2].trim());
        continue;
      }

      const tSplit = raw.match(/^([A-ZÁÉÍÓÚ][a-zà-ÿA-Z0-9\s]{4,45})\s+([A-ZÁÉÍÓÚ][a-zà-ÿ].{30,})$/);
      if (tSplit) {
        sanitizedLines.push(`${level} ${tSplit[1].trim()}`);
        sanitizedLines.push('');
        sanitizedLines.push(tSplit[2].trim());
        continue;
      }
    }
    sanitizedLines.push(line);
  }

  return sanitizedLines.join('\n');
}

export default sanitizeNewsContent;
