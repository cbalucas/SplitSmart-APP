// Theme configuration based on PromptAPP.md specifications
import { AppColors, getAppColors } from './colors';
export const lightTheme = {
  colors: {
    // Primary colors usando AppColors
    primary: AppColors.primary.light,
    onPrimary: AppColors.text.light.onPrimary,
    primaryContainer: AppColors.primary.container.light,
    onPrimaryContainer: '#001D36',
    
    // Secondary colors
    secondary: '#625B71',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#E8DEF8',
    onSecondaryContainer: '#1E192B',
    
    // Surface colors usando AppColors
    surface: AppColors.surface.light.primary,
    onSurface: AppColors.text.light.onSurface,
    surfaceVariant: AppColors.surface.light.secondary,
    onSurfaceVariant: AppColors.text.light.secondary,
    
    // Background colors usando AppColors
    background: AppColors.surface.light.variant,
    onBackground: AppColors.text.light.primary,
    
    // Error colors usando AppColors
    error: AppColors.status.error.light,
    onError: '#FFFFFF',
    errorContainer: AppColors.status.error.container.light,
    onErrorContainer: '#410E0B',
    
    // Success colors usando AppColors
    success: AppColors.status.success.light,
    onSuccess: '#FFFFFF',
    successContainer: AppColors.status.success.container.light,
    onSuccessContainer: '#002204',
    
    // Warning colors usando AppColors
    warning: AppColors.status.warning.light,
    onWarning: '#FFFFFF',
    warningContainer: AppColors.status.warning.container.light,
    onWarningContainer: '#2D1600',
    
    // Info colors usando AppColors
    info: AppColors.status.info.light,
    onInfo: '#FFFFFF',
    infoContainer: AppColors.status.info.container.light,
    onInfoContainer: '#001D36',
    
    // Neutral colors usando AppColors
    outline: AppColors.border.light.primary,
    outlineVariant: AppColors.border.light.secondary,
    shadow: AppColors.special.light.shadow,
    scrim: AppColors.special.light.shadow,
    inverseSurface: '#313033',
    inverseOnSurface: '#F4EFF4',
    inversePrimary: '#A6C8FF',
    
    // Custom colors usando AppColors
    cardBackground: AppColors.surface.light.elevated,
    divider: AppColors.special.light.divider,
    placeholder: AppColors.special.light.placeholder,
    disabled: AppColors.text.light.disabled,
    
    // Status colors usando AppColors
    active: AppColors.interactive.light.active,
    inactive: AppColors.interactive.light.inactive,
    pending: AppColors.status.warning.light,
    completed: AppColors.status.info.light,
    archived: '#9C27B0'
  },
  
  typography: {
    // Display styles
    displayLarge: {
      fontSize: 57,
      lineHeight: 64,
      fontWeight: '400' as const,
      letterSpacing: -0.25
    },
    displayMedium: {
      fontSize: 45,
      lineHeight: 52,
      fontWeight: '400' as const,
      letterSpacing: 0
    },
    displaySmall: {
      fontSize: 36,
      lineHeight: 44,
      fontWeight: '400' as const,
      letterSpacing: 0
    },
    
    // Headline styles
    headlineLarge: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '400' as const,
      letterSpacing: 0
    },
    headlineMedium: {
      fontSize: 28,
      lineHeight: 36,
      fontWeight: '400' as const,
      letterSpacing: 0
    },
    headlineSmall: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '400' as const,
      letterSpacing: 0
    },
    
    // Title styles
    titleLarge: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '500' as const,
      letterSpacing: 0
    },
    titleMedium: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '500' as const,
      letterSpacing: 0.15
    },
    titleSmall: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500' as const,
      letterSpacing: 0.1
    },
    
    // Body styles
    bodyLarge: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400' as const,
      letterSpacing: 0.15
    },
    bodyMedium: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400' as const,
      letterSpacing: 0.25
    },
    bodySmall: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400' as const,
      letterSpacing: 0.4
    },
    
    // Label styles
    labelLarge: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500' as const,
      letterSpacing: 0.1
    },
    labelMedium: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '500' as const,
      letterSpacing: 0.5
    },
    labelSmall: {
      fontSize: 11,
      lineHeight: 16,
      fontWeight: '500' as const,
      letterSpacing: 0.5
    }
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
  },
  
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999
  },
  
  elevation: {
    none: 0,
    small: 2,
    medium: 4,
    large: 8,
    xlarge: 16
  }
};

export const darkTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    
    // Primary colors usando AppColors - Verde fluor vibrante para elementos interactivos
    primary: AppColors.primary.dark,
    onPrimary: AppColors.text.dark.onPrimary,
    primaryContainer: AppColors.primary.container.dark,
    onPrimaryContainer: AppColors.text.dark.onPrimary,
    
    // Secondary colors - mejor contraste
    secondary: '#B8A7C8',
    onSecondary: '#2A1E35',
    secondaryContainer: '#41344C',
    onSecondaryContainer: '#D4C3E4',
    
    // Surface colors usando AppColors - mayor contraste y separación
    surface: AppColors.surface.dark.primary,
    onSurface: AppColors.text.dark.onSurface,
    surfaceVariant: AppColors.surface.dark.variant,
    onSurfaceVariant: AppColors.text.dark.secondary,
    
    // Background colors usando AppColors - más separación visual
    background: '#0F0F0F',
    onBackground: AppColors.text.dark.primary,
    
    // Error colors usando AppColors - más visibles en oscuro
    error: AppColors.status.error.dark,
    onError: '#FFFFFF',
    errorContainer: AppColors.status.error.container.dark,
    onErrorContainer: '#FFD6D6',
    
    // Success colors usando AppColors - mejor contraste
    success: AppColors.status.success.dark,
    onSuccess: '#FFFFFF',
    successContainer: AppColors.status.success.container.dark,
    onSuccessContainer: '#C8E6C9',
    
    // Warning colors usando AppColors - más visibles
    warning: AppColors.status.warning.dark,
    onWarning: '#1A1A1A',
    warningContainer: AppColors.status.warning.container.dark,
    onWarningContainer: '#FFE0B2',
    
    // Info colors usando AppColors - mejor contraste
    info: AppColors.status.info.dark,
    onInfo: '#FFFFFF',
    infoContainer: AppColors.status.info.container.dark,
    onInfoContainer: '#BBDEFB',
    
    // Neutral colors usando AppColors - mayor contraste
    outline: AppColors.border.dark.primary,
    outlineVariant: AppColors.border.dark.secondary,
    shadow: AppColors.special.dark.shadow,
    scrim: AppColors.special.dark.shadow,
    inverseSurface: '#E6E1E5',
    inverseOnSurface: '#2E2D31',
    inversePrimary: '#006491',
    
    // Custom colors usando AppColors - mejor separación
    cardBackground: AppColors.surface.dark.secondary,
    divider: AppColors.special.dark.divider,
    placeholder: AppColors.special.dark.placeholder,
    disabled: AppColors.text.dark.disabled,
    
    // Status colors usando AppColors - mejorados para modo oscuro
    active: AppColors.interactive.dark.active,
    inactive: AppColors.interactive.dark.inactive,
    pending: AppColors.status.warning.dark,
    completed: AppColors.status.info.dark,
    archived: '#AB47BC'
  }
};

export type Theme = typeof lightTheme;

export const getTheme = (isDark: boolean): Theme => {
  return isDark ? darkTheme : lightTheme;
};