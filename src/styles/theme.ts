// Modern Design System Theme Configuration
// Professional color palette and design tokens for 2025

export const theme = {
  colors: {
    // Primary Colors - Professional Blue Gradient
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
    
    // Neutral Grays - Professional Palette
    gray: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
    
    // Status Colors - Accessible & Professional
    status: {
      positive: {
        50: '#f0fdf4',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',
      },
      caution: {
        50: '#fffbeb',
        500: '#f59e0b',
        600: '#d97706',
        700: '#b45309',
      },
      mixed: {
        50: '#fef2f2',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c',
      },
      stable: {
        50: '#f0f9ff',
        500: '#06b6d4',
        600: '#0891b2',
        700: '#0e7490',
      },
    },
    
    // Semantic Colors
    success: {
      50: '#f0fdf4',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
    },
    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
    },
    error: {
      50: '#fef2f2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
    },
    info: {
      50: '#f0f9ff',
      500: '#06b6d4',
      600: '#0891b2',
      700: '#0e7490',
    },
  },
  
  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
    secondary: 'linear-gradient(135deg, #475569 0%, #1e293b 100%)',
    subtle: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    success: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  },
  
  // Shadows & Elevation
  shadows: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },
  
  // Spacing System (8-Point Grid)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
    '4xl': '96px',
  },
  
  // Typography System
  typography: {
    fontFamily: {
      sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
      '5xl': '48px',
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
  },
  
  // Border Radius
  borderRadius: {
    none: '0px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px',
  },
  
  // Transitions
  transitions: {
    fast: '150ms ease-out',
    normal: '250ms ease-out',
    slow: '350ms ease-out',
    bounce: '400ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  
  // Z-Index Layers
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
  
  // Breakpoints
  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

// Type definitions for theme
export type Theme = typeof theme;
export type ColorScale = keyof typeof theme.colors.primary;
export type StatusType = keyof typeof theme.colors.status;
export type SpacingKey = keyof typeof theme.spacing;
export type FontSizeKey = keyof typeof theme.typography.fontSize;

// Helper functions
export const getStatusColor = (status: string) => {
  const statusMap: Record<string, string> = {
    positive: theme.colors.status.positive[500],
    caution: theme.colors.status.caution[500],
    mixed: theme.colors.status.mixed[500],
    stable: theme.colors.status.stable[500],
  };
  return statusMap[status] || theme.colors.gray[500];
};

export const getStatusBgColor = (status: string) => {
  const statusMap: Record<string, string> = {
    positive: theme.colors.status.positive[50],
    caution: theme.colors.status.caution[50],
    mixed: theme.colors.status.mixed[50],
    stable: theme.colors.status.stable[50],
  };
  return statusMap[status] || theme.colors.gray[50];
};

export const getStatusTextColor = (status: string) => {
  const statusMap: Record<string, string> = {
    positive: theme.colors.status.positive[700],
    caution: theme.colors.status.caution[700],
    mixed: theme.colors.status.mixed[700],
    stable: theme.colors.status.stable[700],
  };
  return statusMap[status] || theme.colors.gray[700];
};

export default theme;