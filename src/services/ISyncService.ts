/**
 * ISyncService.ts
 *
 * Interfaz del servicio de sincronización local ↔ nube.
 *
 * Cuando se active Supabase sync, implementar esta interfaz en
 * SupabaseSyncService.ts y actualizar SyncFactory.ts.
 *
 * TABLAS SINCRONIZABLES (las que tienen columna sync_status):
 *   events, participants, expenses, splits, settlements, users
 *
 * FLUJO OFFLINE-FIRST:
 *   1. Toda escritura va primero a SQLite local (sync_status = 'pending')
 *   2. Al recuperar conexión, SyncService.push() sube los 'pending'
 *   3. SyncService.pull() baja cambios del servidor al local
 *   4. En conflicto: resolveConflict() decide qué versión gana
 */

/** Estado de sincronización de cada registro */
export type SyncStatus = 'pending' | 'synced' | 'conflict';

/** Resultado de una operación de sync */
export interface SyncResult {
  success: boolean;
  pushed: number;     // registros enviados al servidor
  pulled: number;     // registros recibidos del servidor
  conflicts: number;  // conflictos detectados (sync_status = 'conflict')
  error?: string;     // mensaje de error si success = false
}

/** Tablas que participan en la sincronización */
export type SyncableTable =
  | 'events'
  | 'participants'
  | 'expenses'
  | 'splits'
  | 'settlements'
  | 'users';

export interface ISyncService {
  /** true si la sincronización en la nube está habilitada y configurada */
  readonly isEnabled: boolean;

  /**
   * Sincronización completa bidireccional:
   * push cambios locales → luego pull cambios del servidor.
   */
  syncAll(userId: string): Promise<SyncResult>;

  /**
   * Solo enviar cambios locales con sync_status = 'pending' al servidor.
   * Útil para sincronización manual o al recuperar conexión.
   */
  push(userId: string): Promise<SyncResult>;

  /**
   * Solo descargar cambios del servidor (updated_at > último pull local).
   * Útil al iniciar la app o al recuperar conexión.
   */
  pull(userId: string): Promise<SyncResult>;

  /**
   * Marcar todos los registros de un usuario como 'pending' para forzar
   * un re-upload completo. Útil en la primera sincronización.
   */
  markAllPending(userId: string): Promise<void>;

  /**
   * Resolver un conflicto de sincronización.
   * - 'local': el registro local sobreescribe el del servidor
   * - 'server': el registro del servidor sobreescribe el local
   */
  resolveConflict(
    table: SyncableTable,
    recordId: string,
    strategy: 'local' | 'server'
  ): Promise<void>;

  /**
   * Verificar si hay conexión a Supabase disponible.
   * Útil para mostrar indicador de estado en la UI.
   */
  checkConnection(): Promise<boolean>;
}
