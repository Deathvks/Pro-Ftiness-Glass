/**
 * Utilidades de color y contraste para Liquid Glass UI
 */

/**
 * Devuelve el color de texto/icono con alto contraste (#000000 o #ffffff)
 * para colocar SOBRE un fondo con el color dado (p.ej. sobre un botón o píldora con fondo colors.tint).
 */
export function getContrastTextColor(hexColor: string | null | undefined): string {
  if (!hexColor) return '#ffffff';
  let r = 0, g = 0, b = 0;
  if (hexColor.startsWith('rgb')) {
    const matches = hexColor.match(/\d+/g);
    if (matches && matches.length >= 3) {
      r = parseInt(matches[0], 10) || 0;
      g = parseInt(matches[1], 10) || 0;
      b = parseInt(matches[2], 10) || 0;
    }
  } else {
    let clean = hexColor.replace('#', '');
    if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
    if (clean.length >= 6) {
      r = parseInt(clean.substring(0, 2), 16) || 0;
      g = parseInt(clean.substring(2, 4), 16) || 0;
      b = parseInt(clean.substring(4, 6), 16) || 0;
    }
  }
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000000' : '#ffffff';
}

/**
 * Devuelve el color de acento legible sobre el fondo del tema actual.
 * Si el color de acento se confunde con el fondo, hace fallback a blanco o gris oscuro.
 */
export function getContrastColor(hexColor: string, theme?: string): string {
  if (!hexColor) return '#ffffff';
  let r = 0, g = 0, b = 0;
  let clean = hexColor.replace('#', '');
  if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
  if (clean.length >= 6) {
    r = parseInt(clean.substring(0, 2), 16) || 0;
    g = parseInt(clean.substring(2, 4), 16) || 0;
    b = parseInt(clean.substring(4, 6), 16) || 0;
  } else {
    return ['light', 'ocean', 'desert'].includes(theme || '') ? '#111827' : '#FFFFFF';
  }

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const isLightTheme = ['light', 'ocean', 'desert'].includes(theme || '');

  if (isLightTheme) {
    return luminance > 0.85 ? '#111827' : hexColor;
  } else {
    return luminance < 0.15 ? '#FFFFFF' : hexColor;
  }
}
