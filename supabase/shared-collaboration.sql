-- =====================================================================
-- SplitSmart — Colaboración en eventos compartidos (Opción A)
-- =====================================================================
-- Ejecutar DESPUÉS de schema.sql y rls.sql.
--
-- OBJETIVO:
--   Permitir que un usuario que recibe un evento compartido con rol
--   'editor' (QR de edición) pueda AGREGAR y MODIFICAR gastos/splits/
--   liquidaciones directamente en el evento del dueño en la nube, y que
--   el dueño los vea al sincronizar. El rol 'viewer' (QR de solo lectura)
--   NO puede escribir.
--
-- CLAVE DE SEGURIDAD:
--   - Se registra al colaborador en public.event_collaborators (una fila
--     por (event_id, user_id)) SOLO si posee un share_id válido (el token
--     secreto del QR) cuyo snapshot corresponde a ese evento y cuyo rol
--     coincide. Esto prueba la posesión del QR sin exponer nada.
--   - Un 'viewer' jamás puede insertarse como 'editor' porque el rol de la
--     fila debe coincidir con el rol del share.
--
-- IDEMPOTENTE: se puede ejecutar varias veces sin romper nada.
-- =====================================================================

-- ─── TABLA: event_collaborators ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_collaborators (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL,  -- = auth.uid() del colaborador
  role       TEXT NOT NULL DEFAULT 'viewer'
             CHECK (role IN ('editor', 'viewer')),
  share_id   UUID REFERENCES public.shared_events(share_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_collaborators_user  ON public.event_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_event_collaborators_event ON public.event_collaborators(event_id);

ALTER TABLE public.event_collaborators ENABLE ROW LEVEL SECURITY;

-- ─── HELPER: ¿el usuario colabora (editor o viewer) en el evento? ────────────
-- SECURITY DEFINER para bypassear RLS internamente y evitar recursión.
CREATE OR REPLACE FUNCTION public.user_collaborates_on_event(event_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.event_collaborators ec
    WHERE ec.event_id = event_uuid
      AND ec.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

-- ─── HELPER: ¿el usuario puede EDITAR el evento? ─────────────────────────────
-- Creador O participante vinculado (user_id) O colaborador con rol 'editor'.
CREATE OR REPLACE FUNCTION public.user_can_edit_event(event_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_uuid
      AND (
        e.creator_id = auth.uid()
        OR public.user_participates_in_event(event_uuid)
      )
  )
  OR EXISTS (
    SELECT 1 FROM public.event_collaborators ec
    WHERE ec.event_id = event_uuid
      AND ec.user_id = auth.uid()
      AND ec.role = 'editor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

-- ─── ACTUALIZAR HELPER DE LECTURA: incluir colaboradores ─────────────────────
-- user_can_access_event ahora también es TRUE para cualquier colaborador
-- (editor o viewer) para que puedan LEER el evento y sus registros.
CREATE OR REPLACE FUNCTION public.user_can_access_event(event_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_uuid
      AND (
        e.creator_id = auth.uid()
        OR public.user_participates_in_event(event_uuid)
      )
  )
  OR public.user_collaborates_on_event(event_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.user_collaborates_on_event(UUID) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.user_can_edit_event(UUID)        FROM anon, authenticated;

-- ─── RLS: event_collaborators ────────────────────────────────────────────────
-- SELECT: el propio colaborador o el creador del evento.
DROP POLICY IF EXISTS "event_collaborators_select" ON public.event_collaborators;
CREATE POLICY "event_collaborators_select"
  ON public.event_collaborators FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_collaborators.event_id
        AND e.creator_id = auth.uid()
    )
  );

-- INSERT: el usuario se agrega a SÍ MISMO y debe poseer un share válido
-- (share_id secreto) cuyo snapshot apunta a este evento y cuyo rol coincide.
-- Un viewer NO puede insertarse como editor (el rol debe coincidir con el share).
DROP POLICY IF EXISTS "event_collaborators_insert" ON public.event_collaborators;
CREATE POLICY "event_collaborators_insert"
  ON public.event_collaborators FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.shared_events s
      WHERE s.share_id = event_collaborators.share_id
        AND s.role = event_collaborators.role
        AND (s.event_snapshot -> 'e' ->> 'id')::uuid = event_collaborators.event_id
        AND (s.expires_at IS NULL OR s.expires_at > NOW())
    )
  );

-- UPDATE: SOLO el creador del evento (evita que un viewer se auto-promueva a editor).
DROP POLICY IF EXISTS "event_collaborators_update" ON public.event_collaborators;
CREATE POLICY "event_collaborators_update"
  ON public.event_collaborators FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_collaborators.event_id
        AND e.creator_id = auth.uid()
    )
  );

