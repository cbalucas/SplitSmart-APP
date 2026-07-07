-- ═══════════════════════════════════════════════════════════════════════════
-- FIX: recursión infinita en la política RLS de public.participants
-- ═══════════════════════════════════════════════════════════════════════════
-- Síntoma: al hacer push/pull de participants desde la web/app aparecía
--   "infinite recursion detected in policy for relation participants" (HTTP 500).
--
-- Causa: la política participants_select contenía un EXISTS que hacía
--   JOIN public.participants p2 ... → acceder a p2 volvía a evaluar
--   participants_select → recursión infinita.
--
-- Solución: mover esa lógica a una función SECURITY DEFINER que bypassea RLS.
--
-- CÓMO APLICAR: pega TODO este archivo en el SQL Editor de Supabase y ejecútalo.
-- Es idempotente (usa CREATE OR REPLACE / DROP POLICY IF EXISTS).
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Helper SECURITY DEFINER (bypassea RLS → sin recursión)
CREATE OR REPLACE FUNCTION public.user_shares_event_with_participant(participant_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.event_participants ep1
    JOIN public.event_participants ep2 ON ep1.event_id = ep2.event_id
    JOIN public.participants p2 ON ep2.participant_id = p2.id
    WHERE ep1.participant_id = participant_uuid
      AND p2.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

-- Solo uso interno de las políticas RLS (no exponer como RPC)
REVOKE EXECUTE ON FUNCTION public.user_shares_event_with_participant(UUID) FROM anon, authenticated;

-- 2. Recrear la política sin el self-join recursivo
DROP POLICY IF EXISTS "participants_select" ON public.participants;

CREATE POLICY "participants_select"
  ON public.participants FOR SELECT
  USING (
    user_id = auth.uid()
    OR created_by_user_id = auth.uid()
    OR is_public = TRUE
    OR public.user_shares_event_with_participant(id)
  );
