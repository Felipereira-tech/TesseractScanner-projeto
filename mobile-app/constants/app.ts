// Cores
export const COLORS = {
  primary: '#7C3AED',
  secondary: '#4F46E5',
  background: '#F7F8FC',
  white: '#FFFFFF',
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    light: '#bec3ce',
  },
  border: '#E5E7EB',
  error: '#DC2626',
  success: '#10B981',
} as const;

// Dimensões e Espaçamento
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const BORDER_RADIUS = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  xxl: 16,
  round: 20,
} as const;

// Tipografia
export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
} as const;

export const FONT_WEIGHTS = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
} as const;

// Shadows
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
} as const;

// Timeouts e Delays
export const TIMEOUTS = {
  requestTimeout: 15000,
  debounce: 300,
  animation: 300,
} as const;

// Validações
export const VALIDATION = {
  MIN_QUESTOES: 50,
  MAX_QUESTOES: 90,
  DEFAULT_QUESTOES: 50,
} as const;

// Alternativas
export const ALTERNATIVAS = ['A', 'B', 'C', 'D', 'E'] as const;