-- DELETE: el propio colaborador (dejar de colaborar) o el creador (revocar).
DROP POLICY IF EXISTS "event_collaborators_delete" ON public.event_collaborators;
CREATE POLICY "event_collaborators_delete"
  ON public.event_collaborators FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_collaborators.event_id
        AND e.creator_id = auth.uid()
    )
  );

-- ─── EVENTS: permitir SELECT a colaboradores ─────────────────────────────────
DROP POLICY IF EXISTS "events_select" ON public.events;
CREATE POLICY "events_select"
  ON public.events FOR SELECT
  USING (
    auth.uid() = creator_id
    OR public.user_participates_in_event(id)
    OR public.user_collaborates_on_event(id)
  );

-- =====================================================================
-- REEMPLAZAR POLÍTICAS DE ESCRITURA: user_can_access_event → user_can_edit_event
-- =====================================================================
-- Las lecturas (SELECT) siguen usando user_can_access_event (incluye viewers).
-- Las escrituras (INSERT/UPDATE/DELETE) ahora usan user_can_edit_event
-- (creador O participante O colaborador editor). Los viewers quedan excluidos.
-- Esto NO restringe a usuarios existentes (creador/participante siguen incluidos).

-- ─── EXPENSES ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "expenses_insert" ON public.expenses;
CREATE POLICY "expenses_insert"
  ON public.expenses FOR INSERT
  WITH CHECK (public.user_can_edit_event(event_id));

DROP POLICY IF EXISTS "expenses_update" ON public.expenses;
CREATE POLICY "expenses_update"
  ON public.expenses FOR UPDATE
  USING (public.user_can_edit_event(event_id))
  WITH CHECK (public.user_can_edit_event(event_id));

DROP POLICY IF EXISTS "expenses_delete" ON public.expenses;
CREATE POLICY "expenses_delete"
  ON public.expenses FOR DELETE
  USING (public.user_can_edit_event(event_id));

-- ─── EXPENSE_PAYERS ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "expense_payers_insert" ON public.expense_payers;
CREATE POLICY "expense_payers_insert"
  ON public.expense_payers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expenses ex
      WHERE ex.id = expense_payers.expense_id
        AND public.user_can_edit_event(ex.event_id)
    )
  );

DROP POLICY IF EXISTS "expense_payers_update" ON public.expense_payers;
CREATE POLICY "expense_payers_update"
  ON public.expense_payers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses ex
      WHERE ex.id = expense_payers.expense_id
        AND public.user_can_edit_event(ex.event_id)
    )
  );

DROP POLICY IF EXISTS "expense_payers_delete" ON public.expense_payers;
CREATE POLICY "expense_payers_delete"
  ON public.expense_payers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses ex
      WHERE ex.id = expense_payers.expense_id
        AND public.user_can_edit_event(ex.event_id)
    )
  );

-- ─── SPLITS ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "splits_insert" ON public.splits;
CREATE POLICY "splits_insert"
  ON public.splits FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expenses ex
      WHERE ex.id = splits.expense_id
        AND public.user_can_edit_event(ex.event_id)
    )
  );

DROP POLICY IF EXISTS "splits_update" ON public.splits;
CREATE POLICY "splits_update"
  ON public.splits FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses ex
      WHERE ex.id = splits.expense_id
        AND public.user_can_edit_event(ex.event_id)
    )
  );

DROP POLICY IF EXISTS "splits_delete" ON public.splits;
CREATE POLICY "splits_delete"
  ON public.splits FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses ex
      WHERE ex.id = splits.expense_id
        AND public.user_can_edit_event(ex.event_id)
    )
  );

