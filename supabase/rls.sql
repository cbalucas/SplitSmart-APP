-- =====================================================================
-- SplitSmart — Row Level Security (RLS) Policies v2
-- =====================================================================
-- Ejecutar DESPUÉS de schema.sql.
--
-- PRINCIPIOS:
--   1. Un usuario solo accede a sus propios datos o a datos de eventos
--      en los que participa (como creador o como participante vinculado).
--   2. Las funciones helper (user_participates_in_event, user_can_access_event)
--      centralizan la lógica de acceso para evitar sub-queries repetidas.
--   3. shared_events: cualquier usuario puede leer por share_id (UUID = token).
--   4. Escrituras sensibles (notifications) solo via service_role.
--
-- Para debug en desarrollo:
--   ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
-- =====================================================================

-- ─── HABILITAR RLS EN TODAS LAS TABLAS ───────────────────────────────────────
ALTER TABLE public.users                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_payers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.splits                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consolidation_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_versions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_invitations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_events             ENABLE ROW LEVEL SECURITY;

-- ─── REVOCAR ACCESO RPC DIRECTO A HELPER FUNCTIONS ───────────────────────────
-- Estas funciones son solo para uso interno de las políticas RLS.
-- No deben ser llamables via /rest/v1/rpc por anon ni authenticated.
REVOKE EXECUTE ON FUNCTION public.user_participates_in_event(UUID) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.user_can_access_event(UUID) FROM anon, authenticated;

-- ─── USERS ────────────────────────────────────────────────────────────────────
-- Cada usuario solo puede ver y editar su propio perfil.
-- DELETE no permitido desde el cliente (solo service_role).
CREATE POLICY "users_select_own"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_insert_own"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ─── USER_PREFERENCES ────────────────────────────────────────────────────────
CREATE POLICY "user_pref_all_own"
  ON public.user_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── APP_VERSIONS ─────────────────────────────────────────────────────────────
-- Lectura pública; escritura exclusiva para service_role (deploys/admin).
CREATE POLICY "app_versions_read_all"
  ON public.app_versions FOR SELECT
  USING (TRUE);

-- ─── EVENTS ───────────────────────────────────────────────────────────────────
-- SELECT: creador del evento O participante vinculado (user_id en participants).
-- INSERT/UPDATE/DELETE: solo el creador.
-- Usa la función helper para evitar sub-query repetida.
CREATE POLICY "events_select"
  ON public.events FOR SELECT
  USING (
    auth.uid() = creator_id
    OR public.user_participates_in_event(id)
  );

CREATE POLICY "events_insert"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "events_update"
  ON public.events FOR UPDATE
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "events_delete"
  ON public.events FOR DELETE
  USING (auth.uid() = creator_id);

-- ─── PARTICIPANTS ─────────────────────────────────────────────────────────────
-- SELECT: participante propio (user_id), creado por el usuario (created_by_user_id),
--         marcado como público (is_public), o que comparte un evento con el usuario.
-- NOTA: Se eliminó el OR created_by_user_id IS NULL que exponía todos los
--       participantes temporales (importados por QR) a cualquier usuario.
-- INSERT: solo si created_by_user_id = auth.uid() (el usuario crea su propio participante).
-- UPDATE/DELETE: solo si el usuario los creó.
CREATE POLICY "participants_select"
  ON public.participants FOR SELECT
  USING (
    user_id = auth.uid()
    OR created_by_user_id = auth.uid()
    OR is_public = TRUE
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
  );

CREATE POLICY "participants_update_own"
  ON public.participants FOR UPDATE
  USING (created_by_user_id = auth.uid())
  WITH CHECK (created_by_user_id = auth.uid());

CREATE POLICY "participants_delete_own"
  ON public.participants FOR DELETE
  USING (created_by_user_id = auth.uid());

-- ─── EVENT_PARTICIPANTS ───────────────────────────────────────────────────────
-- SELECT: cualquier participante que tenga acceso al evento.
-- INSERT/UPDATE/DELETE: solo el creador del evento puede gestionar membresías.
CREATE POLICY "event_participants_select"
  ON public.event_participants FOR SELECT
  USING (public.user_can_access_event(event_id));

CREATE POLICY "event_participants_write"
  ON public.event_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_participants.event_id
        AND e.creator_id = auth.uid()
    )
  );

CREATE POLICY "event_participants_update"
  ON public.event_participants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_participants.event_id
        AND e.creator_id = auth.uid()
    )
  );

CREATE POLICY "event_participants_delete"
  ON public.event_participants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_participants.event_id
        AND e.creator_id = auth.uid()
    )
  );

-- ─── EXPENSES ────────────────────────────────────────────────────────────────
-- Acceso completo si el usuario puede acceder al evento.
-- WITH CHECK explícito para INSERT: garantiza que el evento destino es accesible.
CREATE POLICY "expenses_select"
  ON public.expenses FOR SELECT
  USING (public.user_can_access_event(event_id));

CREATE POLICY "expenses_insert"
  ON public.expenses FOR INSERT
  WITH CHECK (public.user_can_access_event(event_id));

CREATE POLICY "expenses_update"
  ON public.expenses FOR UPDATE
  USING (public.user_can_access_event(event_id))
  WITH CHECK (public.user_can_access_event(event_id));

CREATE POLICY "expenses_delete"
  ON public.expenses FOR DELETE
  USING (public.user_can_access_event(event_id));

