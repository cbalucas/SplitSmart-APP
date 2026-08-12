/**
 * IndexedDBDatabaseService
 *
 * Implementación web de IDatabaseService usando IndexedDB (via librería `idb`).
 * Se activa automáticamente cuando Platform.OS === 'web' a través de DatabaseFactory.
 *
 * Schema equivalente al de SQLite:
 *   events, participants, event_participants, expenses, expense_payers,
 *   splits, settlements, users, user_preferences, app_versions, consolidation_assignments
 *
 * La lógica de negocio pura (balances, liquidaciones óptimas) se copia directamente
 * desde database.ts ya que no depende de SQLite.
 */

import { openDB, IDBPDatabase } from 'idb';
import { Event, Participant, Expense, EventParticipant, Split, Payment, Activity, ActivityTemplate } from '../types';
import { IDatabaseService } from './IDatabaseService';
import { generateId, deterministicId } from '../utils/uuid';

const DB_NAME = 'splitsmart';
const DB_VERSION = 4;

// ─── Tipos internos ───────────────────────────────────────────────────────────

type StoreNames =
  | 'events'
  | 'participants'
  | 'event_participants'
  | 'expenses'
  | 'expense_payers'
  | 'splits'
  | 'settlements'
  | 'users'
  | 'user_preferences'
  | 'app_versions'
  | 'consolidation_assignments'
  | 'activities'
  | 'activity_participants'
  | 'activity_templates';

// ─── Clase principal ──────────────────────────────────────────────────────────

