// Theme utility functions for dynamic theming

export const generateThemeColors = (baseColor: string) => {
  const colors = {
    primary: baseColor,
    primaryLight: lightenColor(baseColor, 20),
    primaryDark: darkenColor(baseColor, 20),
    primaryLighter: lightenColor(baseColor, 40),
    primaryDarker: darkenColor(baseColor, 40),
  };
  
  return colors;
};

export const lightenColor = (color: string, percent: number): string => {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  
  return '#' + (
    0x1000000 +
    (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)
  ).toString(16).slice(1);
};

export const darkenColor = (color: string, percent: number): string => {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  
  return '#' + (
    0x1000000 +
    (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
    (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
    (B > 255 ? 255 : B < 0 ? 0 : B)
  ).toString(16).slice(1);
};

export const getContrastColor = (backgroundColor: string): string => {
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#FFFFFF';
};

export const generateCSSVariables = (theme: Record<string, string>): string => {
  return Object.entries(theme)
    .map(([key, value]) => `--${key}: ${value};`)
    .join('\n');
};

export const replaceHardcodedColors = (styles: Record<string, any>): Record<string, any> => {
  const colorMap: Record<string, string> = {
    '#3B82F6': 'var(--primary-500)',
    '#1D4ED8': 'var(--primary-700)',
    '#60A5FA': 'var(--primary-400)',
    '#DBEAFE': 'var(--primary-100)',
    '#EFF6FF': 'var(--primary-50)',
    '#1E40AF': 'var(--primary-800)',
    '#1E3A8A': 'var(--primary-900)',
  };

  const processedStyles: Record<string, any> = {};
  
  Object.entries(styles).forEach(([key, value]) => {
    if (typeof value === 'string' && value.includes('#')) {
      let processedValue = value;
      Object.entries(colorMap).forEach(([oldColor, newColor]) => {
        processedValue = processedValue.replace(new RegExp(oldColor, 'g'), newColor);
      });
      processedStyles[key] = processedValue;
    } else {
      processedStyles[key] = value;
    }
  });
  
  return processedStyles;
};

export const createThemeTransition = (duration: number = 200): string => {
  return `transition: all ${duration}ms ease-in-out`;
};

export const getThemeValue = (key: string, fallback: string = ''): string => {
  if (typeof window !== 'undefined') {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(`--${key}`)
      .trim();
    return value || fallback;
  }
  return fallback;
};

export const setThemeValue = (key: string, value: string): void => {
  if (typeof window !== 'undefined') {
    document.documentElement.style.setProperty(`--${key}`, value);
  }
};

export const generateThemeFromImage = async (): Promise<Record<string, string>> => {
  // In a real app, you might analyze an image to extract dominant colors
  // For now, return a default theme
  return {
    primary: '#3b82f6',
    secondary: '#6b7280',
    accent: '#f59e0b',
    background: '#ffffff',
    surface: '#f9fafb',
    text: '#111827',
    'text-secondary': '#6b7280'
  };
}; 