-- ─── SETTLEMENTS ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "settlements_insert" ON public.settlements;
CREATE POLICY "settlements_insert"
  ON public.settlements FOR INSERT
  WITH CHECK (public.user_can_edit_event(event_id));

DROP POLICY IF EXISTS "settlements_update" ON public.settlements;
CREATE POLICY "settlements_update"
  ON public.settlements FOR UPDATE
  USING (public.user_can_edit_event(event_id))
  WITH CHECK (public.user_can_edit_event(event_id));

DROP POLICY IF EXISTS "settlements_delete" ON public.settlements;
CREATE POLICY "settlements_delete"
  ON public.settlements FOR DELETE
  USING (public.user_can_edit_event(event_id));

-- ─── CONSOLIDATION_ASSIGNMENTS ───────────────────────────────────────────────
DROP POLICY IF EXISTS "consolidations_insert" ON public.consolidation_assignments;
CREATE POLICY "consolidations_insert"
  ON public.consolidation_assignments FOR INSERT
  WITH CHECK (public.user_can_edit_event(event_id));

DROP POLICY IF EXISTS "consolidations_update" ON public.consolidation_assignments;
CREATE POLICY "consolidations_update"
  ON public.consolidation_assignments FOR UPDATE
  USING (public.user_can_edit_event(event_id));

DROP POLICY IF EXISTS "consolidations_delete" ON public.consolidation_assignments;
CREATE POLICY "consolidations_delete"
  ON public.consolidation_assignments FOR DELETE
  USING (public.user_can_edit_event(event_id));

-- ─── ACTIVITIES ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "activities_insert" ON public.activities;
CREATE POLICY "activities_insert"
  ON public.activities FOR INSERT
  WITH CHECK (public.user_can_edit_event(event_id));

DROP POLICY IF EXISTS "activities_update" ON public.activities;
CREATE POLICY "activities_update"
  ON public.activities FOR UPDATE
  USING (public.user_can_edit_event(event_id))
  WITH CHECK (public.user_can_edit_event(event_id));

DROP POLICY IF EXISTS "activities_delete" ON public.activities;
CREATE POLICY "activities_delete"
  ON public.activities FOR DELETE
  USING (public.user_can_edit_event(event_id));

-- ─── ACTIVITY_PARTICIPANTS ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "activity_participants_insert" ON public.activity_participants;
CREATE POLICY "activity_participants_insert"
  ON public.activity_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.id = activity_participants.activity_id
        AND public.user_can_edit_event(a.event_id)
    )
  );

DROP POLICY IF EXISTS "activity_participants_update" ON public.activity_participants;
CREATE POLICY "activity_participants_update"
  ON public.activity_participants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.id = activity_participants.activity_id
        AND public.user_can_edit_event(a.event_id)
    )
  );

DROP POLICY IF EXISTS "activity_participants_delete" ON public.activity_participants;
CREATE POLICY "activity_participants_delete"
  ON public.activity_participants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.id = activity_participants.activity_id
        AND public.user_can_edit_event(a.event_id)
    )
  );

-- ─── EVENT_PARTICIPANTS: permitir a editores gestionar membresías ────────────
-- El colaborador editor necesita agregar/actualizar participantes del evento
-- para poder crear gastos que los referencien.
DROP POLICY IF EXISTS "event_participants_write" ON public.event_participants;
CREATE POLICY "event_participants_write"
  ON public.event_participants FOR INSERT
  WITH CHECK (public.user_can_edit_event(event_id));

DROP POLICY IF EXISTS "event_participants_update" ON public.event_participants;
CREATE POLICY "event_participants_update"
  ON public.event_participants FOR UPDATE
  USING (public.user_can_edit_event(event_id));

DROP POLICY IF EXISTS "event_participants_delete" ON public.event_participants;
CREATE POLICY "event_participants_delete"
  ON public.event_participants FOR DELETE
  USING (public.user_can_edit_event(event_id));

-- =====================================================================
-- FIN — Colaboración en eventos compartidos
-- =====================================================================
