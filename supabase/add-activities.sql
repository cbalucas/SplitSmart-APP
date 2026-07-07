-- =====================================================================
-- SplitSmart — Migración: Organización (actividades)
-- =====================================================================
-- Idempotente. Segura de correr sobre cualquier estado de la BD.
-- Agrega las tablas `activities` y `activity_participants` para la tab
-- "Organización" del evento, con sus índices, triggers y políticas RLS.
--
-- Nota: `activity_templates` es local-only (por usuario) en v1 y NO se
-- sincroniza a Supabase, por lo que no se define aquí.
-- =====================================================================

-- ─── ACTIVITIES ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activities (
  id                 UUID PRIMARY KEY,
  event_id           UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title              TEXT NOT NULL,
  description        TEXT,
  position           INTEGER NOT NULL DEFAULT 0,
  created_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  sync_status        TEXT NOT NULL DEFAULT 'synced'
                     CHECK (sync_status IN ('pending', 'synced', 'conflict'))
);

-- Idempotente: agrega la columna si la tabla ya existía sin ella
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS description TEXT;

CREATE INDEX IF NOT EXISTS idx_activities_event_id    ON public.activities(event_id);
CREATE INDEX IF NOT EXISTS idx_activities_sync_status ON public.activities(sync_status);

CREATE OR REPLACE TRIGGER trg_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── ACTIVITY_PARTICIPANTS (join actividad ↔ participante) ───────────────────
CREATE TABLE IF NOT EXISTS public.activity_participants (
  id             UUID PRIMARY KEY,
  activity_id    UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  sync_status    TEXT NOT NULL DEFAULT 'synced'
                 CHECK (sync_status IN ('pending', 'synced', 'conflict')),
  UNIQUE (activity_id, participant_id)
);

CREATE INDEX IF NOT EXISTS idx_activity_participants_activity_id    ON public.activity_participants(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_participants_participant_id ON public.activity_participants(participant_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.activities            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_participants ENABLE ROW LEVEL SECURITY;

-- activities: acceso vía el evento
DROP POLICY IF EXISTS "activities_select" ON public.activities;
CREATE POLICY "activities_select"
  ON public.activities FOR SELECT
  USING (public.user_can_access_event(event_id));

DROP POLICY IF EXISTS "activities_insert" ON public.activities;
CREATE POLICY "activities_insert"
  ON public.activities FOR INSERT
  WITH CHECK (public.user_can_access_event(event_id));

DROP POLICY IF EXISTS "activities_update" ON public.activities;
CREATE POLICY "activities_update"
  ON public.activities FOR UPDATE
  USING (public.user_can_access_event(event_id))
  WITH CHECK (public.user_can_access_event(event_id));

DROP POLICY IF EXISTS "activities_delete" ON public.activities;
CREATE POLICY "activities_delete"
  ON public.activities FOR DELETE
  USING (public.user_can_access_event(event_id));

-- activity_participants: acceso vía el evento de la actividad
DROP POLICY IF EXISTS "activity_participants_select" ON public.activity_participants;
CREATE POLICY "activity_participants_select"
  ON public.activity_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.id = activity_participants.activity_id
        AND public.user_can_access_event(a.event_id)
    )
  );

DROP POLICY IF EXISTS "activity_participants_insert" ON public.activity_participants;
CREATE POLICY "activity_participants_insert"
  ON public.activity_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.id = activity_participants.activity_id
        AND public.user_can_access_event(a.event_id)
    )
  );

DROP POLICY IF EXISTS "activity_participants_update" ON public.activity_participants;
CREATE POLICY "activity_participants_update"
  ON public.activity_participants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.id = activity_participants.activity_id
        AND public.user_can_access_event(a.event_id)
    )
  );

DROP POLICY IF EXISTS "activity_participants_delete" ON public.activity_participants;
CREATE POLICY "activity_participants_delete"
  ON public.activity_participants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.id = activity_participants.activity_id
        AND public.user_can_access_event(a.event_id)
    )
  );