-- ─── EXPENSE_PAYERS ───────────────────────────────────────────────────────────
-- Acceso vía evento del gasto (2 saltos: expense_payers → expenses → events).
-- WITH CHECK explícito para INSERT.
CREATE POLICY "expense_payers_select"
  ON public.expense_payers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses ex
      WHERE ex.id = expense_payers.expense_id
        AND public.user_can_access_event(ex.event_id)
    )
  );

CREATE POLICY "expense_payers_insert"
  ON public.expense_payers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expenses ex
      WHERE ex.id = expense_payers.expense_id
        AND public.user_can_access_event(ex.event_id)
    )
  );

CREATE POLICY "expense_payers_update"
  ON public.expense_payers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses ex
      WHERE ex.id = expense_payers.expense_id
        AND public.user_can_access_event(ex.event_id)
    )
  );

CREATE POLICY "expense_payers_delete"
  ON public.expense_payers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses ex
      WHERE ex.id = expense_payers.expense_id
        AND public.user_can_access_event(ex.event_id)
    )
  );

-- ─── SPLITS ───────────────────────────────────────────────────────────────────
CREATE POLICY "splits_select"
  ON public.splits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses ex
      WHERE ex.id = splits.expense_id
        AND public.user_can_access_event(ex.event_id)
    )
  );

CREATE POLICY "splits_insert"
  ON public.splits FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expenses ex
      WHERE ex.id = splits.expense_id
        AND public.user_can_access_event(ex.event_id)
    )
  );

CREATE POLICY "splits_update"
  ON public.splits FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses ex
      WHERE ex.id = splits.expense_id
        AND public.user_can_access_event(ex.event_id)
    )
  );

CREATE POLICY "splits_delete"
  ON public.splits FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses ex
      WHERE ex.id = splits.expense_id
        AND public.user_can_access_event(ex.event_id)
    )
  );

-- ─── SETTLEMENTS ─────────────────────────────────────────────────────────────
CREATE POLICY "settlements_select"
  ON public.settlements FOR SELECT
  USING (public.user_can_access_event(event_id));

CREATE POLICY "settlements_insert"
  ON public.settlements FOR INSERT
  WITH CHECK (public.user_can_access_event(event_id));

CREATE POLICY "settlements_update"
  ON public.settlements FOR UPDATE
  USING (public.user_can_access_event(event_id))
  WITH CHECK (public.user_can_access_event(event_id));

CREATE POLICY "settlements_delete"
  ON public.settlements FOR DELETE
  USING (public.user_can_access_event(event_id));

-- ─── CONSOLIDATION_ASSIGNMENTS ────────────────────────────────────────────────
CREATE POLICY "consolidations_select"
  ON public.consolidation_assignments FOR SELECT
  USING (public.user_can_access_event(event_id));

CREATE POLICY "consolidations_insert"
  ON public.consolidation_assignments FOR INSERT
  WITH CHECK (public.user_can_access_event(event_id));

CREATE POLICY "consolidations_update"
  ON public.consolidation_assignments FOR UPDATE
  USING (public.user_can_access_event(event_id));

CREATE POLICY "consolidations_delete"
  ON public.consolidation_assignments FOR DELETE
  USING (public.user_can_access_event(event_id));

-- ─── PUSH_TOKENS ──────────────────────────────────────────────────────────────
CREATE POLICY "push_tokens_own"
  ON public.push_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
-- SELECT y UPDATE (marcar como leída): solo el destinatario.
-- INSERT: solo service_role (Edge Functions, no el cliente).
-- DELETE: no permitido (auditoría).
CREATE POLICY "notifications_select"
  ON public.notifications FOR SELECT
  USING (auth.uid() = recipient_id);

CREATE POLICY "notifications_update"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- ─── EVENT_INVITATIONS ─────────────────────────────────────────────────────────
-- SELECT: quien invitó O quien fue invitado.
-- INSERT: solo si el invitante es el creador del evento.
-- UPDATE: solo el invitado puede responder (aceptar/rechazar).
-- DELETE: solo quien invitó puede revocar.
CREATE POLICY "invitations_select"
  ON public.event_invitations FOR SELECT
  USING (
    auth.uid() = inviter_id
    OR auth.uid() = invitee_user_id
  );

CREATE POLICY "invitations_insert"
  ON public.event_invitations FOR INSERT
  WITH CHECK (
    auth.uid() = inviter_id
    AND EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_invitations.event_id
        AND e.creator_id = auth.uid()
    )
  );

CREATE POLICY "invitations_update"
  ON public.event_invitations FOR UPDATE
  USING (auth.uid() = invitee_user_id)
  WITH CHECK (auth.uid() = invitee_user_id);

CREATE POLICY "invitations_delete"
  ON public.event_invitations FOR DELETE
  USING (auth.uid() = inviter_id);

-- ─── SHARED_EVENTS ─────────────────────────────────────────────────────────────
-- SELECT: CUALQUIER usuario (autenticado o anónimo via anon key).
--   El share_id UUID actúa como token secreto. Quien lo conoce, puede leer.
--   TRADEOFF: un QR viejo podría ser accedido indefinidamente.
--   Mitigación: expires_at + Edge Function de limpieza periódica.
-- INSERT/UPDATE/DELETE: solo el propietario (owner_id = auth.uid()).
CREATE POLICY "shared_events_read"
  ON public.shared_events FOR SELECT
  USING (
    expires_at IS NULL OR expires_at > NOW()
  );

CREATE POLICY "shared_events_insert"
  ON public.shared_events FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "shared_events_update"
  ON public.shared_events FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "shared_events_delete"
  ON public.shared_events FOR DELETE
  USING (auth.uid() = owner_id);
