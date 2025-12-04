// Paleta de colores centralizada para toda la aplicación
// Estos colores pueden ser utilizados en cualquier pantalla para mantener consistencia

export const AppColors = {
  // Colores primarios - Verde Sistema
  primary: {
    light: '#007AFF',      // Azul original para modo claro
    dark: '#00FF7F',       // Verde fluor vibrante para modo oscuro
    container: {
      light: '#E3F2FD',   // Azul claro para contenedores en modo claro
      dark: '#00B359'      // Verde más opaco para contenedores en modo oscuro
    }
  },

  // Colores de superficie y fondo
  surface: {
    light: {
      primary: '#FFFFFF',     // Superficie principal blanca
      secondary: '#F3F3F3',   // Superficie secundaria gris claro
      variant: '#F8F9FA',     // Variante de superficie
      elevated: '#FFFFFF'     // Superficie elevada (cards)
    },
    dark: {
      primary: '#1E1E1E',     // Superficie principal oscura
      secondary: '#4A4A4A',   // Superficie secundaria (cards) - mucho más claro
      variant: '#525252',     // Variante de superficie - mucho más claro
      elevated: '#4A4A4A'     // Superficie elevada (cards) - mucho más claro
    }
  },

  // Colores de texto
  text: {
    light: {
      primary: '#1C1B1F',     // Texto principal negro
      secondary: '#49454F',   // Texto secundario gris
      disabled: '#999999',    // Texto deshabilitado
      onPrimary: '#FFFFFF',   // Texto sobre color primario
      onSurface: '#1C1B1F'    // Texto sobre superficie
    },
    dark: {
      primary: '#F5F5F5',     // Texto principal blanco
      secondary: '#D0D0D0',   // Texto secundario gris claro
      disabled: '#777777',    // Texto deshabilitado
      onPrimary: '#000000',   // Texto sobre color primario verde
      onSurface: '#F5F5F5'    // Texto sobre superficie oscura
    }
  },

  // Colores de borde y separadores
  border: {
    light: {
      primary: '#E0E0E0',     // Bordes principales
      secondary: '#F0F0F0',   // Bordes secundarios
      focus: '#007AFF',       // Bordes en foco (azul)
      disabled: '#E5E5E5'     // Bordes deshabilitados
    },
    dark: {
      primary: '#606060',     // Bordes principales oscuros - aún más claro
      secondary: '#6A6A6A',   // Bordes secundarios - aún más claro
      focus: '#00FF7F',       // Bordes en foco (verde)
      disabled: '#505050'     // Bordes deshabilitados - aún más claro
    }
  },

  // Colores de estado
  status: {
    success: {
      light: '#2ECC71',       // Verde éxito modo claro
      dark: '#4CAF50',        // Verde éxito modo oscuro
      container: {
        light: '#D4F4DD',     // Contenedor éxito claro
        dark: '#1B4A1D'       // Contenedor éxito oscuro
      }
    },
    error: {
      light: '#E74C3C',       // Rojo error modo claro
      dark: '#FF6B6B',        // Rojo error modo oscuro
      container: {
        light: '#F9DEDC',     // Contenedor error claro
        dark: '#4A1416'       // Contenedor error oscuro
      }
    },
    warning: {
      light: '#F39C12',       // Naranja advertencia modo claro
      dark: '#FFB74D',        // Naranja advertencia modo oscuro
      container: {
        light: '#FFDBCF',     // Contenedor advertencia claro
        dark: '#4A3319'       // Contenedor advertencia oscuro
      }
    },
    info: {
      light: '#3498DB',       // Azul info modo claro
      dark: '#64B5F6',        // Azul info modo oscuro
      container: {
        light: '#D0E4FF',     // Contenedor info claro
        dark: '#1A365D'       // Contenedor info oscuro
      }
    }
  },

  // Colores para elementos interactivos
  interactive: {
    light: {
      active: '#007AFF',      // Estado activo azul
      inactive: '#999999',    // Estado inactivo
      hover: '#E3F2FD',       // Estado hover azul claro
      pressed: '#1976D2',     // Estado presionado azul oscuro
      disabled: '#E5E5E5'     // Estado deshabilitado
    },
    dark: {
      active: '#00FF7F',      // Estado activo verde fluor
      inactive: '#777777',    // Estado inactivo
      hover: '#00B359',       // Estado hover verde opaco
      pressed: '#008A44',     // Estado presionado verde oscuro
      disabled: '#333333'     // Estado deshabilitado
    }
  },

  // Colores especiales para elementos específicos
  special: {
    light: {
      shadow: '#000000',      // Sombras
      overlay: 'rgba(0,0,0,0.5)',  // Overlays/modales
      divider: '#E0E0E0',     // Divisores
      placeholder: '#999999'  // Placeholders
    },
    dark: {
      shadow: '#000000',      // Sombras
      overlay: 'rgba(0,0,0,0.8)',  // Overlays/modales más opacos
      divider: '#606060',     // Divisores oscuros - aún más claro para mejor contraste
      placeholder: '#AAAAAA'  // Placeholders oscuros - aún más claro
    }
  }
};

// Función helper para obtener colores según el tema
export const getAppColors = (isDark: boolean) => ({
  primary: isDark ? AppColors.primary.dark : AppColors.primary.light,
  primaryContainer: isDark ? AppColors.primary.container.dark : AppColors.primary.container.light,
  surface: isDark ? AppColors.surface.dark.primary : AppColors.surface.light.primary,
  surfaceSecondary: isDark ? AppColors.surface.dark.secondary : AppColors.surface.light.secondary,
  surfaceVariant: isDark ? AppColors.surface.dark.variant : AppColors.surface.light.variant,
  textPrimary: isDark ? AppColors.text.dark.primary : AppColors.text.light.primary,
  textSecondary: isDark ? AppColors.text.dark.secondary : AppColors.text.light.secondary,
  textOnPrimary: isDark ? AppColors.text.dark.onPrimary : AppColors.text.light.onPrimary,
  borderPrimary: isDark ? AppColors.border.dark.primary : AppColors.border.light.primary,
  borderFocus: isDark ? AppColors.border.dark.focus : AppColors.border.light.focus,
  success: isDark ? AppColors.status.success.dark : AppColors.status.success.light,
  error: isDark ? AppColors.status.error.dark : AppColors.status.error.light,
  warning: isDark ? AppColors.status.warning.dark : AppColors.status.warning.light,
  info: isDark ? AppColors.status.info.dark : AppColors.status.info.light,
  interactive: isDark ? AppColors.interactive.dark : AppColors.interactive.light,
  special: isDark ? AppColors.special.dark : AppColors.special.light
});

// Tipos para TypeScript
export type AppColorsType = ReturnType<typeof getAppColors>;