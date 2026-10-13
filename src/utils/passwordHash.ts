/**
 * passwordHash.ts
 *
 * Hash de contraseñas locales con PBKDF2-HMAC-SHA256 (JS puro vía @noble/hashes,
 * sin módulos nativos → funciona igual en Android, iOS y web).
 *
 * Formato almacenado:  pbkdf2$sha256$<iteraciones>$<saltHex>$<hashHex>
 * Las contraseñas guardadas antes de esta versión están en texto plano; se
 * detectan con isHashed() y se migran al primer login correcto.
 */

import { pbkdf2Async } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';

const PREFIX = 'pbkdf2$sha256$';
const ITERATIONS = 20000;
const SALT_BYTES = 16;
const KEY_BYTES = 32;

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');

const fromHex = (hex: string): Uint8Array => {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
};

/** Salt aleatorio. Usa crypto si existe; si no (RN sin polyfill) cae a Math.random (un salt solo necesita ser único). */
function randomSalt(): Uint8Array {
  const salt = new Uint8Array(SALT_BYTES);
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      crypto.getRandomValues(salt);
      return salt;
    }
  } catch {
    // continúa con el fallback
  }
  for (let i = 0; i < SALT_BYTES; i++) salt[i] = Math.floor(Math.random() * 256);
  return salt;
}

const derive = (plain: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> =>
  pbkdf2Async(sha256, plain, salt, { c: iterations, dkLen: KEY_BYTES });

/** true si el valor almacenado ya es un hash de este módulo. */
export function isHashed(stored: string | null | undefined): boolean {
  return typeof stored === 'string' && stored.startsWith(PREFIX);
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomSalt();
  const key = await derive(plain, salt, ITERATIONS);
  return `${PREFIX}${ITERATIONS}$${toHex(salt)}$${toHex(key)}`;
}

/** Compara en tiempo constante. */
export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  if (!isHashed(stored)) return false;
  const [iterStr, saltHex, hashHex] = stored.slice(PREFIX.length).split('$');
  const iterations = parseInt(iterStr, 10);
  if (!iterations || !saltHex || !hashHex) return false;
  const key = toHex(await derive(plain, fromHex(saltHex), iterations));
  if (key.length !== hashHex.length) return false;
  let diff = 0;
  for (let i = 0; i < key.length; i++) diff |= key.charCodeAt(i) ^ hashHex.charCodeAt(i);
  return diff === 0;
}

/**
 * Verifica contra un valor almacenado que puede ser hash o texto plano legacy.
 * `needsRehash` indica que el valor era texto plano (o usa menos iteraciones) y
 * conviene reemplazarlo por un hash nuevo.
 */
export async function checkStoredPassword(
  plain: string,
  stored: string | null | undefined
): Promise<{ ok: boolean; needsRehash: boolean }> {
  if (!stored) return { ok: false, needsRehash: false };
  if (isHashed(stored)) {
    const ok = await verifyPassword(plain, stored);
    const iterations = parseInt(stored.slice(PREFIX.length).split('$')[0], 10);
    return { ok, needsRehash: ok && iterations < ITERATIONS };
  }
  // Legacy: texto plano
  const ok = stored === plain;
  return { ok, needsRehash: ok };
}
