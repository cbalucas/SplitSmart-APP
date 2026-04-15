import { Linking } from 'react-native';
import { showAlert } from './alertService';

const VERSION_URL =
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

export async function fetchVersionInfo(): Promise<RemoteVersionInfo | null> {
  try {
    const response = await fetch(VERSION_URL, { cache: 'no-store' });
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