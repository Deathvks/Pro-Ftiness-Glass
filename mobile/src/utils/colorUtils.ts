export function getContrastColor(hexColor: string, theme: string): string {
    let r = 0, g = 0, b = 0;
    if (hexColor.startsWith('#')) {
        hexColor = hexColor.substring(1);
    }
    if (hexColor.length === 3) {
        r = parseInt(hexColor.charAt(0) + hexColor.charAt(0), 16);
        g = parseInt(hexColor.charAt(1) + hexColor.charAt(1), 16);
        b = parseInt(hexColor.charAt(2) + hexColor.charAt(2), 16);
    } else if (hexColor.length === 6) {
        r = parseInt(hexColor.substring(0, 2), 16);
        g = parseInt(hexColor.substring(2, 4), 16);
        b = parseInt(hexColor.substring(4, 6), 16);
    } else {
        return ['light', 'ocean', 'desert'].includes(theme) ? '#111827' : '#FFFFFF';
    }

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const isLightTheme = ['light', 'ocean', 'desert'].includes(theme);

    if (isLightTheme) {
        return luminance > 0.6 ? '#111827' : '#' + hexColor; 
    } else {
        return luminance < 0.3 ? '#FFFFFF' : '#' + hexColor;
    }
}
