/**
 * SyncFactory.ts
 *
 * Punto de entrada único para el servicio de sincronización.
 * Exporta `syncService` listo para usar en toda la app.
 *
 * ─── PARA ACTIVAR SUPABASE SYNC ─────────────────────────────────────────────
 *
 * 1. Implementar SupabaseSyncService siguiendo este esqueleto:
 *
 *    export class SupabaseSyncService implements ISyncService {
 *      readonly isEnabled = true;
 *      constructor(
 *        private supabase: SupabaseClient,
 *        private db: IDatabaseService
 *      ) {}
 *
 *      async push(userId: string): Promise<SyncResult> {
 *        // 1. Leer registros locales con sync_status = 'pending'
 *        // 2. Hacer upsert a Supabase (supabase.from('events').upsert(...))
 *        // 3. Marcar como sync_status = 'synced' en SQLite
 *        // 4. Retornar { success: true, pushed: N, pulled: 0, conflicts: 0 }
 *      }
 *
 *      async pull(userId: string): Promise<SyncResult> {
 *        // 1. Leer timestamp del último pull desde AsyncStorage
 *        // 2. Consultar Supabase: WHERE updated_at > lastPullAt AND creator_id = userId
 *        // 3. Actualizar registros locales (INSERT OR REPLACE)
 *        // 4. Guardar nuevo timestamp de pull
 *      }
 *
 *      async syncAll(userId: string): Promise<SyncResult> {
 *        const pushResult = await this.push(userId);
 *        const pullResult = await this.pull(userId);
 *        return { ...pushResult, pulled: pullResult.pulled };
 *      }
 *    }
 *
 * 2. Cambiar CLOUD_SYNC_ENABLED = true (o usar process.env)
 *
 * 3. Descomentar la línea de SupabaseSyncService abajo.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { ISyncService } from './ISyncService';
import { LocalOnlySyncService } from './SyncService';
import { SupabaseSyncService } from './SupabaseSyncService';
import { databaseService } from './DatabaseFactory';

/**
 * true = Supabase sync habilitado (offline-first, bidireccional).
 * Se activa automáticamente cuando las variables de entorno de Supabase están configuradas.
 * Con false, la app funciona completamente offline.
 */
const CLOUD_SYNC_ENABLED =
  !!process.env.EXPO_PUBLIC_SUPABASE_URL &&
  !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

function createSyncService(): ISyncService {
  if (CLOUD_SYNC_ENABLED) {
    console.log('☁️ SyncFactory: Supabase sync habilitado');
    return new SupabaseSyncService(databaseService);
  }
  console.log('📴 SyncFactory: modo local (sin Supabase sync)');
  return new LocalOnlySyncService();
}

export const syncService: ISyncService = createSyncService();
