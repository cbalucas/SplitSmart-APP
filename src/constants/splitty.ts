/**
 * Configuración del bot Splitty.
 *
 * USE_THEMED_SPLITTY: true  → muestra el bot temático según el idioma del usuario
 *                     false → siempre muestra el bot genérico
 */
export const USE_THEMED_SPLITTY = true;

// Las imágenes deben pre-cargarse con require() estático (limitación de React Native / Metro)
const SPLITTY_IMAGES = {
  generic: require('../../assets/splitsmart/Splitty.png'),
  es:      require('../../assets/splitsmart/Splitty_AR.png'),
  pt:      require('../../assets/splitsmart/Splitty_PT.png'),
  en:      require('../../assets/splitsmart/Splitty_US.png'),
} as const;

/**
 * Devuelve la imagen correcta de Splitty según el idioma y la feature flag.
 * @param language  Código de idioma activo ('es' | 'en' | 'pt')
 */
export function getSplittyImage(language: string) {
  if (!USE_THEMED_SPLITTY) return SPLITTY_IMAGES.generic;
  return SPLITTY_IMAGES[language as keyof typeof SPLITTY_IMAGES] ?? SPLITTY_IMAGES.generic;
}
