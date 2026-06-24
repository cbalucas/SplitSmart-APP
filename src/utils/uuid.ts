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
 * Genera un UUID v4 estándar.
 * Reemplaza el patrón anterior: `${Date.now()}_${Math.random().toString(36).substr(2,9)}`
 */
export function generateId(): string {
  // React Native 0.71+ expone crypto.randomUUID() globalmente
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: uuid v4 del package instalado
  return uuidv4();
}
