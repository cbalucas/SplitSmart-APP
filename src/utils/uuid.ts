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
