/**
 * uuid.ts
 *
 * Generador centralizado de IDs para toda la app.
 *
 * Usa crypto.randomUUID() disponible en React Native 0.71+ / Expo SDK 50+.
 * Si por alguna razón no está disponible (test environments, entornos legacy),
 * cae al package `uuid` (v4) que ya está en las dependencias del proyecto.
 *
 * Produce UUIDs v4 estándar compatibles con Supabase/PostgreSQL.
 * Ejemplo: "550e8400-e29b-41d4-a716-446655440000"
 *
 * Todos los IDs generados localmente deben usar esta función para que
 * la migración a Supabase sea trivial (el schema usa UUID PRIMARY KEY).
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Fallback UUID v4 en JS puro (no requiere crypto.getRandomValues).
 *
 * En React Native `crypto.getRandomValues` no está polyfilleado, por lo que
 * tanto `crypto.randomUUID()` como el package `uuid` lanzan
 * "crypto.getRandomValues() not supported". Este generador usa Math.random,
 * suficiente para IDs de entidades (no son tokens de seguridad) y evita
 * agregar dependencias nativas (que obligarían a regenerar el build).
 */
function uuidV4Fallback(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Genera un UUID v4 estándar.
 * Reemplaza el patrón anterior: `${Date.now()}_${Math.random().toString(36).substr(2,9)}`
 */
export function generateId(): string {
  // 1. crypto.randomUUID() nativo (web / RN con crypto disponible)
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // ignora y prueba el siguiente método
  }
  // 2. uuid v4 del package (requiere crypto.getRandomValues)
  try {
    return uuidv4();
  } catch {
    // 3. Fallback JS puro (React Native sin crypto.getRandomValues)
    return uuidV4Fallback();
  }
}

/**
 * Genera un UUID DETERMINÍSTICO (mismo `seed` → siempre el mismo UUID) con
 * formato v4 válido para columnas UUID de Supabase/PostgreSQL.
 *
 * Se usa para IDs que antes eran compuestos (ej. `${expenseId}_${participantId}`)
 * y que deben ser estables entre ediciones para que el upsert en la nube
 * sobrescriba la misma fila en lugar de crear duplicados/huérfanos.
 *
 * Implementación en JS puro (no requiere crypto.getRandomValues), apta para
 * React Native. Deriva 16 bytes de un PRNG sembrado con un hash del `seed`.
 */
export function deterministicId(seed: string): string {
  // xmur3: hash de string → semilla de 32 bits
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  const seedFn = () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
  // mulberry32: PRNG determinístico a partir de la semilla
  let a = seedFn();
  const rand = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (rand() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
