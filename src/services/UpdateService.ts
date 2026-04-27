import { Linking, Platform } from 'react-native';
import { showAlert } from './alertService';

const PACKAGE_ID = 'com.cbalucas.splitsmart';
const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${PACKAGE_ID}`;
const FALLBACK_VERSION_URL =
  'https://raw.githubusercontent.com/cbalucas/SplitSmart-APP/main/latest-version.json';

/**
 * Compara dos strings de versión semántica (e.g. "1.7.0" vs "1.8.0").
 * Retorna true si remota > local.
 */
export function isNewerVersion(local: string, remote: string): boolean {
  const toNumbers = (v: string) => v.split('.').map(n => parseInt(n, 10) || 0);
  const [la, lb, lc] = toNumbers(local);
  const [ra, rb, rc] = toNumbers(remote);
  if (ra !== la) return ra > la;
  if (rb !== lb) return rb > lb;
  return rc > lc;
}

export interface RemoteVersionInfo {
  version: string;
  playStoreUrl: string;
  forceUpdate?: boolean;
}

/**
 * Intenta obtener la versión directamente de la página del Play Store.
 * Solo funciona en nativo (en web hay CORS).
 * No es una API oficial, por lo que puede fallar si Google cambia el HTML.
 */
async function fetchVersionFromPlayStore(): Promise<string | null> {
  try {
    const response = await fetch(
      `${PLAY_STORE_URL}&hl=en_US`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36',
        },
        cache: 'no-store',
      }
    );
    if (!response.ok) return null;
    const html = await response.text();

    // Patrón 1: itemprop="softwareVersion" (más estable)
    let match = html.match(/itemprop="softwareVersion"[^>]*>\s*([0-9]+\.[0-9]+(?:\.[0-9]+)?)\s*</);
    if (match?.[1]) return match[1].trim();

    // Patrón 2: JSON embebido en el HTML (frecuente en Play Store moderno)
    match = html.match(/\[\[\["([0-9]+\.[0-9]+(?:\.[0-9]+)?)"\]\]/);
    if (match?.[1]) return match[1].trim();

    // Patrón 3: Current Version en texto plano
    match = html.match(/Current Version[\s\S]{0,200}?([0-9]+\.[0-9]+(?:\.[0-9]+)?)/);
    if (match?.[1]) return match[1].trim();

    return null;
  } catch {
    return null;
  }
}

export async function fetchVersionInfo(): Promise<RemoteVersionInfo | null> {
  // En nativo: intentar obtener la versión directo del Play Store
  if (Platform.OS !== 'web') {
    const playStoreVersion = await fetchVersionFromPlayStore();
    if (playStoreVersion) {
      return {
        version: playStoreVersion,
        playStoreUrl: PLAY_STORE_URL,
        forceUpdate: false,
      };
    }
  }

  // Fallback: GitHub JSON (web siempre llega aquí por CORS)
  try {
    const response = await fetch(FALLBACK_VERSION_URL, { cache: 'no-store' });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function checkForUpdate(currentVersion: string): Promise<void> {
  try {
    const data = await fetchVersionInfo();
    if (!data) return;

    if (!isNewerVersion(currentVersion, data.version)) return;

    const isForced = !!data.forceUpdate;

    showAlert({
      type: 'info',
      title: '🚀 Nueva versión disponible',
      message: `La versión ${data.version} ya está disponible en Play Store. Actualízala para disfrutar de las últimas mejoras.`,
      buttons: isForced
        ? [
            {
              text: 'Actualizar ahora',
              onPress: () => Linking.openURL(data.playStoreUrl),
            },
          ]
        : [
            {
              text: 'Ahora no',
              style: 'cancel',
            },
            {
              text: 'Actualizar',
              onPress: () => Linking.openURL(data.playStoreUrl),
            },
          ],
    });
  } catch (error) {
    // Silenciar errores de red — no interrumpir el flujo de la app
  }
}