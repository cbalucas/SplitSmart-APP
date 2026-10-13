/**
 * syncErrors.ts
 *
 * Traduce errores técnicos de la sincronización (red, Supabase/PostgREST, RLS)
 * a un motivo legible para el usuario y los clasifica en "sin conexión" o "error".
 */

export interface DescribedSyncError {
  /** Texto en español para mostrar al usuario. */
  message: string;
  /** true si el problema es de conectividad (se reintenta solo, no es un fallo de datos). */
  isNetwork: boolean;
  /** Mensaje técnico original (útil para soporte/diagnóstico). */
  raw: string;
}

const NETWORK_RE = /failed to fetch|network request failed|networkerror|network error|load failed|timeout|timed out|fetch failed|err_internet|offline|econn|enotfound/i;

export function describeSyncError(error: unknown): DescribedSyncError {
  const raw = typeof error === 'string' ? error : (error as any)?.message || String(error ?? '') || 'Error desconocido';

  if (NETWORK_RE.test(raw)) {
    return { message: 'No hay conexión con el servidor. Revisá tu internet; se reintentará automáticamente.', isNetwork: true, raw };
  }
  if (/sin sesi[oó]n|jwt|not authenticated|invalid.*token|refresh.*token|session/i.test(raw)) {
    return { message: 'Tu sesión con la nube venció. Cerrá sesión y volvé a ingresar con tu cuenta online.', isNetwork: false, raw };
  }
  if (/row-level security|rls|permission denied|violates row-level|42501/i.test(raw)) {
    return { message: `Sin permiso para guardar algunos datos en la nube (${raw}).`, isNetwork: false, raw };
  }
  if (/foreign key|violates.*fkey|23503/i.test(raw)) {
    return { message: `Algunos datos dependen de otros que todavía no se subieron; se reintentará (${raw}).`, isNetwork: false, raw };
  }
  if (/duplicate key|unique constraint|23505/i.test(raw)) {
    return { message: `Conflicto con datos ya existentes en la nube (${raw}).`, isNetwork: false, raw };
  }
  return { message: raw, isNetwork: false, raw };
}
