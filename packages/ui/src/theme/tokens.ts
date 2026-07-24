export const colors = {
  primary: {
    50: '#EBF5FF',
    100: '#D6EBFF',
    200: '#ADD6FF',
    300: '#85C1FF',
    400: '#5CACFF',
    500: '#2196F3',
    600: '#1976D2',
    700: '#1565C0',
    800: '#0D47A1',
    900: '#0A3069',
  },
  neutral: {
    0: '#FFFFFF',
    50: '#F7F8FA',
    100: '#EEEFF2',
    200: '#D9DBE0',
    300: '#B8BCC5',
    400: '#9BA0AB',
    500: '#767C89',
    600: '#595E6A',
    700: '#3D4250',
    800: '#23272F',
    900: '#141720',
  },
  success: '#28A745',
  warning: '#FFC107',
  error: '#E53E3E',
  info: '#2196F3',
  chartPalette: [
    '#4DC4FF', '#FF6B6B', '#51CF66', '#FFD43B',
    '#CC5DE8', '#FF922B', '#20C997', '#748FFC',
    '#F06595', '#845EF7', '#FFA94D', '#69DB7C',
  ],
  editor: {
    background: '#FFFFFF',
    gutterBg: '#F7F8FA',
    lineNumber: '#9BA0AB',
    cursor: '#23272F',
    selection: '#D6EBFF',
    keyword: '#1976D2',
    string: '#28A745',
    number: '#E53E3E',
    comment: '#9BA0AB',
    table: '#CC5DE8',
    column: '#23272F',
  },
} as const;

export const spacing = {
  xs: '4px', sm: '8px', md: '12px', lg: '16px',
  xl: '24px', xxl: '32px', xxxl: '48px',
} as const;

export const radius = {
  sm: '4px', md: '6px', lg: '8px', xl: '12px', full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 2px 8px rgba(0,0,0,0.08)',
  lg: '0 4px 16px rgba(0,0,0,0.12)',
  card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
} as const;

export const typography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  monoFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
  sizes: {
    xs: '11px', sm: '13px', md: '14px', lg: '16px',
    xl: '20px', xxl: '24px', xxxl: '32px',
  },
} as const;
