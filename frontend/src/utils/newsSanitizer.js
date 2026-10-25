/* frontend/src/utils/newsSanitizer.js */

/**
 * Sanitiza y normaliza el contenido editorial en Markdown generado por IA o editado manualmente.
 * - Corrige corchetes y etiquetas textuales sueltas ([EVIDENCIA CIENTÍFICA], [!IMPORTANT]) convirtiéndolas en alertas limpias.
 * - Elimina almohadillas crudas (## o ###) dentro de alertas (>), transformándolas en títulos en negrita.
 * - Separa subtítulos ## que tengan párrafos pegados en la misma línea para que no se muestre el numeral.
 * - Garantiza que los corchetes nunca aparezcan como texto visible sin estilo.
 */
export function sanitizeNewsContent(rawContent = '') {
  if (!rawContent || typeof rawContent !== 'string') return '';

  let content = rawContent;

  // 1. Normalizar saltos de línea CRLF/CR a LF
  content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 2. Corregir etiquetas en español o corchetes sueltos convirtiéndolos a alert blocks limpios
  // E.g.: [EVIDENCIA CIENTÍFICA] o EVIDENCIA CIENTÍFICA en su propia línea
  content = content.replace(/^(?:>\s*)?\[?(?:EVIDENCIA CIENT[IÍ]FICA|ESTUDIO CIENT[IÍ]FICO)\]?\s*$/gim, '> [!IMPORTANT]');
  content = content.replace(/^(?:>\s*)?\[?(?:CONSEJO PR[AÁ]CTICO|CONSEJO)\]?\s*$/gim, '> [!TIP]');
  content = content.replace(/^(?:>\s*)?\[?(?:ATENCI[OÓ]N|ADVERTENCIA)\]?\s*$/gim, '> [!WARNING]');
  content = content.replace(/^(?:>\s*)?\[?(?:NOTA CLAVE|NOTA|APUNTE)\]?\s*$/gim, '> [!NOTE]');

  // 3. Si una línea de alerta lleva texto pegado: [!IMPORTANT] Texto... -> > [!IMPORTANT]\n> Texto...
  content = content.replace(/^(?:>\s*)?\[!(IMPORTANT|TIP|WARNING|NOTE|CAUTION)\]\s*(.+)$/gim, (m, type, rest) => {
    return `> [!${type.toUpperCase()}]\n> ${rest.trim()}`;
  });

  // 4. Si dentro de un bloque > hay un ## Subtítulo pegado al texto o ## dentro de la alerta:
  content = content.replace(/^>\s*#{1,4}\s*(.+)$/gm, (m, heading) => {
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

  // 5. Si un subtítulo ## fuera de alerta tiene el párrafo pegado en la misma línea:
  const lines = content.split('\n');
  const sanitizedLines = [];

  for (let line of lines) {
    const trimmed = line.trim();

    // Check if heading line has glued paragraph
    if (/^#{1,3}\s+/.test(trimmed)) {
      const level = trimmed.match(/^#+/)[0];
      const raw = trimmed.replace(/^#+\s*/, '').trim();

      // Question mark split
      const qSplit = raw.match(/^(.{4,65}\?)\s+([A-ZÁÉÍÓÚ].{25,})$/);
      if (qSplit) {
        sanitizedLines.push(`${level} ${qSplit[1].trim()}`);
        sanitizedLines.push('');
        sanitizedLines.push(qSplit[2].trim());
        continue;
      }

      // Colon split
      const cSplit = raw.match(/^([A-ZÁÉÍÓÚ][^:.?]{4,45}:)\s+([A-ZÁÉÍÓÚ].{30,})$/);
      if (cSplit) {
        sanitizedLines.push(`${level} ${cSplit[1].trim()}`);
        sanitizedLines.push('');
        sanitizedLines.push(cSplit[2].trim());
        continue;
      }

      // Title case split
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
