// Hook personalizado para usar los colores de la aplicación de forma consistente
import { useTheme } from '../context/ThemeContext';
import { getAppColors, AppColorsType } from '../constants/colors';

export const useAppColors = (): AppColorsType => {
  const { theme } = useTheme();
  const isDarkMode = theme.colors.surface !== '#FFFFFF';
  
  return getAppColors(isDarkMode);
};

// Hook adicional para casos específicos donde se necesite saber el modo
export const useColorMode = () => {
  const { theme } = useTheme();
  const isDarkMode = theme.colors.surface !== '#FFFFFF';
  
  return {
    isDark: isDarkMode,
    isLight: !isDarkMode,
    colors: getAppColors(isDarkMode)
  };
};

export default useAppColors;