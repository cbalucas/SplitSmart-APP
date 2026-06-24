-- =====================================================================
-- SplitSmart — Row Level Security (RLS) Policies
-- =====================================================================
-- Ejecutar DESPUÉS de schema.sql.
--
-- PRINCIPIO: un usuario solo puede ver y modificar datos que le pertenecen
-- o en los que participa. La API nunca expone datos de otros usuarios.
--
-- Para depuración en desarrollo, se puede deshabilitar RLS temporalmente:
--   ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
-- =====================================================================

-- ─── HABILITAR RLS EN TODAS LAS TABLAS ───────────────────────────────────────
ALTER TABLE public.users                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_payers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.splits                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consolidation_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_versions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_invitations        ENABLE ROW LEVEL SECURITY;

-- ─── USERS ────────────────────────────────────────────────────────────────────
-- Cada usuario solo accede a su propio perfil.
CREATE POLICY "users_select_own"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_insert_own"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- No se permite DELETE de usuarios desde el cliente (solo service_role).

-- ─── USER_PREFERENCES ────────────────────────────────────────────────────────
CREATE POLICY "user_pref_all_own"
  ON public.user_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── APP_VERSIONS ─────────────────────────────────────────────────────────────
-- Solo lectura pública; escritura exclusiva para service_role (admins).
CREATE POLICY "app_versions_read_all"
  ON public.app_versions FOR SELECT
  USING (TRUE);

-- ─── HELPER: ¿el usuario actual participa en este evento? ────────────────────
-- Se usa como sub-query en varias policies para evitar duplicación.
-- Nota: no puede ser una function SQL usada en policy directamente en Supabase
-- (limitación), por eso se repite el sub-query inline.

-- ─── EVENTS ───────────────────────────────────────────────────────────────────
-- Un usuario puede ver/modificar un evento si:
--   a) es el creador, o
--   b) tiene un participante vinculado (user_id) en event_participants de ese evento.
CREATE POLICY "events_creator_or_participant_select"
  ON public.events FOR SELECT
  USING (
    auth.uid() = creator_id
    OR EXISTS (
      SELECT 1
      FROM public.event_participants ep
      JOIN public.participants p ON ep.participant_id = p.id
      WHERE ep.event_id = events.id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "events_creator_insert"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "events_creator_update"
  ON public.events FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "events_creator_delete"
  ON public.events FOR DELETE
  USING (auth.uid() = creator_id);

-- ─── PARTICIPANTS ─────────────────────────────────────────────────────────────
-- SELECT: propio, públicos, propios de creación, o que comparten un evento.
CREATE POLICY "participants_select"
  ON public.participants FOR SELECT
  USING (
    user_id = auth.uid()
    OR created_by_user_id = auth.uid()
    OR is_public = TRUE
    OR created_by_user_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.event_participants ep1
      JOIN public.event_participants ep2 ON ep1.event_id = ep2.event_id
      JOIN public.participants p2 ON ep2.participant_id = p2.id
      WHERE ep1.participant_id = participants.id
        AND p2.user_id = auth.uid()
    )
  );

CREATE POLICY "participants_insert"
  ON public.participants FOR INSERT
  WITH CHECK (
    created_by_user_id = auth.uid()
    OR created_by_user_id IS NULL
  );

CREATE POLICY "participants_update_own"
  ON public.participants FOR UPDATE
  USING (created_by_user_id = auth.uid());

CREATE POLICY "participants_delete_own"
  ON public.participants FOR DELETE
  USING (created_by_user_id = auth.uid());

-- ─── EVENT_PARTICIPANTS ───────────────────────────────────────────────────────
-- Acceso si el usuario tiene relación con el evento (creador o participante).
CREATE POLICY "event_participants_access"
  ON public.event_participants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_participants.event_id
        AND (
          e.creator_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.event_participants ep
            JOIN public.participants p ON ep.participant_id = p.id
            WHERE ep.event_id = e.id AND p.user_id = auth.uid()
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_participants.event_id
        AND e.creator_id = auth.uid()
    )
  );

