// Theme configuration based on PromptAPP.md specifications
export const lightTheme = {
  colors: {
    // Primary colors
    primary: '#007AFF',
    onPrimary: '#FFFFFF',
    primaryContainer: '#E3F2FD',
    onPrimaryContainer: '#001D36',
    
    // Secondary colors
    secondary: '#625B71',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#E8DEF8',
    onSecondaryContainer: '#1E192B',
    
    // Surface colors
    surface: '#FFFFFF',
    onSurface: '#1C1B1F',
    surfaceVariant: '#F3F3F3',
    onSurfaceVariant: '#49454F',
    
    // Background colors
    background: '#F8F9FA',
    onBackground: '#1C1B1F',
    
    // Error colors
    error: '#E74C3C',
    onError: '#FFFFFF',
    errorContainer: '#F9DEDC',
    onErrorContainer: '#410E0B',
    
    // Success colors
    success: '#2ECC71',
    onSuccess: '#FFFFFF',
    successContainer: '#D4F4DD',
    onSuccessContainer: '#002204',
    
    // Warning colors
    warning: '#F39C12',
    onWarning: '#FFFFFF',
    warningContainer: '#FFDBCF',
    onWarningContainer: '#2D1600',
    
    // Info colors
    info: '#3498DB',
    onInfo: '#FFFFFF',
    infoContainer: '#D0E4FF',
    onInfoContainer: '#001D36',
    
    // Neutral colors
    outline: '#E0E0E0',
    outlineVariant: '#CAC4D0',
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#313033',
    inverseOnSurface: '#F4EFF4',
    inversePrimary: '#A6C8FF',
    
    // Custom colors for app
    cardBackground: '#FFFFFF',
    divider: '#E5E5E5',
    placeholder: '#9E9E9E',
    disabled: '#BDBDBD',
    
    // Status colors
    active: '#4CAF50',
    inactive: '#9E9E9E',
    pending: '#FF9800',
    completed: '#2196F3',
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
    
    // Primary colors (darker theme)
    primary: '#A6C8FF',
    onPrimary: '#003258',
    primaryContainer: '#004A77',
    onPrimaryContainer: '#D0E4FF',
    
    // Surface colors (darker theme)
    surface: '#121212',
    onSurface: '#E6E1E5',
    surfaceVariant: '#1E1E1E',
    onSurfaceVariant: '#CAC4D0',
    
    // Background colors (darker theme)
    background: '#000000',
    onBackground: '#E6E1E5',
    
    // Custom colors for dark theme
    cardBackground: '#1E1E1E',
    divider: '#2C2C2C',
    placeholder: '#757575',
    disabled: '#555555'
  }
};

export type Theme = typeof lightTheme;

export const getTheme = (isDark: boolean): Theme => {
  return isDark ? darkTheme : lightTheme;
};