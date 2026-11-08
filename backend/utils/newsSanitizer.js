/* backend/utils/newsSanitizer.js */

/**
 * Sanitiza y normaliza el contenido editorial en Markdown generado por IA o editado manualmente.
 * - Desescapa secuencias literales "\n" o "\r" si el texto viene de serializaciones crudas.
 * - Corrige corchetes y etiquetas textuales sueltas ([EVIDENCIA CIENTÍFICA], [!IMPORTANT]) convirtiéndolas en alertas limpias.
 * - Auto-vincula herramientas públicas (Calculadora 1RM, Macros, Ejercicios) si aparecen como texto plano.
 * - Elimina almohadillas crudas (## o ###) dentro de alertas (>), transformándolas en títulos en negrita.
 * - Separa subtítulos ## que tengan párrafos pegados en la misma línea para que no se muestre el numeral.
 * - Garantiza que los corchetes nunca aparezcan como texto visible sin estilo.
 */
export function sanitizeNewsContent(rawContent = '') {
  if (!rawContent || typeof rawContent !== 'string') return '';

  let content = rawContent;

  // 1. Desescapar secuencias literales "\n" o "\r" si el texto viene de una serialización JSON cruda
  if (content.includes('\\n') || content.includes('\\r')) {
    content = content.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n').replace(/\\r/g, '\n');
  }

  // 2. Normalizar saltos de línea CRLF/CR a LF
  content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 3. Eliminar líneas de cita vacías previas a otra cita (> \n>)
  content = content.replace(/^>\s*\n(?=>)/gm, '');

  // 4. Corregir etiquetas en español con texto directo en la misma línea:
  // E.g.: > Dato Científico: La PAP no incrementa...
  content = content.replace(/^(?:>\s*)?\[?(?:DATO CIENT[IÍ]FICO|EVIDENCIA CIENT[IÍ]FICA|ESTUDIO CIENT[IÍ]FICO)\]?:?\s*([^\r\n]+)$/gim, (m, rest) => {
    return `> [!IMPORTANT]\n> **Dato Científico:** ${rest.trim()}`;
  });
  content = content.replace(/^(?:>\s*)?\[?(?:CONSEJO PR[AÁ]CTICO|CONSEJO)\]?:?\s*([^\r\n]+)$/gim, (m, rest) => {
    return `> [!TIP]\n> **Consejo Práctico:** ${rest.trim()}`;
  });
  content = content.replace(/^(?:>\s*)?\[?(?:ATENCI[OÓ]N|ADVERTENCIA)\]?:?\s*([^\r\n]+)$/gim, (m, rest) => {
    return `> [!WARNING]\n> **Atención:** ${rest.trim()}`;
  });
  content = content.replace(/^(?:>\s*)?\[?(?:NOTA CLAVE|NOTA|APUNTE|DESMINTIENDO EL MITO)\]?:?\s*([^\r\n]+)$/gim, (m, rest) => {
    return `> [!NOTE]\n> **Nota:** ${rest.trim()}`;
  });

  // 5. Corregir etiquetas en su propia línea aislada
  content = content.replace(/^(?:>\s*)?\[?(?:EVIDENCIA CIENT[IÍ]FICA|ESTUDIO CIENT[IÍ]FICO|DATO CIENT[IÍ]FICO)\]?:?\s*$/gim, '> [!IMPORTANT]');
  content = content.replace(/^(?:>\s*)?\[?(?:CONSEJO PR[AÁ]CTICO|CONSEJO)\]?:?\s*$/gim, '> [!TIP]');
  content = content.replace(/^(?:>\s*)?\[?(?:ATENCI[OÓ]N|ADVERTENCIA)\]?:?\s*$/gim, '> [!WARNING]');
  content = content.replace(/^(?:>\s*)?\[?(?:NOTA CLAVE|NOTA|APUNTE|DESMINTIENDO EL MITO)\]?:?\s*$/gim, '> [!NOTE]');

  // 6. Si una línea de alerta lleva corchete de tipo con texto pegado: [!IMPORTANT] Texto... -> > [!IMPORTANT]\n> Texto...
  content = content.replace(/^(?:>\s*)?\[!(IMPORTANT|TIP|WARNING|NOTE|CAUTION)\][^\S\r\n]+([^\r\n]+)$/gim, (m, type, rest) => {
    return `> [!${type.toUpperCase()}]\n> ${rest.trim()}`;
  });

  // 7. Limpieza de marcadores de cita duplicados o anidados accidentalmente
  content = content.replace(/^>\s*>+\s*/gm, '> ');

  // 8. Títulos en negrita dentro de citas en lugar de almohadillas
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

  // 9. Auto-vincular herramientas públicas de Pro Fitness Glass si aparecen mencionadas en texto plano sin enlace Markdown
  content = content.replace(/(?<!\[)Calculadora de 1RM y Porcentajes(?![^\[]*\])(?!\([^\)]*\))/g, '[Calculadora de 1RM y Porcentajes](/calculadora-1rm)');
  content = content.replace(/(?<!\[)Calculadora de 1RM(?![^\[]*\])(?!\([^\)]*\))/g, '[Calculadora de 1RM](/calculadora-1rm)');
  content = content.replace(/(?<!\[)Calculadora de Calor[ií]as y Macros(?![^\[]*\])(?!\([^\)]*\))/g, '[Calculadora de Calorías y Macros](/calculadora-calorias-macros)');
  content = content.replace(/(?<!\[)Gu[ií]a de Ejercicios y Rutinas de Gimnasio(?![^\[]*\])(?!\([^\)]*\))/g, '[Guía de Ejercicios y Rutinas de Gimnasio](/ejercicios)');
  content = content.replace(/(?<!\[)Gu[ií]a de Ejercicios de Gimnasio(?![^\[]*\])(?!\([^\)]*\))/g, '[Guía de Ejercicios de Gimnasio](/ejercicios)');

  // 10. Si un subtítulo ## fuera de alerta tiene el párrafo pegado en la misma línea:
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

  let finalResult = sanitizedLines.join('\n');
  finalResult = finalResult.replace(/\n{3,}/g, '\n\n');
  return finalResult;
}

export default sanitizeNewsContent;