-- ─── EXPENSES ────────────────────────────────────────────────────────────────
CREATE POLICY "expenses_event_access"
  ON public.expenses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = expenses.event_id
        AND (
          e.creator_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.event_participants ep
            JOIN public.participants p ON ep.participant_id = p.id
            WHERE ep.event_id = e.id AND p.user_id = auth.uid()
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = expenses.event_id
        AND (
          e.creator_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.event_participants ep
            JOIN public.participants p ON ep.participant_id = p.id
            WHERE ep.event_id = e.id AND p.user_id = auth.uid()
          )
        )
    )
  );

-- ─── EXPENSE_PAYERS ───────────────────────────────────────────────────────────
CREATE POLICY "expense_payers_access"
  ON public.expense_payers FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.expenses ex
      JOIN public.events e ON ex.event_id = e.id
      WHERE ex.id = expense_payers.expense_id
        AND (
          e.creator_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.event_participants ep
            JOIN public.participants p ON ep.participant_id = p.id
            WHERE ep.event_id = e.id AND p.user_id = auth.uid()
          )
        )
    )
  );

-- ─── SPLITS ───────────────────────────────────────────────────────────────────
CREATE POLICY "splits_event_access"
  ON public.splits FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.expenses ex
      JOIN public.events e ON ex.event_id = e.id
      WHERE ex.id = splits.expense_id
        AND (
          e.creator_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.event_participants ep
            JOIN public.participants p ON ep.participant_id = p.id
            WHERE ep.event_id = e.id AND p.user_id = auth.uid()
          )
        )
    )
  );

-- ─── SETTLEMENTS ─────────────────────────────────────────────────────────────
CREATE POLICY "settlements_event_access"
  ON public.settlements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = settlements.event_id
        AND (
          e.creator_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.event_participants ep
            JOIN public.participants p ON ep.participant_id = p.id
            WHERE ep.event_id = e.id AND p.user_id = auth.uid()
          )
        )
    )
  );

-- ─── CONSOLIDATION_ASSIGNMENTS ────────────────────────────────────────────────
CREATE POLICY "consolidations_event_access"
  ON public.consolidation_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = consolidation_assignments.event_id
        AND (
          e.creator_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.event_participants ep
            JOIN public.participants p ON ep.participant_id = p.id
            WHERE ep.event_id = e.id AND p.user_id = auth.uid()
          )
        )
    )
  );

-- ─── PUSH_TOKENS ──────────────────────────────────────────────────────
-- Solo el propio usuario puede gestionar sus tokens.
CREATE POLICY "push_tokens_own"
  ON public.push_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── NOTIFICATIONS ──────────────────────────────────────────────────
-- Solo el destinatario puede ver y marcar sus notificaciones.
-- La inserción la hace el service_role (backend / Edge Function).
CREATE POLICY "notifications_recipient_select"
  ON public.notifications FOR SELECT
  USING (auth.uid() = recipient_id);

CREATE POLICY "notifications_recipient_update"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = recipient_id);

-- ─── EVENT_INVITATIONS ─────────────────────────────────────────────
-- El invitante puede ver y crear invitaciones de sus eventos.
-- El invitado puede ver y actualizar (aceptar/rechazar) sus propias invitaciones.
CREATE POLICY "invitations_inviter_select"
  ON public.event_invitations FOR SELECT
  USING (
    auth.uid() = inviter_id
    OR auth.uid() = invitee_user_id
  );

CREATE POLICY "invitations_inviter_insert"
  ON public.event_invitations FOR INSERT
  WITH CHECK (
    auth.uid() = inviter_id
    AND EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_invitations.event_id
        AND e.creator_id = auth.uid()
    )
  );

CREATE POLICY "invitations_invitee_update"
  ON public.event_invitations FOR UPDATE
  USING (auth.uid() = invitee_user_id);

CREATE POLICY "invitations_inviter_delete"
  ON public.event_invitations FOR DELETE
  USING (auth.uid() = inviter_id);
