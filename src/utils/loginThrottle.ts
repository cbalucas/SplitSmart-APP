/**
 * loginThrottle.ts
 *
 * Bloqueo temporal de login tras intentos fallidos con contraseña.
 * El estado se persiste en AsyncStorage para que reiniciar la app no
 * reinicie el contador.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@splitsmart/login_attempts';
export const MAX_ATTEMPTS = 5;
export const LOCK_SECONDS = 30;

type AttemptMap = { [credential: string]: { count: number; lockedUntil: number } };

const normalize = (credential: string) => credential.trim().toLowerCase();

async function load(): Promise<AttemptMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function save(map: AttemptMap): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // sin persistencia el bloqueo igual se aplica durante la sesión
  }
}

/** Segundos restantes de bloqueo para esa credencial (0 = no bloqueada). */
export async function getLockRemainingSeconds(credential: string): Promise<number> {
  const entry = (await load())[normalize(credential)];
  if (!entry || !entry.lockedUntil) return 0;
  return Math.max(0, Math.ceil((entry.lockedUntil - Date.now()) / 1000));
}

/** Registra un intento fallido; al llegar a MAX_ATTEMPTS activa el bloqueo. */
export async function registerFailedAttempt(credential: string): Promise<void> {
  const map = await load();
  const key = normalize(credential);
  const entry = map[key] ?? { count: 0, lockedUntil: 0 };
  // Si el bloqueo anterior ya venció, se empieza de cero.
  if (entry.lockedUntil && entry.lockedUntil <= Date.now()) {
    entry.count = 0;
    entry.lockedUntil = 0;
  }
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCK_SECONDS * 1000;
  }
  map[key] = entry;
  await save(map);
}

export async function clearFailedAttempts(credential: string): Promise<void> {
  const map = await load();
  if (map[normalize(credential)]) {
    delete map[normalize(credential)];
    await save(map);
  }
}
