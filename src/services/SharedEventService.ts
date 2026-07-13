/**
 * SharedEventService.ts
 *
 * Gestiona el compartir eventos via QR usando Supabase como intermediario.
 *
 * Flujo:
 *  Dueño (online): createShare() → sube snapshot al cloud → obtiene share_id
 *  QR contiene: splitsmart://join?share=<uuid>
 *  Receptor: fetchShare(share_id) → obtiene snapshot → importa localmente
 *
 * Requiere: usuario autenticado en Supabase para crear shares.
 * Leer (fetchShare): permitido a cualquiera (anon key o autenticado).
 */

import { supabase } from './supabase';

/** Snapshot compacto del evento que se almacena en Supabase. */
export interface SharedEventSnapshot {
  v: number;                                       // versión del formato (1)
  role: 'editor' | 'viewer';                      // permiso otorgado al receptor
  e: {                                             // datos del evento
    id: string; n: string; d: string;
    s: string; l: string; c: string; cat: string;
  };
  p: Array<{ id: string; n: string }>;             // participantes
  ex: Array<{                                      // gastos
    id: string; d: string; a: number; dt: string;
    c: string; cat: string; pid: string; pn: string;
  }>;
  sp: Array<{                                      // splits
    id: string; eid: string; pid: string; a: number; t: string;
  }>;
}

export interface SharedEventRecord {
  shareId: string;
  ownerId: string;
  ownerName: string;
  snapshot: SharedEventSnapshot;
  role: 'editor' | 'viewer';
  shortCode: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Resultado de crear un share: incluye el UUID (para el QR) y el código corto legible. */
export interface CreateShareResult {
  shareId: string;
  shortCode: string;
}

// Alfabeto sin caracteres ambiguos (sin 0/O, 1/I/L) para códigos fáciles de dictar.
const SHORT_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const SHORT_CODE_LENGTH = 8;

/** Genera un código corto legible en mayúsculas (ej: "A7K2M9QP"). */
function generateShortCode(): string {
  let code = '';
  for (let i = 0; i < SHORT_CODE_LENGTH; i++) {
    code += SHORT_CODE_ALPHABET.charAt(Math.floor(Math.random() * SHORT_CODE_ALPHABET.length));
  }
  return code;
}

/** Normaliza un código ingresado por el usuario (mayúsculas, sin espacios/guiones). */
export function normalizeShortCode(raw: string): string {
  return (raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Mapea una fila de shared_events al modelo de la app. */
function mapShareRow(row: any): SharedEventRecord {
  return {
    shareId: row.share_id,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    snapshot: row.event_snapshot as SharedEventSnapshot,
    role: row.role as 'editor' | 'viewer',
    shortCode: row.short_code ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SharedEventService = {
  /**
   * Sube el snapshot del evento a Supabase y retorna el share_id generado.
   * El dueño debe estar autenticado en Supabase (isOnlineUser = true).
   */
  async createShare(
    snapshot: SharedEventSnapshot,
    ownerSupabaseId: string,
    ownerName: string,
  ): Promise<CreateShareResult> {
    // Reintentar ante colisión (poco probable) del código corto único.
    let lastError: any = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const shortCode = generateShortCode();
      const { data, error } = await supabase
        .from('shared_events')
        .insert({
          owner_id: ownerSupabaseId,
          owner_name: ownerName,
          event_snapshot: snapshot,
          role: snapshot.role,
          short_code: shortCode,
        })
        .select('share_id, short_code')
        .single();

      if (!error) {
        return {
          shareId: (data as any).share_id as string,
          shortCode: (data as any).short_code as string,
        };
      }

      // 23505 = unique_violation en Postgres → reintentar con otro código.
      if ((error as any).code === '23505') {
        lastError = error;
        continue;
      }
      throw new Error(error.message);
    }
    throw new Error(lastError?.message || 'No se pudo generar un código único.');
  },

  /**
   * Actualiza el snapshot de un share existente (el dueño actualizó el evento).
   * Solo el propietario puede llamar esta función (RLS lo garantiza).
   */
  async refreshShare(shareId: string, snapshot: SharedEventSnapshot): Promise<void> {
    const { error } = await supabase
      .from('shared_events')
      .update({ event_snapshot: snapshot, role: snapshot.role })
      .eq('share_id', shareId);

    if (error) throw new Error(error.message);
  },

  /**
   * Obtiene un share por su ID. Disponible para cualquier usuario (RLS: SELECT = TRUE).
   * Si el share_id no existe o fue eliminado, lanza un error.
   */
  async fetchShare(shareId: string): Promise<SharedEventRecord> {
    const { data, error } = await supabase
      .from('shared_events')
      .select('share_id, owner_id, owner_name, event_snapshot, role, short_code, created_at, updated_at')
      .eq('share_id', shareId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('QR_NOT_FOUND');
      }
      throw new Error(error.message);
    }

    return mapShareRow(data);
  },

  /**
   * Obtiene un share por su código corto legible (ingreso manual sin escanear QR).
   * Si el código no existe o expiró, lanza 'QR_NOT_FOUND'.
   */
  async fetchShareByCode(rawCode: string): Promise<SharedEventRecord> {
    const code = normalizeShortCode(rawCode);
    if (!code) throw new Error('QR_NOT_FOUND');
    const { data, error } = await supabase
      .from('shared_events')
      .select('share_id, owner_id, owner_name, event_snapshot, role, short_code, created_at, updated_at')
      .eq('short_code', code)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('QR_NOT_FOUND');

    return mapShareRow(data);
  },

  /**
   * Obtiene todos los shares creados por el usuario autenticado.
   * Útil para mostrar "Eventos que compartí".
   */
  async getMyShares(ownerSupabaseId: string): Promise<SharedEventRecord[]> {
    const { data, error } = await supabase
      .from('shared_events')
      .select('share_id, owner_id, owner_name, event_snapshot, role, short_code, created_at, updated_at')
      .eq('owner_id', ownerSupabaseId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return ((data as any[]) ?? []).map(mapShareRow);
  },

  /**
   * Elimina un share (el dueño revoca el acceso).
   * Solo el propietario puede eliminar (RLS).
   */
  async deleteShare(shareId: string): Promise<void> {
    const { error } = await supabase
      .from('shared_events')
      .delete()
      .eq('share_id', shareId);

    if (error) throw new Error(error.message);
  },

  /** Construye la URL profunda a partir de un share_id. */
  buildShareUrl(shareId: string): string {
    return `splitsmart://join?share=${shareId}`;
  },

  /**
   * Registra al usuario autenticado como colaborador del evento compartido.
   * Requiere poseer un share válido (share_id) cuyo snapshot corresponde al
   * eventId y cuyo rol coincide (lo valida la política RLS de INSERT).
   * Idempotente: si ya está registrado, no falla (ignoreDuplicates).
   * Solo tiene efecto online; en error se ignora para no bloquear el import.
   */
  async registerCollaborator(
    eventId: string,
    userId: string,
    role: 'editor' | 'viewer',
    shareId: string,
  ): Promise<void> {
    const { error } = await supabase
      .from('event_collaborators')
      .upsert(
        { event_id: eventId, user_id: userId, role, share_id: shareId },
        { onConflict: 'event_id,user_id', ignoreDuplicates: true },
      );
    if (error) throw new Error(error.message);
  },
};

export default SharedEventService;
