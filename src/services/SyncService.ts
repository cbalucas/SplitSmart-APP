/**
 * SyncService.ts
 *
 * LocalOnlySyncService — Implementación "no-op" del servicio de sync.
 *
 * Mientras la app opera en modo local (sin Supabase), esta clase
 * implementa ISyncService sin hacer nada. Todas las operaciones
 * retornan éxito con cero registros procesados.
 *
 * ─── CÓMO ACTIVAR SUPABASE SYNC ─────────────────────────────────────
 * 1. Crear src/services/SupabaseSyncService.ts implementando ISyncService
 * 2. En SyncFactory.ts: cambiar CLOUD_SYNC_ENABLED = true
 * 3. Asegurarse de que EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY
 *    estén definidas en .env
 *
 * ─── ESTRUCTURA DE SupabaseSyncService ──────────────────────────────
 * Ver comentario en SyncFactory.ts para la estructura sugerida.
 */

import { ISyncService, SyncResult, SyncableTable } from './ISyncService';

export class LocalOnlySyncService implements ISyncService {
  readonly isEnabled = false;

  async syncAll(_userId: string): Promise<SyncResult> {
    return { success: true, pushed: 0, pulled: 0, conflicts: 0 };
  }

  async push(_userId: string): Promise<SyncResult> {
    return { success: true, pushed: 0, pulled: 0, conflicts: 0 };
  }

  async pull(_userId: string): Promise<SyncResult> {
    return { success: true, pushed: 0, pulled: 0, conflicts: 0 };
  }

  async markAllPending(_userId: string): Promise<void> {
    // no-op en modo local
  }

  async resolveConflict(
    _table: SyncableTable,
    _recordId: string,
    _strategy: 'local' | 'server'
  ): Promise<void> {
    // no-op en modo local
  }

  async checkConnection(): Promise<boolean> {
    return false; // modo local = sin conexión a la nube
  }
}
