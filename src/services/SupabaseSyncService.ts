/**
 * SupabaseSyncService.ts
 *
 * Implementación real del servicio de sincronización local ↔ Supabase.
 *
 * ESTRATEGIA offline-first:
 *  1. Cada escritura local queda con sync_status = 'pending' (default en SQLite).
 *  2. push()  → sube los 'pending' a Supabase → marca como 'synced'.
 *  3. pull()  → descarga datos del cloud → upsert en SQLite (cloud gana si synced,
 *               respeta local si está 'pending').
 *  4. syncAll() → push primero (protege cambios locales), luego pull.
 *
 * EVENTOS COMPARTIDOS VIA QR:
 *  Al importar un evento por QR, se guarda localmente con is_shared=true y creator_id=null.
 *  En el push, se sustituye creator_id por el userId del usuario actual para que quede
 *  registrado en Supabase y sea recuperable en cualquier otro dispositivo.
 *
 * PLATAFORMAS:
 *  - Native (iOS/Android): accede a SQLite via (databaseService as any).db
 *  - Web: no-op (devuelve éxito vacío) porque usa IndexedDB y no necesita SQLite sync.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { IDatabaseService } from './IDatabaseService';
import { ISyncService, SyncResult, SyncableTable } from './ISyncService';

const LAST_PULL_KEY = '@splitsmart/last_pull_at';

export class SupabaseSyncService implements ISyncService {
  readonly isEnabled = true;

  constructor(private readonly databaseService: IDatabaseService) {}

  // ─── Acceso a SQLite raw (solo nativo) ────────────────────────────────────
  private getDb(): any | null {
    if (Platform.OS === 'web') return null;
    return (this.databaseService as any).db ?? null;
  }

  // ─── Acceso a IndexedDB raw (solo web) ────────────────────────────────────
  private getWebDb(): any | null {
    if (Platform.OS !== 'web') return null;
    return (this.databaseService as any).db ?? null;
  }

  // ─── checkConnection ──────────────────────────────────────────────────────
  async checkConnection(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;
      const { error } = await supabase.from('users').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  // ─── markAllPending ───────────────────────────────────────────────────────
  async markAllPending(_userId: string): Promise<void> {
    const db = this.getDb();
    if (!db) return;
    const tables = ['events', 'participants', 'expenses', 'splits', 'settlements', 'activities', 'activity_participants'];
    for (const table of tables) {
      try {
        await db.runAsync(`UPDATE ${table} SET sync_status = 'pending'`);
      } catch { /* ignorar errores por tabla inexistente */ }
    }
  }

  // ─── resolveConflict ──────────────────────────────────────────────────────
  async resolveConflict(
    _table: SyncableTable,
    _recordId: string,
    _strategy: 'local' | 'server'
  ): Promise<void> {
    // Implementación básica — se puede extender con lógica de merge
  }

  // ─── PUSH: local → Supabase ───────────────────────────────────────────────
  async push(userId: string): Promise<SyncResult> {
    // En web usamos IndexedDB con full-sync (upsert idempotente)
    if (Platform.OS === 'web') {
      return this._pushWeb(userId);
    }

    const db = this.getDb();
    if (!db) return { success: true, pushed: 0, pulled: 0, conflicts: 0 };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, pushed: 0, pulled: 0, conflicts: 0, error: 'Sin sesión Supabase' };
      }

      let pushed = 0;
      const pushErrors: string[] = [];

      // ── 0. Adopción de registros huérfanos ────────────────────────────────
      // Eventos/amigos creados sin un dueño válido (creator_id nulo, vacío o
      // 'anonymous', p.ej. creados antes de iniciar sesión) se reasignan al
      // usuario actual para que puedan subirse (RLS exige creator_id = auth.uid()).
      await this._adoptOrphanRecords(db, userId);

      // ── 0.5 Asegurar que el usuario existe en public.users ────────────────
      // events.creator_id → users.id (FK). Si la fila del usuario no existe en
      // Supabase (p.ej. se vació la tabla, o el trigger de alta no corrió para
      // una sesión ya existente), el push de eventos falla con
      // "events_creator_id_fkey". Hacemos upsert idempotente del perfil propio.
      try {
        const authUser = session.user;
        let localUser: any = null;
        try {
          localUser =
            (await db.getFirstAsync(`SELECT * FROM users WHERE id = ?`, [userId])) ||
            (authUser.email
              ? await db.getFirstAsync(`SELECT * FROM users WHERE email = ?`, [authUser.email])
              : null);
        } catch {}
        const emailPrefix = (authUser.email || 'user').split('@')[0];
        const userPayload = {
          id: userId,
          username: localUser?.username || `${emailPrefix}_${userId.substring(0, 8)}`,
          email: authUser.email || localUser?.email || `${userId}@placeholder.local`,
          name:
            localUser?.name ||
            authUser.user_metadata?.full_name ||
            authUser.user_metadata?.name ||
            emailPrefix,
          avatar: localUser?.avatar || authUser.user_metadata?.avatar_url || null,
        };
        const { error: userErr } = await supabase
          .from('users')
          .upsert(userPayload, { onConflict: 'id' });
        if (userErr) {
          console.warn('⚠️ SyncPush users error:', userErr.message);
          return { success: false, pushed: 0, pulled: 0, conflicts: 0, error: `users: ${userErr.message}` };
        }
        pushed += 1;
      } catch (e: any) {
        console.warn('⚠️ SyncPush ensure-user error:', e?.message || e);
      }

      // ── 1. Eventos ────────────────────────────────────────────────────────
      // Incluye eventos propios del usuario y eventos importados via QR (is_shared=1, creator_id NULL)
      const pendingOwnEvents: any[] = await db.getAllAsync(
        `SELECT * FROM events WHERE creator_id = ? AND sync_status = 'pending'`,
        [userId]
      );
      const pendingSharedEvents: any[] = await db.getAllAsync(
        `SELECT * FROM events WHERE is_shared = 1 AND (creator_id IS NULL OR creator_id = '') AND sync_status = 'pending'`,
        []
      );
      const allPendingEvents = [...pendingOwnEvents, ...pendingSharedEvents];

      if (allPendingEvents.length > 0) {
        const eventsToUpsert = allPendingEvents.map(e => ({
          id: e.id,
          name: e.name,
          description: e.description || null,
          start_date: e.start_date,
          location: e.location || null,
          currency: e.currency,
          total_amount: e.total_amount ?? 0,
          status: e.status || 'active',
          type: e.type || 'public',
          category: e.category || null,
          creator_id: e.creator_id || userId,   // QR events: asignar al usuario importador
          is_locked: e.is_locked === 1 || e.is_locked === true,
          is_express: e.is_express === 1 || e.is_express === true,
          is_shared: e.is_shared === 1 || e.is_shared === true,
          shared_role: e.shared_role || null,
          share_id: e.share_id || null,
          closing_comment: e.closing_comment || null,
          closed_at: e.closed_at || null,
          completed_at: e.completed_at || null,
          created_at: e.created_at,
          updated_at: e.updated_at,
        }));

        const { error: evError } = await supabase
          .from('events')
          .upsert(eventsToUpsert, { onConflict: 'id' });

        if (!evError) {
          await this._markSynced(db, 'events', allPendingEvents.map(e => e.id));
          // Para shared events sin creator_id, actualizar también localmente
          for (const e of pendingSharedEvents) {
            if (!e.creator_id || e.creator_id === '') {
              await db.runAsync(`UPDATE events SET creator_id = ? WHERE id = ?`, [userId, e.id]);
            }
          }
          pushed += allPendingEvents.length;
        } else {
          console.warn('⚠️ SyncPush events error:', evError.message);
          pushErrors.push(`events: ${evError.message}`);
        }
      }

      // ── 2. Obtener todos los event IDs escribibles por el usuario ─────────
      // (a) Eventos propios (creator_id = userId).
      const userEventRows: any[] = await db.getAllAsync(
        `SELECT id FROM events WHERE creator_id = ?`,
        [userId]
      );
      const ownedEventIds: string[] = userEventRows.map(r => r.id);

      // (b) Eventos compartidos recibidos con rol EDITOR (colaboración en la nube).
      //     El usuario NO es el creador pero puede escribir gastos/splits/liquidaciones.
      const sharedEditorRows: any[] = await db.getAllAsync(
        `SELECT id, share_id FROM events
         WHERE is_shared = 1 AND shared_role = 'editor'
           AND share_id IS NOT NULL
           AND (creator_id IS NULL OR creator_id <> ?)`,
        [userId]
      );
      const sharedEditorEventIds: string[] = sharedEditorRows.map(r => r.id);

      // Asegurar el registro de colaborador en la nube (idempotente) para que las
      // políticas RLS habiliten la escritura. Best-effort: no bloquea el push.
      for (const row of sharedEditorRows) {
        if (!row.share_id) continue;
        try {
          await supabase
            .from('event_collaborators')
            .upsert(
              { event_id: row.id, user_id: userId, role: 'editor', share_id: row.share_id },
              { onConflict: 'event_id,user_id', ignoreDuplicates: true }
            );
        } catch (e: any) {
          console.warn('⚠️ SyncPush registrar colaborador error:', e?.message || e);
        }
      }

      // Conjunto combinado de eventos cuyos registros hijos se suben.
      const userEventIds: string[] = [...ownedEventIds, ...sharedEditorEventIds];

      if (userEventIds.length === 0) {
        console.log('✅ SyncPush: sin eventos, fin de push');
        return { success: pushErrors.length === 0, pushed, pulled: 0, conflicts: 0, error: pushErrors.length ? pushErrors.join(' | ') : undefined };
      }

      const eventPlaceholders = userEventIds.map(() => '?').join(',');

      // ── 3. Participantes ──────────────────────────────────────────────────
      // Participantes creados por el usuario (amigos)
      const pendingFriends: any[] = await db.getAllAsync(
        `SELECT * FROM participants WHERE created_by_user_id = ? AND sync_status = 'pending'`,
        [userId]
      );
      // Participantes en eventos del usuario sin creator_id (importados via QR)
      const pendingEventParticipants: any[] = await db.getAllAsync(
        `SELECT DISTINCT p.* FROM participants p
         JOIN event_participants ep ON ep.participant_id = p.id
         WHERE ep.event_id IN (${eventPlaceholders}) AND p.sync_status = 'pending'
           AND (p.created_by_user_id IS NULL OR p.created_by_user_id = '')`,
        userEventIds
      );

      // Deduplicar
      const seenIds = new Set(pendingFriends.map((p: any) => p.id));
      const uniquePendingParticipants = [
        ...pendingFriends,
        ...pendingEventParticipants.filter((p: any) => !seenIds.has(p.id)),
      ];

      if (uniquePendingParticipants.length > 0) {
        const participantsToUpsert = uniquePendingParticipants.map(p => ({
          id: p.id,
          name: p.name,
          email: p.email || null,
          phone: p.phone || null,
          alias_cbu: p.alias_cbu || null,
          avatar: p.avatar || null,
          is_active: p.is_active === 1 || p.is_active === true,
          participant_type: p.participant_type || 'temporary',
          user_id: p.user_id || null,
          created_by_user_id: p.created_by_user_id || userId,  // RLS exige este campo
          is_public: p.is_public === 1 || p.is_public === true,
          times_used: p.times_used ?? 0,
          last_used_at: p.last_used_at || null,
          created_at: p.created_at || new Date().toISOString(),
          updated_at: p.updated_at || new Date().toISOString(),
        }));

        const { error: pError } = await supabase
          .from('participants')
          .upsert(participantsToUpsert, { onConflict: 'id' });

        if (!pError) {
          await this._markSynced(db, 'participants', uniquePendingParticipants.map(p => p.id));
          pushed += uniquePendingParticipants.length;
        } else {
          console.warn('⚠️ SyncPush participants error:', pError.message);
          pushErrors.push(`participants: ${pError.message}`);
        }
      }

      // ── 4. Event_participants (relaciones evento ↔ participante) ──────────
      const allLocalEPs: any[] = await db.getAllAsync(
        `SELECT ep.* FROM event_participants ep
         WHERE ep.event_id IN (${eventPlaceholders})`,
        userEventIds
      );

      if (allLocalEPs.length > 0) {
        const epsToUpsert = allLocalEPs.map(ep => ({
          id: ep.id,
          event_id: ep.event_id,
          participant_id: ep.participant_id,
          role: ep.role || 'member',
          balance: ep.balance ?? 0,
          joined_at: ep.joined_at || new Date().toISOString(),
          parent_participant_id: ep.parent_participant_id || null,
        }));

        const { error: epError } = await supabase
          .from('event_participants')
          .upsert(epsToUpsert, { onConflict: 'event_id,participant_id', ignoreDuplicates: true });

        if (epError) {
          console.warn('⚠️ SyncPush event_participants error:', epError.message);
          pushErrors.push(`event_participants: ${epError.message}`);
        }
      }

      // ── 5. Gastos (expenses) ──────────────────────────────────────────────
      const pendingExpenses: any[] = await db.getAllAsync(
        `SELECT * FROM expenses WHERE event_id IN (${eventPlaceholders}) AND sync_status = 'pending'`,
        userEventIds
      );

      if (pendingExpenses.length > 0) {
        const expensesToUpsert = pendingExpenses.map(ex => ({
          id: ex.id,
          event_id: ex.event_id,
          description: ex.description,
          amount: ex.amount,
          currency: ex.currency,
          original_amount: ex.original_amount || null,
          conversion_rate: ex.conversion_rate ?? 1.0,
          date: ex.date,
          category: ex.category || null,
          payer_id: ex.payer_id,
          payer_name: ex.payer_name || '',
          receipt_image: ex.receipt_image || null,
          is_active: ex.is_active === 1 || ex.is_active === true,
          created_at: ex.created_at || new Date().toISOString(),
          updated_at: ex.updated_at || new Date().toISOString(),
        }));

        const { error: exError } = await supabase
          .from('expenses')
          .upsert(expensesToUpsert, { onConflict: 'id' });

        if (!exError) {
          await this._markSynced(db, 'expenses', pendingExpenses.map(ex => ex.id));
          pushed += pendingExpenses.length;
        } else {
          console.warn('⚠️ SyncPush expenses error:', exError.message);
          pushErrors.push(`expenses: ${exError.message}`);
        }
      }

      // ── 6. Splits ─────────────────────────────────────────────────────────
      const allExpenseIds: any[] = await db.getAllAsync(
        `SELECT id FROM expenses WHERE event_id IN (${eventPlaceholders})`,
        userEventIds
      );
      const expenseIds: string[] = allExpenseIds.map(r => r.id);

      if (expenseIds.length > 0) {
        const expensePlaceholders = expenseIds.map(() => '?').join(',');
        const pendingSplits: any[] = await db.getAllAsync(
          `SELECT * FROM splits WHERE expense_id IN (${expensePlaceholders}) AND sync_status = 'pending'`,
          expenseIds
        );

        if (pendingSplits.length > 0) {
          const splitsToUpsert = pendingSplits.map(sp => ({
            id: sp.id,
            expense_id: sp.expense_id,
            participant_id: sp.participant_id,
            amount: sp.amount,
            percentage: sp.percentage ?? null,
            type: sp.type || 'equal',
            is_paid: sp.is_paid === 1 || sp.is_paid === true,
            created_at: sp.created_at || new Date().toISOString(),
            updated_at: sp.updated_at || new Date().toISOString(),
          }));

          const { error: spError } = await supabase
            .from('splits')
            .upsert(splitsToUpsert, { onConflict: 'id' });

          if (!spError) {
            await this._markSynced(db, 'splits', pendingSplits.map(sp => sp.id));
            pushed += pendingSplits.length;
          } else {
            console.warn('⚠️ SyncPush splits error:', spError.message);
            pushErrors.push(`splits: ${spError.message}`);
          }
        }
      }

      // ── 7. Liquidaciones (settlements) ────────────────────────────────────
      const pendingSettlements: any[] = await db.getAllAsync(
        `SELECT * FROM settlements WHERE event_id IN (${eventPlaceholders}) AND sync_status = 'pending'`,
        userEventIds
      );

      if (pendingSettlements.length > 0) {
        const settlementsToUpsert = pendingSettlements.map(s => ({
          id: s.id,
          event_id: s.event_id,
          from_participant_id: s.from_participant_id,
          from_participant_name: s.from_participant_name,
          to_participant_id: s.to_participant_id,
          to_participant_name: s.to_participant_name,
          amount: s.amount,
          is_paid: s.is_paid === 1 || s.is_paid === true,
          paid_at: s.paid_at || null,
          event_status: s.event_status || 'active',
          receipt_image: s.receipt_image || null,
          notes: s.notes || null,
          created_at: s.created_at || new Date().toISOString(),
          updated_at: s.updated_at || new Date().toISOString(),
        }));

        const { error: stError } = await supabase
          .from('settlements')
          .upsert(settlementsToUpsert, { onConflict: 'id' });

        if (!stError) {
          await this._markSynced(db, 'settlements', pendingSettlements.map(s => s.id));
          pushed += pendingSettlements.length;
        } else {
          console.warn('⚠️ SyncPush settlements error:', stError.message);
          pushErrors.push(`settlements: ${stError.message}`);
        }
      }

      // ── 8. Actividades (organización) ─────────────────────────────────────
      const pendingActivities: any[] = await db.getAllAsync(
        `SELECT * FROM activities WHERE event_id IN (${eventPlaceholders}) AND sync_status = 'pending'`,
        userEventIds
      );

      if (pendingActivities.length > 0) {
        const activitiesToUpsert = pendingActivities.map(a => ({
          id: a.id,
          event_id: a.event_id,
          title: a.title,
          description: a.description || null,
          position: a.position ?? 0,
          created_by_user_id: a.created_by_user_id || null,
          created_at: a.created_at || new Date().toISOString(),
          updated_at: a.updated_at || new Date().toISOString(),
        }));

        const { error: actError } = await supabase
          .from('activities')
          .upsert(activitiesToUpsert, { onConflict: 'id' });

        if (!actError) {
          await this._markSynced(db, 'activities', pendingActivities.map(a => a.id));
          pushed += pendingActivities.length;
        } else {
          console.warn('⚠️ SyncPush activities error:', actError.message);
          pushErrors.push(`activities: ${actError.message}`);
        }
      }

      // ── 9. Asignaciones de actividades (activity_participants) ─────────────
      const allActivityIds: any[] = await db.getAllAsync(
        `SELECT id FROM activities WHERE event_id IN (${eventPlaceholders})`,
        userEventIds
      );
      const activityIds: string[] = allActivityIds.map(r => r.id);

      if (activityIds.length > 0) {
        const activityPlaceholders = activityIds.map(() => '?').join(',');
        const pendingActivityParticipants: any[] = await db.getAllAsync(
          `SELECT * FROM activity_participants WHERE activity_id IN (${activityPlaceholders}) AND sync_status = 'pending'`,
          activityIds
        );

        if (pendingActivityParticipants.length > 0) {
          const apToUpsert = pendingActivityParticipants.map(ap => ({
            id: ap.id,
            activity_id: ap.activity_id,
            participant_id: ap.participant_id,
            created_at: ap.created_at || new Date().toISOString(),
          }));

          const { error: apError } = await supabase
            .from('activity_participants')
            .upsert(apToUpsert, { onConflict: 'activity_id,participant_id', ignoreDuplicates: true });

          if (!apError) {
            await this._markSynced(db, 'activity_participants', pendingActivityParticipants.map(ap => ap.id));
            pushed += pendingActivityParticipants.length;
          } else {
            console.warn('⚠️ SyncPush activity_participants error:', apError.message);
            pushErrors.push(`activity_participants: ${apError.message}`);
          }
        }
      }

      console.log(`✅ SyncPush completo: ${pushed} registros subidos`);
      return { success: pushErrors.length === 0, pushed, pulled: 0, conflicts: 0, error: pushErrors.length ? pushErrors.join(' | ') : undefined };
    } catch (error: any) {
      console.error('❌ SyncPush error:', error);
      return { success: false, pushed: 0, pulled: 0, conflicts: 0, error: error.message };
    }
  }

  // ─── PULL: Supabase → local ────────────────────────────────────────────────
  async pull(userId: string): Promise<SyncResult> {
    // En web usamos IndexedDB
    if (Platform.OS === 'web') {
      return this._pullWeb(userId);
    }

    const db = this.getDb();
    if (!db) return { success: true, pushed: 0, pulled: 0, conflicts: 0 };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, pushed: 0, pulled: 0, conflicts: 0, error: 'Sin sesión Supabase' };
      }

      let pulled = 0;

      // ── 1. Eventos del usuario como creador ───────────────────────────────
      const { data: ownedEvents, error: oeError } = await supabase
        .from('events')
        .select('*')
        .eq('creator_id', userId);

      if (oeError) throw new Error(`Pull events: ${oeError.message}`);

      // ── 2. Eventos donde el usuario es participante ───────────────────────
      const { data: userParticipants, error: upError } = await supabase
        .from('participants')
        .select('id')
        .eq('user_id', userId);

      let participatedEventIds: string[] = [];
      if (!upError && userParticipants && userParticipants.length > 0) {
        const pIds = userParticipants.map(p => p.id);
        const { data: epData } = await supabase
          .from('event_participants')
          .select('event_id')
          .in('participant_id', pIds);

        if (epData) {
          const ownedIds = new Set((ownedEvents || []).map(e => e.id));
          participatedEventIds = [...new Set(epData.map(ep => ep.event_id))].filter(id => !ownedIds.has(id));
        }
      }

      let participatedEvents: any[] = [];
      if (participatedEventIds.length > 0) {
        const { data: pEvents } = await supabase
          .from('events')
          .select('*')
          .in('id', participatedEventIds);
        participatedEvents = pEvents ?? [];
      }

      // ── 2.5. Eventos donde el usuario es COLABORADOR (share editor/viewer) ─
      // Permite que el colaborador reciba las actualizaciones del dueño y de
      // otros colaboradores del evento compartido.
      let collaboratorEvents: any[] = [];
      const { data: collabRows } = await supabase
        .from('event_collaborators')
        .select('event_id')
        .eq('user_id', userId);
      if (collabRows && collabRows.length > 0) {
        const ownedIds = new Set((ownedEvents || []).map(e => e.id));
        const participatedIds = new Set(participatedEventIds);
        const collabEventIds = [...new Set(collabRows.map((c: any) => c.event_id))]
          .filter(id => !ownedIds.has(id) && !participatedIds.has(id));
        if (collabEventIds.length > 0) {
          const { data: cEvents } = await supabase
            .from('events')
            .select('*')
            .in('id', collabEventIds);
          collaboratorEvents = cEvents ?? [];
        }
      }

      const allCloudEvents = [...(ownedEvents ?? []), ...participatedEvents, ...collaboratorEvents];

      if (allCloudEvents.length === 0) {
        console.log('ℹ️ SyncPull: no hay eventos en Supabase para este usuario');
        await AsyncStorage.setItem(LAST_PULL_KEY, new Date().toISOString());
        return { success: true, pushed: 0, pulled: 0, conflicts: 0 };
      }

      const allEventIds = allCloudEvents.map(e => e.id);

      // ── 3. Upsert eventos → SQLite (respeta registros pending locales) ────
      for (const e of allCloudEvents) {
        // Si existe localmente con sync_status='pending', no sobrescribir
        const localRow: any = await db.getFirstAsync(
          `SELECT sync_status FROM events WHERE id = ?`, [e.id]
        );
        if (localRow?.sync_status === 'pending') continue;

        await db.runAsync(
          `INSERT OR REPLACE INTO events (
            id, name, description, start_date, location, currency, total_amount,
            status, type, category, creator_id, is_locked, is_express, is_shared,
            shared_role, share_id, closing_comment, closed_at, completed_at,
            created_at, updated_at, sync_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')`,
          [
            e.id, e.name, e.description ?? null, e.start_date, e.location ?? null,
            e.currency, e.total_amount ?? 0, e.status, e.type, e.category ?? null,
            e.creator_id ?? null, e.is_locked ? 1 : 0, e.is_express ? 1 : 0,
            e.is_shared ? 1 : 0, e.shared_role ?? null, e.share_id ?? null,
            e.closing_comment ?? null, e.closed_at ?? null, e.completed_at ?? null,
            e.created_at, e.updated_at,
          ]
        );
        pulled++;
      }

      // ── 4a. Fetch event_participants desde Supabase (sin insertar aún) ────
      // IMPORTANTE: el ORDEN de inserción importa. event_participants.participant_id
      // tiene FK a participants(id). Con PRAGMA foreign_keys = ON, insertar
      // event_participants antes que sus participants dispara
      // "FOREIGN KEY constraint failed". Por eso primero se traen los IDs,
      // luego se insertan los participants (paso 5) y AL FINAL los
      // event_participants (paso 4b).
      const { data: cloudEPs } = await supabase
        .from('event_participants')
        .select('*')
        .in('event_id', allEventIds);

      const allParticipantIds: string[] = (cloudEPs ?? []).map((ep: any) => ep.participant_id);

      // ── 5. Participantes (de eventos + amigos del usuario) ─────────────────
      const uniqueParticipantIds = [...new Set(allParticipantIds)];

      // Amigos creados por el usuario (pueden no estar en sus eventos)
      const { data: userFriends } = await supabase
        .from('participants')
        .select('*')
        .eq('created_by_user_id', userId);

      const friendIds = (userFriends ?? []).map(p => p.id);
      const allParticipantIdsToFetch = [...new Set([...uniqueParticipantIds, ...friendIds])];

      if (allParticipantIdsToFetch.length > 0) {
        const { data: cloudParticipants } = await supabase
          .from('participants')
          .select('*')
          .in('id', allParticipantIdsToFetch);

        if (cloudParticipants) {
          for (const p of cloudParticipants) {
            const localP: any = await db.getFirstAsync(
              `SELECT sync_status FROM participants WHERE id = ?`, [p.id]
            );
            if (localP?.sync_status === 'pending') continue;

            await db.runAsync(
              `INSERT OR REPLACE INTO participants (
                id, name, email, phone, alias_cbu, avatar, is_active, participant_type,
                user_id, created_by_user_id, is_public, times_used, last_used_at,
                created_at, updated_at, sync_status
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')`,
              [
                p.id, p.name, p.email ?? null, p.phone ?? null, p.alias_cbu ?? null,
                p.avatar ?? null, p.is_active ? 1 : 0, p.participant_type ?? 'temporary',
                p.user_id ?? null, p.created_by_user_id ?? null, p.is_public ? 1 : 0,
                p.times_used ?? 0, p.last_used_at ?? null, p.created_at, p.updated_at,
              ]
            );
            pulled++;
          }
        }
      }

      // ── 4b. Event_participants (ahora que los participants ya existen) ────
      // Solo se insertan las filas cuyo participant_id existe localmente, para
      // no violar la FK si algún participante no llegó (RLS, borrado, etc.).
      if (cloudEPs && cloudEPs.length > 0) {
        const localPRows: any[] = await db.getAllAsync(`SELECT id FROM participants`);
        const localPIds = new Set(localPRows.map((r: any) => r.id));
        for (const ep of cloudEPs) {
          if (!localPIds.has(ep.participant_id)) {
            console.warn('⚠️ SyncPull: event_participant omitido, participante ausente:', ep.participant_id);
            continue;
          }
          const parentId = ep.parent_participant_id && localPIds.has(ep.parent_participant_id)
            ? ep.parent_participant_id
            : null;
          await db.runAsync(
            `INSERT OR REPLACE INTO event_participants (
              id, event_id, participant_id, role, balance, joined_at, parent_participant_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [ep.id, ep.event_id, ep.participant_id, ep.role,
             ep.balance ?? 0, ep.joined_at ?? new Date().toISOString(),
             parentId]
          );
        }
      }

      // ── 6. Gastos (expenses) ──────────────────────────────────────────────
      // Set de participantes locales para validar FKs (payer_id, participant_id)
      // y evitar "FOREIGN KEY constraint failed" al insertar hijos.
      const localPRowsForFk: any[] = await db.getAllAsync(`SELECT id FROM participants`);
      const localParticipantIds = new Set(localPRowsForFk.map((r: any) => r.id));

      const { data: cloudExpenses } = await supabase
        .from('expenses')
        .select('*')
        .in('event_id', allEventIds);

      const cloudExpenseIds: string[] = [];
      if (cloudExpenses && cloudExpenses.length > 0) {
        for (const ex of cloudExpenses) {
          const localEx: any = await db.getFirstAsync(
            `SELECT sync_status FROM expenses WHERE id = ?`, [ex.id]
          );
          if (localEx?.sync_status === 'pending') {
            cloudExpenseIds.push(ex.id);
            continue;
          }

          // Guarda FK: payer_id → participants(id)
          if (ex.payer_id && !localParticipantIds.has(ex.payer_id)) {
            console.warn('⚠️ SyncPull: gasto omitido, payer ausente:', ex.payer_id);
            continue;
          }

          await db.runAsync(
            `INSERT OR REPLACE INTO expenses (
              id, event_id, description, amount, currency, original_amount,
              conversion_rate, date, category, payer_id, payer_name, receipt_image,
              is_active, created_at, updated_at, sync_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')`,
            [
              ex.id, ex.event_id, ex.description, ex.amount, ex.currency,
              ex.original_amount ?? null, ex.conversion_rate ?? 1.0, ex.date,
              ex.category ?? null, ex.payer_id, ex.payer_name ?? '', ex.receipt_image ?? null,
              ex.is_active ? 1 : 0, ex.created_at, ex.updated_at,
            ]
          );
          cloudExpenseIds.push(ex.id);
          pulled++;
        }
      }

      // ── 7. Splits ─────────────────────────────────────────────────────────
      if (cloudExpenseIds.length > 0) {
        const { data: cloudSplits } = await supabase
          .from('splits')
          .select('*')
          .in('expense_id', cloudExpenseIds);

        if (cloudSplits) {
          for (const sp of cloudSplits) {
            const localSp: any = await db.getFirstAsync(
              `SELECT sync_status FROM splits WHERE id = ?`, [sp.id]
            );
            if (localSp?.sync_status === 'pending') continue;

            // Guarda FK: participant_id → participants(id)
            if (sp.participant_id && !localParticipantIds.has(sp.participant_id)) {
              console.warn('⚠️ SyncPull: split omitido, participante ausente:', sp.participant_id);
              continue;
            }

            await db.runAsync(
              `INSERT OR REPLACE INTO splits (
                id, expense_id, participant_id, amount, percentage, type, is_paid,
                created_at, updated_at, sync_status
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')`,
              [
                sp.id, sp.expense_id, sp.participant_id, sp.amount, sp.percentage ?? null,
                sp.type ?? 'equal', sp.is_paid ? 1 : 0, sp.created_at, sp.updated_at,
              ]
            );
            pulled++;
          }
        }
      }

      // ── 8. Liquidaciones (settlements) ────────────────────────────────────
      const { data: cloudSettlements } = await supabase
        .from('settlements')
        .select('*')
        .in('event_id', allEventIds);

      if (cloudSettlements) {
        for (const s of cloudSettlements) {
          const localS: any = await db.getFirstAsync(
            `SELECT sync_status FROM settlements WHERE id = ?`, [s.id]
          );
          if (localS?.sync_status === 'pending') continue;

          // Guarda FK: from/to_participant_id → participants(id)
          if ((s.from_participant_id && !localParticipantIds.has(s.from_participant_id)) ||
              (s.to_participant_id && !localParticipantIds.has(s.to_participant_id))) {
            console.warn('⚠️ SyncPull: liquidación omitida, participante ausente:', s.from_participant_id, s.to_participant_id);
            continue;
          }

          await db.runAsync(
            `INSERT OR REPLACE INTO settlements (
              id, event_id, from_participant_id, from_participant_name,
              to_participant_id, to_participant_name, amount, is_paid, paid_at,
              event_status, receipt_image, notes, created_at, updated_at, sync_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')`,
            [
              s.id, s.event_id, s.from_participant_id, s.from_participant_name,
              s.to_participant_id, s.to_participant_name, s.amount,
              s.is_paid ? 1 : 0, s.paid_at ?? null, s.event_status ?? 'active',
              s.receipt_image ?? null, s.notes ?? null, s.created_at, s.updated_at,
            ]
          );
          pulled++;
        }
      }

      // ── 9. Actividades (organización) ─────────────────────────────────────
      const cloudActivityIds: string[] = [];
      const { data: cloudActivities } = await supabase
        .from('activities')
        .select('*')
        .in('event_id', allEventIds);

      if (cloudActivities) {
        for (const a of cloudActivities) {
          const localA: any = await db.getFirstAsync(
            `SELECT sync_status FROM activities WHERE id = ?`, [a.id]
          );
          if (localA?.sync_status === 'pending') continue;

          await db.runAsync(
            `INSERT OR REPLACE INTO activities (
              id, event_id, title, description, position, created_by_user_id,
              created_at, updated_at, sync_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced')`,
            [
              a.id, a.event_id, a.title, a.description ?? null, a.position ?? 0, a.created_by_user_id ?? null,
              a.created_at, a.updated_at,
            ]
          );
          cloudActivityIds.push(a.id);
          pulled++;
        }
      }

      // ── 10. Asignaciones de actividades (activity_participants) ────────────
      if (cloudActivityIds.length > 0) {
        const { data: cloudActivityParticipants } = await supabase
          .from('activity_participants')
          .select('*')
          .in('activity_id', cloudActivityIds);

        if (cloudActivityParticipants) {
          for (const ap of cloudActivityParticipants) {
            const localAp: any = await db.getFirstAsync(
              `SELECT sync_status FROM activity_participants WHERE id = ?`, [ap.id]
            );
            if (localAp?.sync_status === 'pending') continue;

            // Guarda FK: participant_id → participants(id)
            if (ap.participant_id && !localParticipantIds.has(ap.participant_id)) {
              console.warn('⚠️ SyncPull: asignación omitida, participante ausente:', ap.participant_id);
              continue;
            }

            await db.runAsync(
              `INSERT OR REPLACE INTO activity_participants (
                id, activity_id, participant_id, created_at, sync_status
              ) VALUES (?, ?, ?, ?, 'synced')`,
              [ap.id, ap.activity_id, ap.participant_id, ap.created_at]
            );
            pulled++;
          }
        }
      }

      await AsyncStorage.setItem(LAST_PULL_KEY, new Date().toISOString());

      console.log(`✅ SyncPull completo: ${pulled} registros descargados (${allCloudEvents.length} eventos)`);
      return { success: true, pushed: 0, pulled, conflicts: 0 };
    } catch (error: any) {
      console.error('❌ SyncPull error:', error);
      return { success: false, pushed: 0, pulled: 0, conflicts: 0, error: error.message };
    }
  }

  // ─── syncAll: push → pull ──────────────────────────────────────────────────
  async syncAll(userId: string): Promise<SyncResult> {
    console.log('🔄 SyncAll iniciando para usuario:', userId);
    const pushResult = await this.push(userId);
    const pullResult = await this.pull(userId);
    return {
      success: pushResult.success && pullResult.success,
      pushed: pushResult.pushed,
      pulled: pullResult.pulled,
      conflicts: 0,
      error: pushResult.error || pullResult.error,
    };
  }

  // ─── Helper: marcar registros como 'synced' en SQLite ─────────────────────
  private async _markSynced(db: any, table: string, ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    await db.runAsync(
      `UPDATE ${table} SET sync_status = 'synced' WHERE id IN (${placeholders})`,
      ids
    );
  }

  // ─── Helper: adoptar registros huérfanos (sin dueño válido) ───────────────
  private async _adoptOrphanRecords(db: any, userId: string): Promise<void> {
    try {
      await db.runAsync(
        `UPDATE events SET creator_id = ?, sync_status = 'pending'
         WHERE creator_id IS NULL OR creator_id = '' OR creator_id = 'anonymous'`,
        [userId]
      );
    } catch (e) {
      console.warn('⚠️ adoptOrphan events:', (e as any)?.message);
    }
    try {
      await db.runAsync(
        `UPDATE participants SET created_by_user_id = ?, sync_status = 'pending'
         WHERE participant_type = 'friend'
           AND (created_by_user_id IS NULL OR created_by_user_id = '' OR created_by_user_id = 'anonymous')`,
        [userId]
      );
    } catch (e) {
      console.warn('⚠️ adoptOrphan participants:', (e as any)?.message);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // IMPLEMENTACIÓN WEB (IndexedDB)
  //
  // A diferencia de SQLite, IndexedDB no rastrea sync_status en cada escritura.
  // Se usa full-sync: se suben TODOS los registros del usuario en cada push.
  // upsert con onConflict:'id' es idempotente → sin duplicados.
  // Dado que la web es un acceso secundario con data modesta, es eficiente.
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── Adopción web: reclamar registros locales para el usuario actual ──────
  // En web IndexedDB es de un solo usuario (el logueado en este navegador).
  // Los eventos NO compartidos y los amigos deben pertenecer al usuario actual
  // para poder subirse a Supabase (RLS exige creator_id / created_by_user_id
  // = auth.uid()). Reasigna los que tengan otro dueño, null, '' o 'anonymous'.
  private async _adoptOrphanRecordsWeb(db: any, userId: string): Promise<void> {
    try {
      const events: any[] = await db.getAll('events');
      for (const e of events) {
        const isShared = e.is_shared === 1 || e.is_shared === true;
        if (!isShared && e.creator_id !== userId) {
          await db.put('events', { ...e, creator_id: userId, sync_status: 'pending' });
        }
      }

      const participants: any[] = await db.getAll('participants');
      for (const p of participants) {
        const isFriend = p.participant_type === 'friend';
        if (isFriend && p.created_by_user_id !== userId) {
          await db.put('participants', { ...p, created_by_user_id: userId, sync_status: 'pending' });
        }
      }
    } catch (err) {
      console.warn('⚠️ _adoptOrphanRecordsWeb error:', err);
    }
  }

  // ─── Subir solo amigos del usuario (cuando no hay eventos) ─────────────────
  private async _pushWebFriendsOnly(db: any, userId: string): Promise<{ pushed: number; error?: string }> {
    try {
      const allParticipants: any[] = await db.getAll('participants');
      const friends = allParticipants.filter((p) => p.created_by_user_id === userId);
      if (friends.length === 0) return { pushed: 0 };

      const toUpsert = friends.map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email || null,
        phone: p.phone || null,
        alias_cbu: p.alias_cbu || null,
        avatar: p.avatar || null,
        is_active: p.is_active === 1 || p.is_active === true,
        participant_type: p.participant_type || 'temporary',
        user_id: p.user_id || null,
        created_by_user_id: p.created_by_user_id || userId,
        is_public: p.is_public === 1 || p.is_public === true,
        times_used: p.times_used ?? 0,
        last_used_at: p.last_used_at || null,
        created_at: p.created_at || new Date().toISOString(),
        updated_at: p.updated_at || new Date().toISOString(),
      }));
      const { error } = await supabase.from('participants').upsert(toUpsert, { onConflict: 'id' });
      if (error) return { pushed: 0, error: `participants: ${error.message}` };
      return { pushed: friends.length };
    } catch (err: any) {
      return { pushed: 0, error: err?.message };
    }
  }

  // ─── PUSH web: IndexedDB → Supabase ───────────────────────────────────────
  private async _pushWeb(userId: string): Promise<SyncResult> {
    const db = this.getWebDb();
    if (!db) return { success: true, pushed: 0, pulled: 0, conflicts: 0 };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, pushed: 0, pulled: 0, conflicts: 0, error: 'Sin sesión Supabase' };
      }

      let pushed = 0;
      let criticalError: string | null = null;

      // ── 0. Adopción: reclamar registros locales para el usuario actual ────
      // En web la base IndexedDB pertenece al usuario logueado. Los eventos/amigos
      // NO compartidos (is_shared) que no tengan al usuario como dueño se reasignan,
      // de modo que puedan subirse a Supabase (RLS exige creator_id = auth.uid()).
      await this._adoptOrphanRecordsWeb(db, userId);

      // ── 0.5 Asegurar que el usuario existe en public.users ────────────────
      // events.creator_id → users.id (FK). Si la fila del usuario no existe en
      // Supabase (p.ej. se vació la tabla, o el trigger de alta no corrió para
      // una sesión ya existente), el push de eventos falla con
      // "events_creator_id_fkey". Hacemos upsert idempotente del perfil propio.
      try {
        const authUser = session.user;
        let localUser: any = null;
        try {
          const allUsers: any[] = await db.getAll('users');
          localUser =
            allUsers.find((u) => u.id === userId) ||
            allUsers.find((u) => u.email && u.email === authUser.email) ||
            null;
        } catch {}
        const emailPrefix = (authUser.email || 'user').split('@')[0];
        const userPayload = {
          id: userId,
          username: localUser?.username || `${emailPrefix}_${userId.substring(0, 8)}`,
          email: authUser.email || localUser?.email || `${userId}@placeholder.local`,
          name:
            localUser?.name ||
            authUser.user_metadata?.full_name ||
            authUser.user_metadata?.name ||
            emailPrefix,
          avatar: localUser?.avatar || authUser.user_metadata?.avatar_url || null,
        };
        const { error: userErr } = await supabase
          .from('users')
          .upsert(userPayload, { onConflict: 'id' });
        if (userErr) {
          criticalError = `users: ${userErr.message}`;
          console.warn('⚠️ WebPush users error:', userErr.message);
        } else {
          pushed += 1;
        }
      } catch (e: any) {
        console.warn('⚠️ WebPush ensure-user error:', e?.message || e);
      }

      // ── 1. Eventos: propios (creator_id=userId) + importados via QR ───────
      const allEvents: any[] = await db.getAll('events');
      const ownEvents = allEvents.filter(
        (e) => e.creator_id === userId ||
               ((e.is_shared === 1 || e.is_shared === true) && (!e.creator_id || e.creator_id === ''))
      );

      if (ownEvents.length > 0) {
        const eventsToUpsert = ownEvents.map((e) => ({
          id: e.id,
          name: e.name,
          description: e.description || null,
          start_date: e.start_date,
          location: e.location || null,
          currency: e.currency,
          total_amount: e.total_amount ?? 0,
          status: e.status || 'active',
          type: e.type || 'public',
          category: e.category || null,
          creator_id: e.creator_id || userId,
          is_locked: e.is_locked === 1 || e.is_locked === true,
          is_express: e.is_express === 1 || e.is_express === true,
          is_shared: e.is_shared === 1 || e.is_shared === true,
          shared_role: e.shared_role || null,
          share_id: e.share_id || null,
          closing_comment: e.closing_comment || null,
          closed_at: e.closed_at || null,
          completed_at: e.completed_at || null,
          created_at: e.created_at,
          updated_at: e.updated_at,
        }));

        const { error } = await supabase.from('events').upsert(eventsToUpsert, { onConflict: 'id' });
        if (!error) {
          pushed += ownEvents.length;
          // Actualizar creator_id local para eventos importados
          for (const e of ownEvents) {
            if (!e.creator_id || e.creator_id === '') {
              await db.put('events', { ...e, creator_id: userId });
            }
          }
        } else {
          criticalError = `events: ${error.message}`;
          console.warn('⚠️ WebPush events error:', error.message);
        }
      }

      const ownEventIds = ownEvents.map((e) => e.id);

      // ── 1.5 Eventos compartidos recibidos con rol EDITOR (colaboración) ───
      // No se sube la fila del evento (pertenece al dueño), pero sí sus hijos.
      const sharedEditorEvents = allEvents.filter(
        (e) =>
          (e.is_shared === 1 || e.is_shared === true) &&
          e.shared_role === 'editor' &&
          e.share_id &&
          e.creator_id && e.creator_id !== userId
      );
      // Registrar al colaborador en la nube (idempotente) para habilitar RLS.
      for (const e of sharedEditorEvents) {
        try {
          await supabase
            .from('event_collaborators')
            .upsert(
              { event_id: e.id, user_id: userId, role: 'editor', share_id: e.share_id },
              { onConflict: 'event_id,user_id', ignoreDuplicates: true }
            );
        } catch (err: any) {
          console.warn('⚠️ WebPush registrar colaborador error:', err?.message || err);
        }
      }

      const userEventIds = [...ownEventIds, ...sharedEditorEvents.map((e) => e.id)];
      if (userEventIds.length === 0) {
        // Aún así intentamos subir los amigos del usuario (pueden no tener eventos)
        const friendsOnly = await this._pushWebFriendsOnly(db, userId);
        pushed += friendsOnly.pushed;
        return {
          success: !criticalError && !friendsOnly.error,
          pushed,
          pulled: 0,
          conflicts: 0,
          error: criticalError || friendsOnly.error || undefined,
        };
      }
      const eventIdSet = new Set(userEventIds);

      // ── 2. Event_participants + Participantes ─────────────────────────────
      // IMPORTANTE: se suben primero los participants y luego event_participants
      // por la FK event_participants.participant_id → participants.id
      const allEPs: any[] = await db.getAll('event_participants');
      const relevantEPs = allEPs.filter((ep) => eventIdSet.has(ep.event_id));
      const participantIdsInEvents = new Set(relevantEPs.map((ep) => ep.participant_id));

      // 2a. Participantes: amigos del usuario + los de sus eventos
      const allParticipants: any[] = await db.getAll('participants');
      const relevantParticipants = allParticipants.filter(
        (p) => p.created_by_user_id === userId || participantIdsInEvents.has(p.id)
      );

      if (relevantParticipants.length > 0) {
        const participantsToUpsert = relevantParticipants.map((p) => ({
          id: p.id,
          name: p.name,
          email: p.email || null,
          phone: p.phone || null,
          alias_cbu: p.alias_cbu || null,
          avatar: p.avatar || null,
          is_active: p.is_active === 1 || p.is_active === true,
          participant_type: p.participant_type || 'temporary',
          user_id: p.user_id || null,
          created_by_user_id: p.created_by_user_id || userId,
          is_public: p.is_public === 1 || p.is_public === true,
          times_used: p.times_used ?? 0,
          last_used_at: p.last_used_at || null,
          created_at: p.created_at || new Date().toISOString(),
          updated_at: p.updated_at || new Date().toISOString(),
        }));
        const { error } = await supabase.from('participants').upsert(participantsToUpsert, { onConflict: 'id' });
        if (!error) pushed += relevantParticipants.length;
        else {
          if (!criticalError) criticalError = `participants: ${error.message}`;
          console.warn('⚠️ WebPush participants error:', error.message);
        }
      }

      // 2b. Event_participants (después de participants por la FK)
      if (relevantEPs.length > 0) {
        const epsToUpsert = relevantEPs.map((ep) => ({
          id: ep.id,
          event_id: ep.event_id,
          participant_id: ep.participant_id,
          role: ep.role || 'member',
          balance: ep.balance ?? 0,
          joined_at: ep.joined_at || new Date().toISOString(),
          parent_participant_id: ep.parent_participant_id || null,
        }));
        const { error } = await supabase.from('event_participants').upsert(epsToUpsert, { onConflict: 'event_id,participant_id', ignoreDuplicates: true });
        if (error) console.warn('⚠️ WebPush event_participants error:', error.message);
      }

      // ── 4. Gastos ─────────────────────────────────────────────────────────
      const allExpenses: any[] = await db.getAll('expenses');
      const relevantExpenses = allExpenses.filter((ex) => eventIdSet.has(ex.event_id));
      const expenseIdSet = new Set(relevantExpenses.map((ex) => ex.id));

      if (relevantExpenses.length > 0) {
        const expensesToUpsert = relevantExpenses.map((ex) => ({
          id: ex.id,
          event_id: ex.event_id,
          description: ex.description,
          amount: ex.amount,
          currency: ex.currency,
          original_amount: ex.original_amount || null,
          conversion_rate: ex.conversion_rate ?? 1.0,
          date: ex.date,
          category: ex.category || null,
          payer_id: ex.payer_id,
          payer_name: ex.payer_name || '',
          receipt_image: ex.receipt_image || null,
          is_active: ex.is_active === 1 || ex.is_active === true,
          created_at: ex.created_at || new Date().toISOString(),
          updated_at: ex.updated_at || new Date().toISOString(),
        }));
        const { error } = await supabase.from('expenses').upsert(expensesToUpsert, { onConflict: 'id' });
        if (!error) pushed += relevantExpenses.length;
        else console.warn('⚠️ WebPush expenses error:', error.message);
      }

      // ── 5. Splits ─────────────────────────────────────────────────────────
      const allSplits: any[] = await db.getAll('splits');
      const relevantSplits = allSplits.filter((sp) => expenseIdSet.has(sp.expense_id));

      if (relevantSplits.length > 0) {
        const splitsToUpsert = relevantSplits.map((sp) => ({
          id: sp.id,
          expense_id: sp.expense_id,
          participant_id: sp.participant_id,
          amount: sp.amount,
          percentage: sp.percentage ?? null,
          type: sp.type || 'equal',
          is_paid: sp.is_paid === 1 || sp.is_paid === true,
          created_at: sp.created_at || new Date().toISOString(),
          updated_at: sp.updated_at || new Date().toISOString(),
        }));
        const { error } = await supabase.from('splits').upsert(splitsToUpsert, { onConflict: 'id' });
        if (!error) pushed += relevantSplits.length;
        else console.warn('⚠️ WebPush splits error:', error.message);
      }

      // ── 6. Liquidaciones ──────────────────────────────────────────────────
      const allSettlements: any[] = await db.getAll('settlements');
      const relevantSettlements = allSettlements.filter((s) => eventIdSet.has(s.event_id));

      if (relevantSettlements.length > 0) {
        const settlementsToUpsert = relevantSettlements.map((s) => ({
          id: s.id,
          event_id: s.event_id,
          from_participant_id: s.from_participant_id,
          from_participant_name: s.from_participant_name,
          to_participant_id: s.to_participant_id,
          to_participant_name: s.to_participant_name,
          amount: s.amount,
          is_paid: s.is_paid === 1 || s.is_paid === true,
          paid_at: s.paid_at || null,
          event_status: s.event_status || 'active',
          receipt_image: s.receipt_image || null,
          notes: s.notes || null,
          created_at: s.created_at || new Date().toISOString(),
          updated_at: s.updated_at || new Date().toISOString(),
        }));
        const { error } = await supabase.from('settlements').upsert(settlementsToUpsert, { onConflict: 'id' });
        if (!error) pushed += relevantSettlements.length;
        else console.warn('⚠️ WebPush settlements error:', error.message);
      }

      // ── 7. Actividades (organización) ─────────────────────────────────────
      const allActivities: any[] = await db.getAll('activities');
      const relevantActivities = allActivities.filter((a) => eventIdSet.has(a.event_id));
      const activityIdSet = new Set(relevantActivities.map((a) => a.id));

      if (relevantActivities.length > 0) {
        const activitiesToUpsert = relevantActivities.map((a) => ({
          id: a.id,
          event_id: a.event_id,
          title: a.title,
          description: a.description || null,
          position: a.position ?? 0,
          created_by_user_id: a.created_by_user_id || null,
          created_at: a.created_at || new Date().toISOString(),
          updated_at: a.updated_at || new Date().toISOString(),
        }));
        const { error } = await supabase.from('activities').upsert(activitiesToUpsert, { onConflict: 'id' });
        if (!error) pushed += relevantActivities.length;
        else console.warn('⚠️ WebPush activities error:', error.message);
      }

      // ── 8. Asignaciones de actividades ────────────────────────────────────
      const allActivityParticipants: any[] = await db.getAll('activity_participants');
      const relevantActivityParticipants = allActivityParticipants.filter((ap) => activityIdSet.has(ap.activity_id));

      if (relevantActivityParticipants.length > 0) {
        const apToUpsert = relevantActivityParticipants.map((ap) => ({
          id: ap.id,
          activity_id: ap.activity_id,
          participant_id: ap.participant_id,
          created_at: ap.created_at || new Date().toISOString(),
        }));
        const { error } = await supabase.from('activity_participants').upsert(apToUpsert, { onConflict: 'activity_id,participant_id', ignoreDuplicates: true });
        if (!error) pushed += relevantActivityParticipants.length;
        else console.warn('⚠️ WebPush activity_participants error:', error.message);
      }

      console.log(`${criticalError ? '⚠️' : '✅'} WebPush completo: ${pushed} registros subidos${criticalError ? ` (con error: ${criticalError})` : ''}`);
      return {
        success: !criticalError,
        pushed,
        pulled: 0,
        conflicts: 0,
        error: criticalError || undefined,
      };
    } catch (error: any) {
      console.error('❌ WebPush error:', error);
      return { success: false, pushed: 0, pulled: 0, conflicts: 0, error: error.message };
    }
  }

  // ─── PULL web: Supabase → IndexedDB ───────────────────────────────────────
  private async _pullWeb(userId: string): Promise<SyncResult> {
    const db = this.getWebDb();
    if (!db) return { success: true, pushed: 0, pulled: 0, conflicts: 0 };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, pushed: 0, pulled: 0, conflicts: 0, error: 'Sin sesión Supabase' };
      }

      let pulled = 0;

      // ── 1. Eventos: propios + donde participa ─────────────────────────────
      const { data: ownedEvents, error: oeError } = await supabase
        .from('events').select('*').eq('creator_id', userId);
      if (oeError) throw new Error(`WebPull events: ${oeError.message}`);

      const { data: userParticipants } = await supabase
        .from('participants').select('id').eq('user_id', userId);

      let participatedEventIds: string[] = [];
      if (userParticipants && userParticipants.length > 0) {
        const pIds = userParticipants.map((p) => p.id);
        const { data: epData } = await supabase
          .from('event_participants').select('event_id').in('participant_id', pIds);
        if (epData) {
          const ownedIds = new Set((ownedEvents || []).map((e) => e.id));
          participatedEventIds = [...new Set(epData.map((ep) => ep.event_id))].filter((id) => !ownedIds.has(id));
        }
      }

      let participatedEvents: any[] = [];
      if (participatedEventIds.length > 0) {
        const { data: pEvents } = await supabase.from('events').select('*').in('id', participatedEventIds);
        participatedEvents = pEvents ?? [];
      }

      // Eventos donde el usuario es COLABORADOR (share editor/viewer).
      let collaboratorEvents: any[] = [];
      const { data: collabRows } = await supabase
        .from('event_collaborators').select('event_id').eq('user_id', userId);
      if (collabRows && collabRows.length > 0) {
        const ownedIds = new Set((ownedEvents || []).map((e) => e.id));
        const participatedIds = new Set(participatedEventIds);
        const collabEventIds = [...new Set(collabRows.map((c: any) => c.event_id))]
          .filter((id) => !ownedIds.has(id) && !participatedIds.has(id));
        if (collabEventIds.length > 0) {
          const { data: cEvents } = await supabase.from('events').select('*').in('id', collabEventIds);
          collaboratorEvents = cEvents ?? [];
        }
      }

      const allCloudEvents = [...(ownedEvents ?? []), ...participatedEvents, ...collaboratorEvents];
      if (allCloudEvents.length === 0) {
        await AsyncStorage.setItem(LAST_PULL_KEY, new Date().toISOString());
        return { success: true, pushed: 0, pulled: 0, conflicts: 0 };
      }
      const allEventIds = allCloudEvents.map((e) => e.id);

      // Upsert eventos → IndexedDB
      for (const e of allCloudEvents) {
        await db.put('events', {
          id: e.id,
          name: e.name,
          description: e.description ?? null,
          start_date: e.start_date,
          location: e.location ?? null,
          currency: e.currency,
          total_amount: e.total_amount ?? 0,
          status: e.status,
          type: e.type,
          category: e.category ?? null,
          creator_id: e.creator_id ?? null,
          is_locked: e.is_locked ? 1 : 0,
          is_express: e.is_express ? 1 : 0,
          is_shared: e.is_shared ? 1 : 0,
          shared_role: e.shared_role ?? null,
          share_id: e.share_id ?? null,
          closing_comment: e.closing_comment ?? null,
          closed_at: e.closed_at ?? null,
          completed_at: e.completed_at ?? null,
          created_at: e.created_at,
          updated_at: e.updated_at,
        });
        pulled++;
      }

      // ── 2. Event_participants ─────────────────────────────────────────────
      const { data: cloudEPs } = await supabase
        .from('event_participants').select('*').in('event_id', allEventIds);
      const participantIds: string[] = [];
      if (cloudEPs) {
        for (const ep of cloudEPs) {
          await db.put('event_participants', {
            id: ep.id,
            event_id: ep.event_id,
            participant_id: ep.participant_id,
            role: ep.role,
            balance: ep.balance ?? 0,
            joined_at: ep.joined_at ?? new Date().toISOString(),
            parent_participant_id: ep.parent_participant_id ?? null,
          });
          participantIds.push(ep.participant_id);
        }
      }

      // ── 3. Participantes (de eventos + amigos) ────────────────────────────
      const { data: userFriends } = await supabase
        .from('participants').select('*').eq('created_by_user_id', userId);
      const friendIds = (userFriends ?? []).map((p) => p.id);
      const allParticipantIdsToFetch = [...new Set([...participantIds, ...friendIds])];

      if (allParticipantIdsToFetch.length > 0) {
        const { data: cloudParticipants } = await supabase
          .from('participants').select('*').in('id', allParticipantIdsToFetch);
        if (cloudParticipants) {
          for (const p of cloudParticipants) {
            await db.put('participants', {
              id: p.id,
              name: p.name,
              email: p.email ?? null,
              phone: p.phone ?? null,
              alias_cbu: p.alias_cbu ?? null,
              avatar: p.avatar ?? null,
              is_active: p.is_active ? 1 : 0,
              participant_type: p.participant_type ?? 'temporary',
              user_id: p.user_id ?? null,
              created_by_user_id: p.created_by_user_id ?? null,
              is_public: p.is_public ? 1 : 0,
              times_used: p.times_used ?? 0,
              last_used_at: p.last_used_at ?? null,
              created_at: p.created_at,
              updated_at: p.updated_at,
            });
            pulled++;
          }
        }
      }

      // ── 4. Gastos ─────────────────────────────────────────────────────────
      const { data: cloudExpenses } = await supabase
        .from('expenses').select('*').in('event_id', allEventIds);
      const cloudExpenseIds: string[] = [];
      if (cloudExpenses) {
        for (const ex of cloudExpenses) {
          await db.put('expenses', {
            id: ex.id,
            event_id: ex.event_id,
            description: ex.description,
            amount: ex.amount,
            currency: ex.currency,
            original_amount: ex.original_amount ?? null,
            conversion_rate: ex.conversion_rate ?? 1.0,
            date: ex.date,
            category: ex.category ?? null,
            payer_id: ex.payer_id,
            payer_name: ex.payer_name ?? '',
            receipt_image: ex.receipt_image ?? null,
            is_active: ex.is_active ? 1 : 0,
            created_at: ex.created_at,
            updated_at: ex.updated_at,
          });
          cloudExpenseIds.push(ex.id);
          pulled++;
        }
      }

      // ── 5. Splits ─────────────────────────────────────────────────────────
      if (cloudExpenseIds.length > 0) {
        const { data: cloudSplits } = await supabase
          .from('splits').select('*').in('expense_id', cloudExpenseIds);
        if (cloudSplits) {
          for (const sp of cloudSplits) {
            await db.put('splits', {
              id: sp.id,
              expense_id: sp.expense_id,
              participant_id: sp.participant_id,
              amount: sp.amount,
              percentage: sp.percentage ?? null,
              type: sp.type ?? 'equal',
              is_paid: sp.is_paid ? 1 : 0,
              created_at: sp.created_at,
              updated_at: sp.updated_at,
            });
            pulled++;
          }
        }
      }

      // ── 6. Liquidaciones ──────────────────────────────────────────────────
      const { data: cloudSettlements } = await supabase
        .from('settlements').select('*').in('event_id', allEventIds);
      if (cloudSettlements) {
        for (const s of cloudSettlements) {
          await db.put('settlements', {
            id: s.id,
            event_id: s.event_id,
            from_participant_id: s.from_participant_id,
            from_participant_name: s.from_participant_name,
            to_participant_id: s.to_participant_id,
            to_participant_name: s.to_participant_name,
            amount: s.amount,
            is_paid: s.is_paid ? 1 : 0,
            paid_at: s.paid_at ?? null,
            event_status: s.event_status ?? 'active',
            receipt_image: s.receipt_image ?? null,
            notes: s.notes ?? null,
            created_at: s.created_at,
            updated_at: s.updated_at,
          });
          pulled++;
        }
      }

      // ── 7. Actividades (organización) ─────────────────────────────────────
      const { data: cloudActivities } = await supabase
        .from('activities').select('*').in('event_id', allEventIds);
      const cloudActivityIds: string[] = [];
      if (cloudActivities) {
        for (const a of cloudActivities) {
          await db.put('activities', {
            id: a.id,
            event_id: a.event_id,
            title: a.title,
            description: a.description ?? null,
            position: a.position ?? 0,
            created_by_user_id: a.created_by_user_id ?? null,
            created_at: a.created_at,
            updated_at: a.updated_at,
            sync_status: 'synced',
          });
          cloudActivityIds.push(a.id);
          pulled++;
        }
      }

      // ── 8. Asignaciones de actividades ────────────────────────────────────
      if (cloudActivityIds.length > 0) {
        const { data: cloudActivityParticipants } = await supabase
          .from('activity_participants').select('*').in('activity_id', cloudActivityIds);
        if (cloudActivityParticipants) {
          for (const ap of cloudActivityParticipants) {
            try {
              // El índice único (activity_id, participant_id) aborta el put si ya
              // existe localmente la misma pareja con OTRO id. Se elimina el
              // duplicado local (la nube es la fuente de verdad) antes de insertar.
              const existing: any = await db.getFromIndex(
                'activity_participants', 'activity_participant',
                [ap.activity_id, ap.participant_id]
              );
              if (existing && existing.id !== ap.id) {
                await db.delete('activity_participants', existing.id);
              }
              await db.put('activity_participants', {
                id: ap.id,
                activity_id: ap.activity_id,
                participant_id: ap.participant_id,
                created_at: ap.created_at,
                sync_status: 'synced',
              });
              pulled++;
            } catch (apErr: any) {
              console.warn('⚠️ WebPull activity_participant omitido:', apErr?.message);
            }
          }
        }
      }

      await AsyncStorage.setItem(LAST_PULL_KEY, new Date().toISOString());
      console.log(`✅ WebPull completo: ${pulled} registros descargados (${allCloudEvents.length} eventos)`);
      return { success: true, pushed: 0, pulled, conflicts: 0 };
    } catch (error: any) {
      console.error('❌ WebPull error:', error);
      return { success: false, pushed: 0, pulled: 0, conflicts: 0, error: error.message };
    }
  }
}