export class IndexedDBDatabaseService implements IDatabaseService {
  private db: IDBPDatabase | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  async init(): Promise<void> {
    if (this.isInitialized && this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._initInternal();
    await this.initPromise;
    this.initPromise = null;
  }

  private async _initInternal(): Promise<void> {
    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // events
        if (!db.objectStoreNames.contains('events')) {
          const eventsStore = db.createObjectStore('events', { keyPath: 'id' });
          eventsStore.createIndex('status', 'status');
          eventsStore.createIndex('creator_id', 'creator_id');
        }
        // participants
        if (!db.objectStoreNames.contains('participants')) {
          const pStore = db.createObjectStore('participants', { keyPath: 'id' });
          pStore.createIndex('participant_type', 'participant_type');
          pStore.createIndex('user_id', 'user_id');
          pStore.createIndex('created_by_user_id', 'created_by_user_id');
        }
        // event_participants
        if (!db.objectStoreNames.contains('event_participants')) {
          const epStore = db.createObjectStore('event_participants', { keyPath: 'id' });
          epStore.createIndex('event_id', 'event_id');
          epStore.createIndex('participant_id', 'participant_id');
          epStore.createIndex('event_participant', ['event_id', 'participant_id'], { unique: true });
        }
        // expenses
        if (!db.objectStoreNames.contains('expenses')) {
          const exStore = db.createObjectStore('expenses', { keyPath: 'id' });
          exStore.createIndex('event_id', 'event_id');
        }
        // expense_payers
        if (!db.objectStoreNames.contains('expense_payers')) {
          const epayStore = db.createObjectStore('expense_payers', { keyPath: 'id' });
          epayStore.createIndex('expense_id', 'expense_id');
        }
        // splits
        if (!db.objectStoreNames.contains('splits')) {
          const sStore = db.createObjectStore('splits', { keyPath: 'id' });
          sStore.createIndex('expense_id', 'expense_id');
        }
        // settlements
        if (!db.objectStoreNames.contains('settlements')) {
          const setStore = db.createObjectStore('settlements', { keyPath: 'id' });
          setStore.createIndex('event_id', 'event_id');
        }
        // users
        if (!db.objectStoreNames.contains('users')) {
          const uStore = db.createObjectStore('users', { keyPath: 'id' });
          uStore.createIndex('username', 'username', { unique: true });
          uStore.createIndex('email', 'email', { unique: true });
        }
        // user_preferences
        if (!db.objectStoreNames.contains('user_preferences')) {
          const upStore = db.createObjectStore('user_preferences', { keyPath: 'id' });
          upStore.createIndex('user_key', ['user_id', 'key'], { unique: true });
        }
        // app_versions
        if (!db.objectStoreNames.contains('app_versions')) {
          const avStore = db.createObjectStore('app_versions', { keyPath: 'id', autoIncrement: true });
          avStore.createIndex('version', 'version', { unique: true });
          avStore.createIndex('is_current', 'is_current');
        }
        // consolidation_assignments
        if (!db.objectStoreNames.contains('consolidation_assignments')) {
          const caStore = db.createObjectStore('consolidation_assignments', { keyPath: 'id', autoIncrement: true });
          caStore.createIndex('event_id', 'event_id');
        }
        // activities
        if (!db.objectStoreNames.contains('activities')) {
          const actStore = db.createObjectStore('activities', { keyPath: 'id' });
          actStore.createIndex('event_id', 'event_id');
        }
        // activity_participants
        if (!db.objectStoreNames.contains('activity_participants')) {
          const apStore = db.createObjectStore('activity_participants', { keyPath: 'id' });
          apStore.createIndex('activity_id', 'activity_id');
          apStore.createIndex('participant_id', 'participant_id');
          apStore.createIndex('activity_participant', ['activity_id', 'participant_id'], { unique: true });
        }
        // activity_templates
        if (!db.objectStoreNames.contains('activity_templates')) {
          const atStore = db.createObjectStore('activity_templates', { keyPath: 'id' });
          atStore.createIndex('user_id', 'user_id');
        }
        // deletions (tombstones): eliminaciones locales pendientes de propagar a Supabase
        if (!db.objectStoreNames.contains('deletions')) {
          const delStore = db.createObjectStore('deletions', { keyPath: 'id' });
          delStore.createIndex('table_name', 'table_name');
        }
      },
    });

    this.isInitialized = true;
    try {
      await this._migrateLegacyIdsToUuid();
    } catch (e) {
      console.warn('⚠️ Migración de IDs legacy falló (continuando):', e);
    }
    await this._createDemoUserIfNotExists();
    console.log('✅ IndexedDB initialized successfully');
  }

  // ─── Migración única: IDs legacy (Date.now()_random) → UUID ─────────────────
  // Los registros creados antes de unificar la generación de IDs usaban el
  // formato `${Date.now()}_${random}`, que las columnas UUID de Supabase
  // rechazan (invalid input syntax for type uuid). Esta migración normaliza
  // los IDs a UUID válidos y actualiza todas las referencias FK de forma
  // consistente. Es idempotente: tras la primera ejecución todo es UUID y
  // no vuelve a modificar nada.
  private async _migrateLegacyIdsToUuid(): Promise<void> {
    const db = this._db();
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isUuid = (v: any): boolean => typeof v === 'string' && UUID_RE.test(v);

    // Paso 1: construir el mapa old→new para entidades referenciadas por FK
    // (events, participants, expenses). Sus PKs deben resolverse en el remap.
    const idMap = new Map<string, string>();
    for (const store of ['events', 'participants', 'expenses'] as const) {
      const rows = (await db.getAll(store)) as any[];
      for (const r of rows) {
        if (r && typeof r.id === 'string' && !isUuid(r.id)) {
          idMap.set(r.id, generateId());
        }
      }
    }
    const remap = (v: any): any => (typeof v === 'string' && idMap.has(v) ? idMap.get(v)! : v);

    let changed = 0;

    // events (solo PK)
    for (const r of (await db.getAll('events')) as any[]) {
      if (!isUuid(r.id)) {
        const oldId = r.id;
        r.id = idMap.get(oldId)!;
        await db.delete('events', oldId);
        await db.put('events', r);
        changed++;
      }
    }

    // participants (solo PK)
    for (const r of (await db.getAll('participants')) as any[]) {
      if (!isUuid(r.id)) {
        const oldId = r.id;
        r.id = idMap.get(oldId)!;
        await db.delete('participants', oldId);
        await db.put('participants', r);
        changed++;
      }
    }

    // expenses (PK + FK event_id, payer_id)
    for (const r of (await db.getAll('expenses')) as any[]) {
      const oldId = r.id;
      const needPk = !isUuid(oldId);
      const nEvent = remap(r.event_id);
      const nPayer = remap(r.payer_id);
      if (needPk || nEvent !== r.event_id || nPayer !== r.payer_id) {
        r.event_id = nEvent;
        r.payer_id = nPayer;
        if (needPk) {
          r.id = idMap.get(oldId)!;
          await db.delete('expenses', oldId);
        }
        await db.put('expenses', r);
        changed++;
      }
    }

    // event_participants (PK propio + FK event_id, participant_id, parent_participant_id)
    for (const r of (await db.getAll('event_participants')) as any[]) {
      const oldId = r.id;
      const needPk = !isUuid(oldId);
      const nEv = remap(r.event_id);
      const nP = remap(r.participant_id);
      const nParent = r.parent_participant_id ? remap(r.parent_participant_id) : r.parent_participant_id;
      if (needPk || nEv !== r.event_id || nP !== r.participant_id || nParent !== r.parent_participant_id) {
        r.event_id = nEv;
        r.participant_id = nP;
        r.parent_participant_id = nParent;
        if (needPk) {
          r.id = generateId();
          await db.delete('event_participants', oldId);
        }
        await db.put('event_participants', r);
        changed++;
      }
    }

    // expense_payers (PK propio + FK expense_id, participant_id)
    for (const r of (await db.getAll('expense_payers')) as any[]) {
      const oldId = r.id;
      const needPk = !isUuid(oldId);
      const nEx = remap(r.expense_id);
      const nP = remap(r.participant_id);
      if (needPk || nEx !== r.expense_id || nP !== r.participant_id) {
        r.expense_id = nEx;
        r.participant_id = nP;
        if (needPk) {
          r.id = generateId();
          await db.delete('expense_payers', oldId);
        }
        await db.put('expense_payers', r);
        changed++;
      }
    }

    // splits (PK propio + FK expense_id, participant_id)
    for (const r of (await db.getAll('splits')) as any[]) {
      const oldId = r.id;
      const needPk = !isUuid(oldId);
      const nEx = remap(r.expense_id);
      const nP = remap(r.participant_id);
      if (needPk || nEx !== r.expense_id || nP !== r.participant_id) {
        r.expense_id = nEx;
        r.participant_id = nP;
        if (needPk) {
          r.id = generateId();
          await db.delete('splits', oldId);
        }
        await db.put('splits', r);
        changed++;
      }
    }

    // settlements (PK propio + FK event_id, from_participant_id, to_participant_id)
    for (const r of (await db.getAll('settlements')) as any[]) {
      const oldId = r.id;
      const needPk = !isUuid(oldId);
      const nEv = remap(r.event_id);
      const nFrom = remap(r.from_participant_id);
      const nTo = remap(r.to_participant_id);
      if (needPk || nEv !== r.event_id || nFrom !== r.from_participant_id || nTo !== r.to_participant_id) {
        r.event_id = nEv;
        r.from_participant_id = nFrom;
        r.to_participant_id = nTo;
        if (needPk) {
          r.id = generateId();
          await db.delete('settlements', oldId);
        }
        await db.put('settlements', r);
        changed++;
      }
    }

    // consolidation_assignments (PK autoIncrement → se conserva; FK event_id, payer_id, debtor_id)
    for (const r of (await db.getAll('consolidation_assignments')) as any[]) {
      const nEv = remap(r.event_id);
      const nPayer = remap(r.payer_id);
      const nDebtor = remap(r.debtor_id);
      if (nEv !== r.event_id || nPayer !== r.payer_id || nDebtor !== r.debtor_id) {
        r.event_id = nEv;
        r.payer_id = nPayer;
        r.debtor_id = nDebtor;
        await db.put('consolidation_assignments', r);
        changed++;
      }
    }

    if (changed > 0) {
      console.log(`🔧 Migración de IDs legacy → UUID: ${changed} registros normalizados`);
    }
  }

  private _db(): IDBPDatabase {
    if (!this.db) throw new Error('IndexedDB not initialized. Call init() first.');
    return this.db;
  }

  // ─── Versioning ────────────────────────────────────────────────────────────

  async getCurrentVersion(): Promise<{ version: string; versionName: string } | null> {
    const db = this._db();
    const all = await db.getAllFromIndex('app_versions', 'is_current', 1);
    if (!all.length) return null;
    const v = all[0] as any;
    return { version: v.version, versionName: v.version_name || v.version };
  }

  async getVersionHistory(): Promise<any[]> {
    const db = this._db();
    const all = await db.getAll('app_versions') as any[];
    return all
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map(v => ({
        ...v,
        changelog_improvements: this._parseJSON(v.changelog_improvements),
        changelog_features: this._parseJSON(v.changelog_features),
        changelog_bugfixes: this._parseJSON(v.changelog_bugfixes),
      }));
  }

  // ─── Events ────────────────────────────────────────────────────────────────

  async createEvent(event: Omit<Event, 'totalAmount'>): Promise<void> {
    const db = this._db();
    await db.put('events', {
      id: event.id,
      name: event.name,
      description: event.description || null,
      start_date: event.startDate,
      location: event.location || null,
      currency: event.currency,
      total_amount: 0,
      status: event.status,
      type: event.type,
      category: event.category || null,
      creator_id: event.creatorId || null,
      closed_at: null,
      completed_at: null,
      is_locked: 0,
      is_express: event.isExpress ? 1 : 0,
      created_at: event.createdAt,
      updated_at: event.updatedAt,
    });
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<void> {
    const db = this._db();
    const existing = await db.get('events', id) as any;
    if (!existing) throw new Error(`Event not found: ${id}`);

    const updated = { ...existing };
    if (updates.name !== undefined) updated.name = updates.name;
    if (updates.description !== undefined) updated.description = updates.description;
    if (updates.startDate !== undefined) updated.start_date = updates.startDate;
    if (updates.location !== undefined) updated.location = updates.location;
    if (updates.currency !== undefined) updated.currency = updates.currency;
    if (updates.status !== undefined) updated.status = updates.status;
    if (updates.type !== undefined) updated.type = updates.type;
    if (updates.category !== undefined) updated.category = updates.category;
    if (updates.closedAt !== undefined) updated.closed_at = updates.closedAt;
    if (updates.completedAt !== undefined) updated.completed_at = updates.completedAt;
    if (updates.isLocked !== undefined) updated.is_locked = updates.isLocked ? 1 : 0;
    updated.updated_at = new Date().toISOString();

    await db.put('events', updated);
  }

  async deleteEvent(id: string): Promise<void> {
    const db = this._db();
    // cascade manual
    await db.delete('events', id);
    await this._recordDeletion('events', id);
    const epList = await db.getAllFromIndex('event_participants', 'event_id', id) as any[];
    for (const ep of epList) { await db.delete('event_participants', ep.id); await this._recordDeletion('event_participants', ep.id); }
    const exList = await db.getAllFromIndex('expenses', 'event_id', id) as any[];
    for (const ex of exList) {
      const splits = await db.getAllFromIndex('splits', 'expense_id', ex.id) as any[];
      for (const s of splits) { await db.delete('splits', s.id); await this._recordDeletion('splits', s.id); }
      const payers = await db.getAllFromIndex('expense_payers', 'expense_id', ex.id) as any[];
      for (const p of payers) { await db.delete('expense_payers', p.id); await this._recordDeletion('expense_payers', p.id); }
      await db.delete('expenses', ex.id);
      await this._recordDeletion('expenses', ex.id);
    }
    const settlements = await db.getAllFromIndex('settlements', 'event_id', id) as any[];
    for (const s of settlements) { await db.delete('settlements', s.id); await this._recordDeletion('settlements', s.id); }
  }

  async getEvents(): Promise<Event[]> {
    const db = this._db();
    const rows = await db.getAll('events') as any[];
    return rows
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map(this._mapEvent);
  }

  async getEventById(eventId: string): Promise<Event | null> {
    const db = this._db();
    const row = await db.get('events', eventId) as any;
    return row ? this._mapEvent(row) : null;
  }

  private _mapEvent(row: any): Event {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      startDate: row.start_date,
      location: row.location,
      currency: row.currency,
      totalAmount: row.total_amount,
      status: row.status,
      type: row.type,
      category: row.category,
      creatorId: row.creator_id,
      closedAt: row.closed_at,
      completedAt: row.completed_at,
      isLocked: row.is_locked === 1 || row.is_locked === true,
      isExpress: row.is_express === 1 || row.is_express === true,
      isShared: row.is_shared === 1 || row.is_shared === true,
      sharedRole: (row.shared_role as 'editor' | 'viewer') || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // ─── Participants ──────────────────────────────────────────────────────────

  async importSharedEvent(payload: any, role: 'editor' | 'viewer', shareId?: string, ownerName?: string, ownerId?: string): Promise<Event> {
    // Web implementation: delegates to a thin local-only import
    const { v4: uuidv4 } = await import('uuid');
    const now = new Date().toISOString();
    // Colaboración en la nube (share con shareId): conservar IDs originales del
    // dueño y marcar como 'synced' para que la sync por-registro converja sobre
    // el mismo event_id. creator_id = ownerId (no reclamar propiedad).
    const isCloudShare = !!shareId;
    const importSyncStatus = isCloudShare ? 'synced' : 'pending';
    const newEventId = isCloudShare && payload.e?.id ? payload.e.id : uuidv4();
    const creatorId = isCloudShare && ownerId ? ownerId : null;
    const db = this._db();
    await db.put('events', {
      id: newEventId,
      name: payload.e.n,
      description: payload.e.d || null,
      start_date: payload.e.s,
      location: payload.e.l || null,
      currency: payload.e.c,
      total_amount: 0,
      status: 'active',
      type: 'public',
      category: payload.e.cat || 'evento',
      creator_id: creatorId,
      is_locked: 0,
      is_express: 0,
      is_shared: 1,
      shared_role: role,
      share_id: shareId || null,
      sync_status: importSyncStatus,
      created_at: now,
      updated_at: now,
    });
    const idMap: Record<string, string> = {};
    for (const p of (payload.p || [])) {
      const newPId = isCloudShare && p.id ? p.id : uuidv4();
      idMap[p.id] = newPId;
      await db.put('participants', { id: newPId, name: p.n, is_active: 1, participant_type: 'temporary', sync_status: importSyncStatus, created_at: now, updated_at: now });
    }
    for (const p of (payload.p || [])) {
      const parentId = p.pp ? (idMap[p.pp] || null) : null;
      await db.put('event_participants', { id: uuidv4(), event_id: newEventId, participant_id: idMap[p.id], role: 'member', joined_at: now, parent_participant_id: parentId });
    }
    for (const ex of (payload.ex || [])) {
      const newExId = isCloudShare && ex.id ? ex.id : uuidv4();
      idMap[ex.id] = newExId;
      const newPayerId = idMap[ex.pid] || uuidv4();
      await db.put('expenses', { id: newExId, event_id: newEventId, description: ex.d, amount: ex.a, currency: ex.c || payload.e.c, date: ex.dt, category: ex.cat || null, payer_id: newPayerId, payer_name: ex.pn || '', is_active: 1, sync_status: importSyncStatus, created_at: now, updated_at: now });
      for (const sp of (payload.sp || []).filter((s: any) => s.eid === ex.id)) {
        const newSpId = isCloudShare && sp.id ? sp.id : uuidv4();
        await db.put('splits', { id: newSpId, expense_id: newExId, participant_id: idMap[sp.pid] || sp.pid, amount: sp.a, type: sp.t || 'equal', is_paid: 0, sync_status: importSyncStatus, created_at: now, updated_at: now });
      }
    }
    const imported = await this.getEventById(newEventId);
    if (!imported) throw new Error('Failed to retrieve imported event');
    return imported;
  }

  async saveEventShare(_shareId: string, _eventId: string, _direction: 'sent' | 'received', _role: 'editor' | 'viewer', _ownerName?: string): Promise<void> {
    // Web: not implemented (IndexedDB would need an 'event_shares' store)
  }

  async getEventShares(_eventId?: string): Promise<any[]> {
    // Web: not implemented
    return [];
  }

  // ==================== Activities (Organización) ====================

  async getActivitiesByEvent(eventId: string): Promise<Activity[]> {
    const db = this._db();
    const rows = await db.getAllFromIndex('activities', 'event_id', eventId) as any[];
    const result: Activity[] = [];
    for (const row of rows) {
      const links = await db.getAllFromIndex('activity_participants', 'activity_id', row.id) as any[];
      result.push({
        id: row.id,
        eventId: row.event_id,
        title: row.title,
        description: row.description || undefined,
        position: row.position ?? 0,
        createdByUserId: row.created_by_user_id || undefined,
        createdAt: row.created_at || undefined,
        updatedAt: row.updated_at || undefined,
        assignedParticipantIds: links.map((l) => l.participant_id),
      });
    }
    result.sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || (a.createdAt || '').localeCompare(b.createdAt || ''));
    return result;
  }

  async createActivity(activity: Activity): Promise<void> {
    const db = this._db();
    const now = new Date().toISOString();
    await db.put('activities', {
      id: activity.id,
      event_id: activity.eventId,
      title: activity.title,
      description: activity.description || null,
      position: activity.position ?? 0,
      created_by_user_id: activity.createdByUserId || null,
      created_at: activity.createdAt || now,
      updated_at: activity.updatedAt || now,
      sync_status: 'pending',
    });
    if (activity.assignedParticipantIds && activity.assignedParticipantIds.length > 0) {
      await this.setActivityParticipants(activity.id, activity.assignedParticipantIds);
    }
  }

  async updateActivity(activityId: string, updates: Partial<Activity>): Promise<void> {
    const db = this._db();
    const existing = await db.get('activities', activityId) as any;
    if (!existing) return;
    const now = new Date().toISOString();
    if (updates.title !== undefined) existing.title = updates.title;
    if (updates.description !== undefined) existing.description = updates.description || null;
    if (updates.position !== undefined) existing.position = updates.position;
    existing.updated_at = now;
    existing.sync_status = 'pending';
    await db.put('activities', existing);
    if (updates.assignedParticipantIds !== undefined) {
      await this.setActivityParticipants(activityId, updates.assignedParticipantIds);
    }
  }

  async deleteActivity(activityId: string): Promise<void> {
    const db = this._db();
    const links = await db.getAllFromIndex('activity_participants', 'activity_id', activityId) as any[];
    for (const l of links) {
      await db.delete('activity_participants', l.id);
    }
    await db.delete('activities', activityId);
  }

  async setActivityParticipants(activityId: string, participantIds: string[]): Promise<void> {
    const db = this._db();
    const now = new Date().toISOString();
    const existing = await db.getAllFromIndex('activity_participants', 'activity_id', activityId) as any[];
    for (const l of existing) {
      await db.delete('activity_participants', l.id);
    }
    for (const pid of participantIds) {
      await db.put('activity_participants', {
        id: generateId(),
        activity_id: activityId,
        participant_id: pid,
        created_at: now,
        sync_status: 'pending',
      });
    }
  }

  // ==================== Activity Templates ====================

  async getActivityTemplates(userId: string): Promise<ActivityTemplate[]> {
    const db = this._db();
    const rows = await db.getAllFromIndex('activity_templates', 'user_id', userId) as any[];
    return rows
      .map((row) => {
        let tasks: string[] = [];
        try { tasks = JSON.parse(row.tasks || '[]'); } catch { tasks = []; }
        return {
          id: row.id,
          userId: row.user_id,
          name: row.name,
          tasks,
          createdAt: row.created_at || undefined,
          updatedAt: row.updated_at || undefined,
        } as ActivityTemplate;
      })
      .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
  }

  async createActivityTemplate(template: ActivityTemplate): Promise<void> {
    const db = this._db();
    const now = new Date().toISOString();
    await db.put('activity_templates', {
      id: template.id,
      user_id: template.userId,
      name: template.name,
      tasks: JSON.stringify(template.tasks || []),
      created_at: template.createdAt || now,
      updated_at: template.updatedAt || now,
    });
  }

  async updateActivityTemplate(templateId: string, updates: Partial<ActivityTemplate>): Promise<void> {
    const db = this._db();
    const existing = await db.get('activity_templates', templateId) as any;
    if (!existing) return;
    const now = new Date().toISOString();
    if (updates.name !== undefined) existing.name = updates.name;
    if (updates.tasks !== undefined) existing.tasks = JSON.stringify(updates.tasks);
    existing.updated_at = now;
    await db.put('activity_templates', existing);
  }

  async deleteActivityTemplate(templateId: string): Promise<void> {
    const db = this._db();
    await db.delete('activity_templates', templateId);
  }

  async createParticipant(participant: Participant): Promise<void> {
    const db = this._db();
    await db.put('participants', {
      id: participant.id,
      name: participant.name,
      email: participant.email || null,
      phone: participant.phone || null,
      alias_cbu: participant.alias_cbu || null,
      avatar: participant.avatar || null,
      is_active: participant.isActive ? 1 : 0,
      participant_type: participant.participantType || 'temporary',
      user_id: participant.userId || null,
      created_by_user_id: participant.createdByUserId || null,
      is_public: participant.isPublic ? 1 : 0,
      times_used: participant.timesUsed || 0,
      last_used_at: participant.lastUsedAt || null,
      created_at: participant.createdAt || new Date().toISOString(),
      updated_at: participant.updatedAt || new Date().toISOString(),
    });
  }

  async getParticipants(): Promise<Participant[]> {
    const db = this._db();
    const rows = await db.getAll('participants') as any[];
    return rows.filter(r => r.is_active === 1).map(this._mapParticipant);
  }

  async getParticipantById(participantId: string): Promise<Participant | null> {
    const db = this._db();
    const row = await db.get('participants', participantId) as any;
    return row && row.is_active === 1 ? this._mapParticipant(row) : null;
  }

  async getFriends(): Promise<Participant[]> {
    const db = this._db();
    const rows = await db.getAllFromIndex('participants', 'participant_type', 'friend') as any[];
    return rows
      .filter(r => r.is_active === 1)
      .sort((a, b) => (b.times_used || 0) - (a.times_used || 0) || a.name.localeCompare(b.name))
      .map(this._mapParticipant);
  }

  async getFriendsByUser(userId: string): Promise<Participant[]> {
    const db = this._db();
    const rows = await db.getAllFromIndex('participants', 'participant_type', 'friend') as any[];
    return rows
      .filter(r =>
        r.is_active === 1 &&
        (r.created_by_user_id === userId || r.is_public === 1 || r.created_by_user_id == null)
      )
      .sort((a, b) => {
        const rank = (r: any) => r.created_by_user_id === userId ? 0 : r.created_by_user_id == null ? 1 : 2;
        return rank(a) - rank(b) || (b.times_used || 0) - (a.times_used || 0) || a.name.localeCompare(b.name);
      })
      .map(this._mapParticipant);
  }

  async getParticipantByUserId(userId: string): Promise<Participant | null> {
    const db = this._db();
    const rows = await db.getAllFromIndex('participants', 'user_id', userId) as any[];
    const row = rows.find(r => r.participant_type === 'friend' && r.is_active === 1);
    return row ? this._mapParticipant(row) : null;
  }

  async incrementParticipantUsage(participantId: string): Promise<void> {
    const db = this._db();
    const row = await db.get('participants', participantId) as any;
    if (!row) return;
    row.times_used = (row.times_used || 0) + 1;
    row.last_used_at = new Date().toISOString();
    await db.put('participants', row);
  }

  async updateParticipantType(id: string, type: 'friend' | 'temporary'): Promise<void> {
    const db = this._db();
    const row = await db.get('participants', id) as any;
    if (!row) return;
    row.participant_type = type;
    row.updated_at = new Date().toISOString();
    await db.put('participants', row);
  }

  async updateParticipant(id: string, updates: Partial<Participant>): Promise<void> {
    const db = this._db();
    const row = await db.get('participants', id) as any;
    if (!row) return;
    if (updates.name !== undefined) row.name = updates.name;
    if ('email' in updates) row.email = updates.email || null;
    if ('phone' in updates) row.phone = updates.phone || null;
    if ('alias_cbu' in updates) row.alias_cbu = updates.alias_cbu || null;
    if ('avatar' in updates) row.avatar = updates.avatar || null;
    if (updates.participantType !== undefined) row.participant_type = updates.participantType;
    if ('isPublic' in updates) row.is_public = updates.isPublic ? 1 : 0;
    if ('userId' in updates) row.user_id = updates.userId || null;
    if ('createdByUserId' in updates) row.created_by_user_id = updates.createdByUserId || null;
    row.updated_at = new Date().toISOString();
    await db.put('participants', row);
  }

  // Registra una eliminación local (tombstone) para propagarla a Supabase en el push.
  private async _recordDeletion(table: string, recordId: string): Promise<void> {
    if (!recordId) return;
    try {
      const db = this._db();
      await db.put('deletions', {
        id: `${table}:${recordId}`,
        table_name: table,
        record_id: recordId,
        deleted_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('⚠️ recordDeletion:', (e as any)?.message);
    }
  }

  async deleteParticipant(id: string): Promise<void> {
    const db = this._db();
    const epList = await db.getAllFromIndex('event_participants', 'participant_id', id) as any[];
    if (epList.length > 0) throw new Error('Cannot delete participant: still used in events');
    await db.delete('participants', id);
    await this._recordDeletion('participants', id);
  }

  private _mapParticipant(row: any): Participant {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      alias_cbu: row.alias_cbu,
      avatar: row.avatar,
      isActive: row.is_active === 1,
      participantType: row.participant_type,
      userId: row.user_id || undefined,
      createdByUserId: row.created_by_user_id || undefined,
      isPublic: row.is_public === 1,
      timesUsed: row.times_used || 0,
      lastUsedAt: row.last_used_at || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // ─── Event ↔ Participants ──────────────────────────────────────────────────

  async addParticipantToEvent(eventParticipant: EventParticipant): Promise<void> {
    const db = this._db();
    await db.put('event_participants', {
      id: eventParticipant.id,
      event_id: eventParticipant.eventId,
      participant_id: eventParticipant.participantId,
      role: eventParticipant.role,
      balance: eventParticipant.balance || 0,
      joined_at: eventParticipant.joinedAt || new Date().toISOString(),
      parent_participant_id: eventParticipant.parentParticipantId || null,
    });
  }

  async getEventParticipants(
    eventId: string
  ): Promise<(Participant & { role: EventParticipant['role']; balance: number; joinedAt: string })[]> {
    const db = this._db();
    const epList = await db.getAllFromIndex('event_participants', 'event_id', eventId) as any[];
    const result: any[] = [];
    for (const ep of epList) {
      const p = await db.get('participants', ep.participant_id) as any;
      if (!p || p.is_active !== 1) continue;
      result.push({
        ...this._mapParticipant(p),
        role: ep.role,
        balance: ep.balance,
        joinedAt: ep.joined_at,
        parentParticipantId: ep.parent_participant_id || undefined,
      });
    }
    return result;
  }

  async removeParticipantFromEvent(eventId: string, participantId: string): Promise<void> {
    const db = this._db();

    // Eliminar secundarios vinculados primero
    const allEps = await db.getAllFromIndex('event_participants', 'event_id', eventId) as any[];
    const secondaries = allEps.filter((ep: any) => ep.parent_participant_id === participantId);
    for (const s of secondaries) {
      await this.removeParticipantFromEvent(eventId, s.participant_id);
    }

    // Verificar si es pagador de algún gasto en este evento
    const expenses = await db.getAllFromIndex('expenses', 'event_id', eventId) as any[];
    const isPayer = expenses.some((e: any) => e.payer_id === participantId && e.is_active === 1);
    if (isPayer) {
      throw new Error('No se puede eliminar un participante que ha pagado gastos en este evento.');
    }

    // Redistribuir splits
    for (const expense of expenses.filter((e: any) => e.is_active === 1)) {
      const splits = await db.getAllFromIndex('splits', 'expense_id', expense.id) as any[];
      const mySplit = splits.find((s: any) => s.participant_id === participantId);
      if (!mySplit) continue;
      await db.delete('splits', mySplit.id);
      await this._recordDeletion('splits', mySplit.id);
      const remaining = splits.filter((s: any) => s.participant_id !== participantId);
      if (remaining.length > 0) {
        const perPerson = expense.amount / remaining.length;
        const pct = 100 / remaining.length;
        for (const s of remaining) {
          s.amount = perPerson;
          s.percentage = pct;
          s.updated_at = new Date().toISOString();
          await db.put('splits', s);
        }
      }
    }

    // Quitar de event_participants
    const ep = allEps.find((e: any) => e.participant_id === participantId);
    if (ep) {
      await db.delete('event_participants', ep.id);
      await this._recordDeletion('event_participants', ep.id);
    }

    // Eliminar liquidaciones que referencian a este participante (FK RESTRICT en
    // Supabase: sin esto, el borrado del participante en la nube fallaría).
    const evSettlements = await db.getAllFromIndex('settlements', 'event_id', eventId) as any[];
    for (const s of evSettlements) {
      if (s.from_participant_id === participantId || s.to_participant_id === participantId) {
        await db.delete('settlements', s.id);
        await this._recordDeletion('settlements', s.id);
      }
    }

    // Borrar participante temporal si ya no está en ningún evento
    const remaining = await db.getAllFromIndex('event_participants', 'participant_id', participantId) as any[];
    if (remaining.length === 0) {
      const p = await db.get('participants', participantId) as any;
      if (p && p.participant_type !== 'friend') {
        await db.delete('participants', participantId);
        await this._recordDeletion('participants', participantId);
      }
    }
  }

  async addParticipantToAllExpenses(eventId: string, participantId: string): Promise<void> {
    const db = this._db();
    const expenses = await db.getAllFromIndex('expenses', 'event_id', eventId) as any[];
    for (const expense of expenses) {
      const splits = await db.getAllFromIndex('splits', 'expense_id', expense.id) as any[];
      if (splits.some((s: any) => s.participant_id === participantId)) continue;
      const newCount = splits.length + 1;
      const perPerson = expense.amount / newCount;
      const pct = 100 / newCount;
      for (const s of splits) {
        s.amount = perPerson;
        s.percentage = pct;
        s.updated_at = new Date().toISOString();
        await db.put('splits', s);
      }
      await db.put('splits', {
        id: deterministicId(`${expense.id}_${participantId}`),
        expense_id: expense.id,
        participant_id: participantId,
        amount: perPerson,
        percentage: pct,
        type: 'equal',
        is_paid: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }

  async addSecondaryParticipant(eventId: string, primaryParticipantId: string, name: string): Promise<string> {
    const db = this._db();
    const secondaryId = generateId();
    const now = new Date().toISOString();

    // Verificar duplicado de nombre en el evento
    const epList = await db.getAllFromIndex('event_participants', 'event_id', eventId) as any[];
    for (const ep of epList) {
      const p = await db.get('participants', ep.participant_id) as any;
      if (p && p.name.toLowerCase() === name.toLowerCase()) {
        throw new Error(`Ya existe un participante llamado "${name}" en este evento`);
      }
    }

    await db.put('participants', {
      id: secondaryId, name, email: null, phone: null, alias_cbu: null,
      avatar: null, is_active: 1, participant_type: 'temporary',
      user_id: null, created_by_user_id: null, is_public: 0,
      times_used: 0, last_used_at: null, created_at: now, updated_at: now,
    });

    await db.put('event_participants', {
      id: `ep_${secondaryId}`,
      event_id: eventId,
      participant_id: secondaryId,
      role: 'member',
      balance: 0,
      joined_at: now,
      parent_participant_id: primaryParticipantId,
    });

    await this.addParticipantToAllExpenses(eventId, secondaryId);
    return secondaryId;
  }

  async removeSecondaryParticipant(eventId: string, secondaryParticipantId: string): Promise<void> {
    await this.removeParticipantFromEvent(eventId, secondaryParticipantId);
  }

  // ─── Expenses ──────────────────────────────────────────────────────────────

  async createExpense(expense: Expense): Promise<void> {
    await this._saveExpense(expense);
    await this.recalculateSettlementsForEvent(expense.eventId);
  }

  async createExpenseWithoutRecalculation(expense: Expense): Promise<void> {
    await this._saveExpense(expense);
  }

  private async _saveExpense(expense: Expense): Promise<void> {
    const db = this._db();
    await db.put('expenses', {
      id: expense.id,
      event_id: expense.eventId,
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency,
      date: expense.date,
      category: expense.category || null,
      payer_id: expense.payerId,
      receipt_image: expense.receiptImage || null,
      is_active: expense.isActive !== false ? 1 : 0,
      created_at: expense.createdAt || new Date().toISOString(),
      updated_at: expense.updatedAt || new Date().toISOString(),
    });
    if (expense.payers && expense.payers.length > 0) {
      const now = new Date().toISOString();
      for (const payer of expense.payers) {
        await db.put('expense_payers', {
          id: `ep_${expense.id}_${payer.participantId}`,
          expense_id: expense.id,
          participant_id: payer.participantId,
          amount: payer.amount,
          created_at: now,
          updated_at: now,
        });
      }
    }
  }

  async getExpenses(): Promise<Expense[]> {
    const db = this._db();
    const rows = await db.getAll('expenses') as any[];
    const active = rows.filter(r => r.is_active === 1);
    return this._hydrateExpenses(active);
  }

  async getExpensesByEvent(eventId: string): Promise<Expense[]> {
    const db = this._db();
    const rows = await db.getAllFromIndex('expenses', 'event_id', eventId) as any[];
    const active = rows.filter(r => r.is_active === 1);
    return this._hydrateExpenses(active);
  }

  private async _hydrateExpenses(rows: any[]): Promise<Expense[]> {
    const db = this._db();
    const result: Expense[] = [];
    for (const row of rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())) {
      const payerRows = await db.getAllFromIndex('expense_payers', 'expense_id', row.id) as any[];
      const payers = await Promise.all(payerRows.map(async (ep: any) => {
        const p = await db.get('participants', ep.participant_id) as any;
        return { participantId: ep.participant_id, participantName: p?.name || '', amount: ep.amount };
      }));
      result.push({
        id: row.id,
        eventId: row.event_id,
        description: row.description,
        amount: row.amount,
        currency: row.currency,
        date: row.date,
        category: row.category,
        payerId: row.payer_id,
        receiptImage: row.receipt_image,
        isActive: row.is_active === 1,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        payers: payers.length > 0 ? payers : undefined,
      });
    }
    return result;
  }

  async updateExpense(expenseId: string, expense: Partial<Expense>, splits?: Split[]): Promise<void> {
    const db = this._db();
    const row = await db.get('expenses', expenseId) as any;
    if (!row) return;
    if (expense.description !== undefined) row.description = expense.description;
    if (expense.amount !== undefined) row.amount = expense.amount;
    if (expense.date !== undefined) row.date = expense.date;
    if (expense.category !== undefined) row.category = expense.category;
    if (expense.payerId !== undefined) row.payer_id = expense.payerId;
    if (expense.currency !== undefined) row.currency = expense.currency;
    if (expense.receiptImage !== undefined) row.receipt_image = expense.receiptImage;
    row.updated_at = new Date().toISOString();
    row.sync_status = 'pending';
    await db.put('expenses', row);

    if (splits && splits.length > 0) {
      const existing = await db.getAllFromIndex('splits', 'expense_id', expenseId) as any[];
      for (const s of existing) await db.delete('splits', s.id);
      for (const s of splits) await this.createSplit(s);
    }

    if (expense.payers !== undefined) {
      const existing = await db.getAllFromIndex('expense_payers', 'expense_id', expenseId) as any[];
      for (const p of existing) await db.delete('expense_payers', p.id);
      const now = new Date().toISOString();
      for (const payer of expense.payers) {
        await db.put('expense_payers', {
          id: `ep_${expenseId}_${payer.participantId}`,
          expense_id: expenseId,
          participant_id: payer.participantId,
          amount: payer.amount,
          created_at: now,
          updated_at: now,
        });
      }
    }

    await this.recalculateSettlementsForEvent(row.event_id);
  }

  async deleteExpense(expenseId: string): Promise<void> {
    const db = this._db();
    const row = await db.get('expenses', expenseId) as any;
    if (!row) return;
    const splits = await db.getAllFromIndex('splits', 'expense_id', expenseId) as any[];
    for (const s of splits) { await db.delete('splits', s.id); await this._recordDeletion('splits', s.id); }
    await db.delete('expenses', expenseId);
    await this._recordDeletion('expenses', expenseId);
    await this.recalculateSettlementsForEvent(row.event_id);
  }

  // ─── Splits ─────────────────────────────────────────────────────────────────

  async createSplit(split: Split): Promise<void> {
    const db = this._db();
    await db.put('splits', {
      id: split.id,
      expense_id: split.expenseId,
      participant_id: split.participantId,
      amount: split.amount,
      percentage: split.percentage || null,
      type: split.type || 'equal',
      is_paid: split.isPaid ? 1 : 0,
      created_at: split.createdAt || new Date().toISOString(),
      updated_at: split.updatedAt || new Date().toISOString(),
    });
  }

  async getSplits(): Promise<Split[]> {
    const db = this._db();
    const rows = await db.getAll('splits') as any[];
    return rows.map(this._mapSplit);
  }

  async getSplitsByExpense(expenseId: string): Promise<Split[]> {
    const db = this._db();
    const rows = await db.getAllFromIndex('splits', 'expense_id', expenseId) as any[];
    return rows.map(this._mapSplit);
  }

  async getSplitsByEvent(eventId: string): Promise<Split[]> {
    const db = this._db();
    const expenses = await db.getAllFromIndex('expenses', 'event_id', eventId) as any[];
    const result: Split[] = [];
    for (const ex of expenses.filter((e: any) => e.is_active === 1)) {
      const splits = await db.getAllFromIndex('splits', 'expense_id', ex.id) as any[];
      result.push(...splits.map(this._mapSplit));
    }
    return result;
  }

  private _mapSplit(row: any): Split {
    return {
      id: row.id,
      expenseId: row.expense_id,
      participantId: row.participant_id,
      amount: row.amount,
      percentage: row.percentage,
      type: row.type,
      isPaid: row.is_paid === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // ─── Settlements ───────────────────────────────────────────────────────────

  async createSettlement(settlement: any): Promise<void> {
    const db = this._db();
    let eventStatus = settlement.eventStatus;
    if (!eventStatus) {
      const ev = await this.getEventById(settlement.eventId);
      eventStatus = ev?.status || 'active';
    }
    await db.put('settlements', {
      id: settlement.id,
      event_id: settlement.eventId,
      from_participant_id: settlement.fromParticipantId,
      from_participant_name: settlement.fromParticipantName,
      to_participant_id: settlement.toParticipantId,
      to_participant_name: settlement.toParticipantName,
      amount: settlement.amount,
      is_paid: settlement.isPaid ? 1 : 0,
      paid_at: settlement.paidAt || null,
      event_status: eventStatus,
      receipt_image: settlement.receiptImage || null,
      notes: settlement.notes || null,
      created_at: settlement.createdAt || new Date().toISOString(),
      updated_at: settlement.updatedAt || new Date().toISOString(),
    });
  }

  async getSettlementsByEvent(eventId: string): Promise<any[]> {
    const db = this._db();
    const rows = await db.getAllFromIndex('settlements', 'event_id', eventId) as any[];
    return rows
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map(this._mapSettlement);
  }

  async getConsolidationAssignments(eventId: string): Promise<any[]> {
    const db = this._db();
    const rows = await db.getAllFromIndex('consolidation_assignments', 'event_id', eventId) as any[];
    return rows.map(r => ({
      payerId: r.payer_id,
      payerName: r.payer_name,
      debtorId: r.debtor_id,
      debtorName: r.debtor_name,
      eventId: r.event_id,
    }));
  }

  async saveConsolidationAssignments(eventId: string, assignments: any[]): Promise<void> {
    const db = this._db();
    const existing = await db.getAllFromIndex('consolidation_assignments', 'event_id', eventId) as any[];
    for (const r of existing) await db.delete('consolidation_assignments', r.id);
    const now = new Date().toISOString();
    for (const a of assignments) {
      await db.add('consolidation_assignments', {
        event_id: eventId,
        payer_id: a.payerId,
        payer_name: a.payerName,
        debtor_id: a.debtorId,
        debtor_name: a.debtorName,
        created_at: now,
        updated_at: now,
      });
    }
  }

  async clearConsolidationAssignments(eventId: string): Promise<void> {
    const db = this._db();
    const existing = await db.getAllFromIndex('consolidation_assignments', 'event_id', eventId) as any[];
    for (const r of existing) await db.delete('consolidation_assignments', r.id);
  }

  async getSettlementById(settlementId: string): Promise<any | null> {
    const db = this._db();
    const row = await db.get('settlements', settlementId) as any;
    return row ? this._mapSettlement(row) : null;
  }

  async updateSettlement(settlementId: string, updates: any): Promise<void> {
    const db = this._db();
    const row = await db.get('settlements', settlementId) as any;
    if (!row) return;
    if (updates.amount !== undefined) row.amount = updates.amount;
    if (updates.eventStatus !== undefined) row.event_status = updates.eventStatus;
    if (updates.isPaid !== undefined) row.is_paid = updates.isPaid ? 1 : 0;
    if (updates.paidAt !== undefined) row.paid_at = updates.paidAt;
    if (updates.receiptImage !== undefined) row.receipt_image = updates.receiptImage;
    if (updates.notes !== undefined) row.notes = updates.notes;
    if (updates.fromParticipantName !== undefined) row.from_participant_name = updates.fromParticipantName;
    if (updates.toParticipantName !== undefined) row.to_participant_name = updates.toParticipantName;
    row.updated_at = new Date().toISOString();
    await db.put('settlements', row);
  }

  async deleteSettlement(settlementId: string): Promise<void> {
    const db = this._db();
    await db.delete('settlements', settlementId);
    await this._recordDeletion('settlements', settlementId);
  }

  async deleteSettlementsByEvent(eventId: string): Promise<void> {
    const db = this._db();
    const rows = await db.getAllFromIndex('settlements', 'event_id', eventId) as any[];
    for (const r of rows) { await db.delete('settlements', r.id); await this._recordDeletion('settlements', r.id); }
  }

  async updateSettlementsEventStatus(eventId: string, newEventStatus: string): Promise<void> {
    const db = this._db();
    const rows = await db.getAllFromIndex('settlements', 'event_id', eventId) as any[];
    const now = new Date().toISOString();
    for (const r of rows) {
      r.event_status = newEventStatus;
      r.updated_at = now;
      await db.put('settlements', r);
    }
  }

  async resetSettlementsPayments(eventId: string): Promise<void> {
    const db = this._db();
    const rows = await db.getAllFromIndex('settlements', 'event_id', eventId) as any[];
    const now = new Date().toISOString();
    for (const r of rows) {
      r.is_paid = 0;
      r.paid_at = null;
      r.receipt_image = null;
      r.notes = null;
      r.event_status = 'active';
      r.updated_at = now;
      await db.put('settlements', r);
    }
  }

  async updateSettlementParticipantNames(participantId: string, newName: string): Promise<void> {
    const db = this._db();
    const all = await db.getAll('settlements') as any[];
    const now = new Date().toISOString();
    for (const s of all) {
      let changed = false;
      if (s.from_participant_id === participantId) { s.from_participant_name = newName; changed = true; }
      if (s.to_participant_id === participantId) { s.to_participant_name = newName; changed = true; }
      if (changed) { s.updated_at = now; await db.put('settlements', s); }
    }
  }

  private _mapSettlement(row: any): any {
    return {
      id: row.id,
      eventId: row.event_id,
      fromParticipantId: row.from_participant_id,
      fromParticipantName: row.from_participant_name,
      toParticipantId: row.to_participant_id,
      toParticipantName: row.to_participant_name,
      amount: row.amount,
      isPaid: row.is_paid === 1,
      paidAt: row.paid_at,
      eventStatus: row.event_status || 'active',
      receiptImage: row.receipt_image,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // ─── Lógica de recálculo (misma que SQLite, sin SQL) ──────────────────────

  async recalculateSettlementsForEvent(eventId: string): Promise<void> {
    const db = this._db();
    const expenses = await this.getExpensesByEvent(eventId);
    const splits = await this.getSplitsByEvent(eventId);
    const participants = await this.getEventParticipants(eventId);

    // Eliminar no pagadas
    const existing = await db.getAllFromIndex('settlements', 'event_id', eventId) as any[];
    for (const s of existing.filter((s: any) => s.is_paid === 0)) {
      await db.delete('settlements', s.id);
      await this._recordDeletion('settlements', s.id);
    }

    if (expenses.length === 0) return;

    const balances = this._calculateBalances(expenses, splits, participants);

    // Consolidar secundarios en primarios
    const secondaryMap: Record<string, string> = {};
    participants.forEach((p: any) => { if (p.parentParticipantId) secondaryMap[p.id] = p.parentParticipantId; });
    const consolidated = balances.filter((b: any) => !secondaryMap[b.participantId]);
    balances.forEach((b: any) => {
      const pid = secondaryMap[b.participantId];
      if (pid) {
        const prim = consolidated.find((c: any) => c.participantId === pid);
        if (prim) { prim.totalPaid += b.totalPaid; prim.totalOwed += b.totalOwed; prim.balance += b.balance; }
      }
    });

    const newSettlements = this._calculateOptimalSettlements(consolidated);
    const now = new Date().toISOString();
    for (const s of newSettlements) {
      if (s.amount > 0.01) {
        const id = generateId();
        await this.createSettlement({
          id, eventId,
          fromParticipantId: s.fromParticipantId,
          fromParticipantName: s.fromParticipantName,
          toParticipantId: s.toParticipantId,
          toParticipantName: s.toParticipantName,
          amount: s.amount,
          isPaid: false,
          paidAt: null,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }

  private _calculateBalances(expenses: any[], splits: any[], participants: any[]): any[] {
    const balances: Record<string, any> = {};
    participants.forEach(p => {
      balances[p.id] = { participantId: p.id, participantName: p.name, totalPaid: 0, totalOwed: 0, balance: 0 };
    });
    expenses.forEach(ex => {
      if (ex.payers && ex.payers.length > 0) {
        ex.payers.forEach((pa: any) => { if (balances[pa.participantId]) balances[pa.participantId].totalPaid += pa.amount; });
      } else {
        if (balances[ex.payerId]) balances[ex.payerId].totalPaid += ex.amount;
      }
    });
    splits.forEach(s => { if (balances[s.participantId]) balances[s.participantId].totalOwed += s.amount; });
    Object.values(balances).forEach((b: any) => { b.balance = b.totalOwed - b.totalPaid; });
    return Object.values(balances);
  }

  private _calculateOptimalSettlements(balances: any[]): any[] {
    const debtors = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);
    const creditors = balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance);
    const results: any[] = [];
    let di = 0, ci = 0;
    while (di < debtors.length && ci < creditors.length) {
      const d = debtors[di], c = creditors[ci];
      const amount = Math.min(d.balance, Math.abs(c.balance));
      if (amount > 0.01) {
        results.push({
          fromParticipantId: d.participantId, fromParticipantName: d.participantName,
          toParticipantId: c.participantId, toParticipantName: c.participantName,
          amount: Math.round(amount * 100) / 100,
        });
      }
      d.balance -= amount;
      c.balance += amount;
      if (d.balance <= 0.01) di++;
      if (c.balance >= -0.01) ci++;
    }
    return results;
  }

  // ─── Legacy: Payments / Transactions ──────────────────────────────────────

  async createPayment(payment: Payment): Promise<void> {
    await this.createSettlement({
      id: payment.id, eventId: payment.eventId,
      fromParticipantId: payment.fromParticipantId, fromParticipantName: 'Manual Payment',
      toParticipantId: payment.toParticipantId, toParticipantName: 'Manual Payment',
      amount: payment.amount, isPaid: payment.isConfirmed,
      paidAt: payment.isConfirmed ? payment.date : null,
      receiptImage: payment.receiptImage, notes: payment.notes,
      createdAt: payment.createdAt, updatedAt: payment.updatedAt,
    });
  }

  async createTransaction(transaction: any): Promise<void> {
    await this.createSettlement({
      id: transaction.id, eventId: transaction.eventId,
      fromParticipantId: transaction.fromParticipantId, fromParticipantName: transaction.fromParticipantName,
      toParticipantId: transaction.toParticipantId, toParticipantName: transaction.toParticipantName,
      amount: transaction.amount, isPaid: transaction.status === 'confirmed',
      paidAt: transaction.confirmedAt,
      receiptImage: transaction.receiptImage, notes: transaction.notes,
      createdAt: transaction.createdAt, updatedAt: transaction.updatedAt,
    });
  }

  async getPaymentsByEvent(eventId: string): Promise<Payment[]> {
    const rows = await this.getSettlementsByEvent(eventId);
    return rows.filter((s: any) => s.isPaid).map((s: any) => ({
      id: s.id, eventId: s.eventId,
      fromParticipantId: s.fromParticipantId, toParticipantId: s.toParticipantId,
      amount: s.amount, date: s.paidAt || s.updatedAt,
      notes: s.notes || '', receiptImage: s.receiptImage,
      isConfirmed: true, createdAt: s.createdAt, updatedAt: s.updatedAt,
    }));
  }

  async getTransactionsByEvent(eventId: string, type?: string): Promise<any[]> {
    if (type === 'manual') return [];
    const rows = await this.getSettlementsByEvent(eventId);
    return (type === 'payment' ? rows.filter((s: any) => s.isPaid) : rows).map((s: any) => ({
      ...s, type: type || 'calculated',
      status: s.isPaid ? 'confirmed' : 'pending',
      date: s.paidAt || s.createdAt,
    }));
  }

  async updatePayment(paymentId: string, updates: Partial<Payment>): Promise<void> {
    const mapped: any = {};
    if (updates.notes !== undefined) mapped.notes = updates.notes;
    if (updates.receiptImage !== undefined) mapped.receiptImage = updates.receiptImage;
    if (updates.isConfirmed !== undefined) {
      mapped.isPaid = updates.isConfirmed;
      mapped.paidAt = updates.isConfirmed ? new Date().toISOString() : null;
    }
    await this.updateSettlement(paymentId, mapped);
  }

  async updateTransaction(transactionId: string, updates: any): Promise<void> {
    const mapped: any = {};
    if (updates.amount !== undefined) mapped.amount = updates.amount;
    if (updates.status !== undefined) {
      mapped.isPaid = updates.status === 'confirmed';
      mapped.paidAt = updates.status === 'confirmed' ? (updates.confirmedAt || new Date().toISOString()) : null;
    }
    if (updates.notes !== undefined) mapped.notes = updates.notes;
    if (updates.receiptImage !== undefined) mapped.receiptImage = updates.receiptImage;
    if (updates.fromParticipantName !== undefined) mapped.fromParticipantName = updates.fromParticipantName;
    if (updates.toParticipantName !== undefined) mapped.toParticipantName = updates.toParticipantName;
    await this.updateSettlement(transactionId, mapped);
  }

  // ─── Users ─────────────────────────────────────────────────────────────────

  async createUser(user: {
    id: string; username: string; email: string; password: string; name: string;
    phone?: string; alias_cbu?: string; skipPassword?: boolean; autoLogin?: boolean;
  }): Promise<void> {
    const db = this._db();
    const now = new Date().toISOString();
    await db.put('users', {
      id: user.id, username: user.username, email: user.email,
      password: user.password, name: user.name,
      phone: user.phone || null, alias_cbu: user.alias_cbu || null,
      avatar: null, preferred_currency: 'ARS', auto_logout: 'never',
      skip_password: user.skipPassword ? 1 : 0, auto_login: user.autoLogin ? 1 : 0,
      chat_mode_advanced: 0, biometric_enabled: 0,
      notifications_expense_added: 1, notifications_payment_received: 0,
      notifications_event_updated: 0, notifications_weekly_report: 0,
      privacy_share_email: 0, privacy_share_phone: 0,
      privacy_allow_invitations: 1, privacy_share_event: 1,
      last_login: null, created_at: now, updated_at: now,
    });
  }

  async getUserProfile(userId: string): Promise<any | null> {
    const db = this._db();
    return (await db.get('users', userId)) || null;
  }

  async getUserById(userId: string): Promise<any | null> {
    return this.getUserProfile(userId);
  }

  async getUserByCredential(credential: string): Promise<any | null> {
    const db = this._db();
    const all = await db.getAll('users') as any[];
    const lower = credential.toLowerCase();
    return all.find(u => u.username?.toLowerCase() === lower || u.email?.toLowerCase() === lower) || null;
  }

  async getAllUsersWithLoginInfo(): Promise<any[]> {
    const db = this._db();
    const all = await db.getAll('users') as any[];
    return all.map(u => ({ id: u.id, username: u.username, skip_password: u.skip_password, auto_login: u.auto_login, last_login: u.last_login, biometric_enabled: u.biometric_enabled ?? 0 }));
  }

  async updateUserProfile(userId: string, updates: any): Promise<void> {
    const db = this._db();
    const row = await db.get('users', userId) as any;
    if (!row) return;
    if (updates.name !== undefined) row.name = updates.name;
    if (updates.email !== undefined) row.email = updates.email;
    if (updates.phone !== undefined) row.phone = updates.phone;
    if (updates.alias_cbu !== undefined) row.alias_cbu = updates.alias_cbu;
    if (updates.preferred_currency !== undefined) row.preferred_currency = updates.preferred_currency;
    if (updates.skipPassword !== undefined) row.skip_password = updates.skipPassword ? 1 : 0;
    if (updates.autoLogin !== undefined) row.auto_login = updates.autoLogin ? 1 : 0;
    if (updates.chatModeAdvanced !== undefined) row.chat_mode_advanced = updates.chatModeAdvanced ? 1 : 0;
    if (updates.biometricEnabled !== undefined) row.biometric_enabled = updates.biometricEnabled ? 1 : 0;
    if (updates.avatar !== undefined) row.avatar = updates.avatar || null;
    if (updates.auto_logout !== undefined) row.auto_logout = updates.auto_logout;
    if (updates.username !== undefined) row.username = updates.username;
    row.updated_at = new Date().toISOString();
    await db.put('users', row);
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    const db = this._db();
    const row = await db.get('users', userId) as any;
    if (!row) return;
    row.password = newPassword;
    row.updated_at = new Date().toISOString();
    await db.put('users', row);
  }

  async verifyUserPassword(userId: string, password: string): Promise<boolean> {
    const row = await this.getUserProfile(userId) as any;
    return row?.password === password;
  }

  async toggleAutoLogin(userId: string, autoLogin: boolean): Promise<void> {
    await this.updateUserProfile(userId, { autoLogin });
  }

  async updateLastLogin(userId: string): Promise<void> {
    const db = this._db();
    const row = await db.get('users', userId) as any;
    if (!row) return;
    const now = new Date().toISOString();
    row.last_login = now;
    row.updated_at = now;
    await db.put('users', row);
  }

  async forceUpdateDemoUser(userId: string): Promise<void> {
    await this.updateUserProfile(userId, { skipPassword: true });
  }

  async updateUserNotifications(userId: string, notifications: any): Promise<void> {
    const db = this._db();
    const row = await db.get('users', userId) as any;
    if (!row) return;
    if (notifications.expenseAdded !== undefined) row.notifications_expense_added = notifications.expenseAdded ? 1 : 0;
    if (notifications.paymentReceived !== undefined) row.notifications_payment_received = notifications.paymentReceived ? 1 : 0;
    if (notifications.eventUpdated !== undefined) row.notifications_event_updated = notifications.eventUpdated ? 1 : 0;
    if (notifications.weeklyReport !== undefined) row.notifications_weekly_report = notifications.weeklyReport ? 1 : 0;
    row.updated_at = new Date().toISOString();
    await db.put('users', row);
  }

  async updateUserPrivacy(userId: string, privacy: any): Promise<void> {
    const db = this._db();
    const row = await db.get('users', userId) as any;
    if (!row) return;
    if (privacy.shareEmail !== undefined) row.privacy_share_email = privacy.shareEmail ? 1 : 0;
    if (privacy.sharePhone !== undefined) row.privacy_share_phone = privacy.sharePhone ? 1 : 0;
    if (privacy.allowInvitations !== undefined) row.privacy_allow_invitations = privacy.allowInvitations ? 1 : 0;
    row.updated_at = new Date().toISOString();
    await db.put('users', row);
  }

  // ─── User Preferences ──────────────────────────────────────────────────────

  async getUserPreference(userId: string, key: string): Promise<string | null> {
    const db = this._db();
    const all = await db.getAllFromIndex('user_preferences', 'user_key', [userId, key]) as any[];
    return all.length > 0 ? all[0].value : null;
  }

  async setUserPreference(userId: string, key: string, value: string): Promise<void> {
    const db = this._db();
    await db.put('user_preferences', {
      id: `pref_${userId}_${key}`,
      user_id: userId, key, value,
      updated_at: new Date().toISOString(),
    });
  }

  // ─── Migrations ────────────────────────────────────────────────────────────

  async migrateTransactionsToSettlements(): Promise<void> {
    // IndexedDB no tiene tabla transactions legacy — no requiere migración
    console.log('ℹ️ No transaction migration needed for IndexedDB');
  }

  // ─── Utility ───────────────────────────────────────────────────────────────

  async clearAllData(includeVersions = false): Promise<void> {
    const db = this._db();
    const stores: StoreNames[] = [
      'events', 'participants', 'event_participants', 'expenses',
      'expense_payers', 'splits', 'settlements', 'users', 'user_preferences',
      'consolidation_assignments',
    ];
    if (includeVersions) stores.push('app_versions');
    for (const store of stores) await db.clear(store);
  }

  async resetDatabase(): Promise<void> {
    await this.clearAllData(true);
    await this._createDemoUserIfNotExists();
  }

  async nukeDatabase(): Promise<void> {
    if (this.db) { this.db.close(); this.db = null; }
    this.isInitialized = false;
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    await this.init();
  }

  async exportData(): Promise<string> {
    const db = this._db();
    const [events, participants, expenses, settlements, splits, users] = await Promise.all([
      this.getEvents(), this.getParticipants(), this.getExpenses(),
      db.getAll('settlements'), this.getSplits(),
      db.getAll('users').then((us: any[]) => us.map(u => { const { password, ...rest } = u; return rest; })),
    ]);
    const ep = await db.getAll('event_participants');
    return JSON.stringify({
      version: '2.0', exportDate: new Date().toISOString(), appVersion: '1.9.0',
      data: { users, events, participants, expenses, settlements, event_participants: ep, splits },
      statistics: { totalEvents: events.length, totalParticipants: participants.length, totalExpenses: expenses.length },
    }, null, 2);
  }

  async getDatabaseStats(): Promise<{ tables: { [k: string]: number }; totalRecords: number; databaseSize: string }> {
    const db = this._db();
    const stores: StoreNames[] = [
      'events', 'participants', 'event_participants', 'expenses',
      'expense_payers', 'splits', 'settlements', 'users',
      'user_preferences', 'app_versions', 'consolidation_assignments',
    ];
    const tables: { [k: string]: number } = {};
    let totalRecords = 0;
    for (const store of stores) {
      const count = await db.count(store);
      tables[store] = count;
      totalRecords += count;
    }
    return { tables, totalRecords, databaseSize: '< 1 MB (IndexedDB)' };
  }

  async diagnoseTables(): Promise<void> {
    const stats = await this.getDatabaseStats();
    console.log('🔍 IndexedDB stats:', stats);
  }

  // ─── Helpers privados ──────────────────────────────────────────────────────

  private async _createDemoUserIfNotExists(): Promise<void> {
    const existing = await this.getUserByCredential('demo');
    if (!existing) {
      await this.createUser({
        id: 'demo-user', name: 'Demo', username: 'Demo',
        email: 'demo@splitsmart.com', password: 'demo123456', skipPassword: true,
      });
      console.log('✅ IndexedDB: Demo user created');
    } else if (existing.skip_password !== 1) {
      await this.updateUserProfile(existing.id, { skipPassword: true });
      console.log('✅ IndexedDB: Demo user skip_password updated to 1');
    }
  }

  private _parseJSON(value: any): any[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try { return JSON.parse(value); } catch { return []; }
  }
}
