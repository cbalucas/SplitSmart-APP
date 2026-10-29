-- =====================================================================
-- SplitSmart — Fusionar "amigos propios" duplicados (v1.10.6)
-- =====================================================================
-- Contexto: antes de la 1.10.6, iniciar sesión en un 2.º dispositivo creaba otro
-- participante propio (mismo user_id, id aleatorio). Este script deja UNO por usuario
-- (el más usado y, a igualdad, el más antiguo), reasigna todas sus referencias y borra el resto.
--
-- Ejecutar en: Supabase Dashboard → SQL Editor.
--   PASO 1: ejecutar solo la consulta de vista previa y revisar el resultado.
--   PASO 2: ejecutar el bloque DO (transacción implícita: si algo falla, no se aplica nada).
--
-- Tras ejecutarlo, abrir la app en cada dispositivo con conexión y hacer una sync manual.
-- =====================================================================

-- ─── PASO 1: vista previa (no modifica nada) ─────────────────────────────────────────────
WITH self_p AS (
  SELECT p.id, p.user_id, p.created_at,
         (SELECT COUNT(*) FROM public.event_participants ep WHERE ep.participant_id = p.id) AS usos
  FROM public.participants p
  WHERE p.user_id IS NOT NULL
    AND p.created_by_user_id = p.user_id
    AND p.participant_type = 'friend'
),
ranked AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY usos DESC, created_at ASC, id) AS rn,
            COUNT(*)     OVER (PARTITION BY user_id) AS total
  FROM self_p
)
SELECT user_id, id AS participant_id, usos, created_at,
       CASE WHEN rn = 1 THEN 'CONSERVAR' ELSE 'FUSIONAR y borrar' END AS accion
FROM ranked
WHERE total > 1
ORDER BY user_id, rn;

-- ─── PASO 2: fusión ──────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  r RECORD;
  merged INT := 0;
BEGIN
  FOR r IN
    WITH self_p AS (
      SELECT p.id, p.user_id, p.created_at,
             (SELECT COUNT(*) FROM public.event_participants ep WHERE ep.participant_id = p.id) AS usos
      FROM public.participants p
      WHERE p.user_id IS NOT NULL
        AND p.created_by_user_id = p.user_id
        AND p.participant_type = 'friend'
    ),
    ranked AS (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY usos DESC, created_at ASC, id) AS rn,
                COUNT(*)     OVER (PARTITION BY user_id) AS total
      FROM self_p
    )
    SELECT d.id AS dup_id, k.id AS keep_id
    FROM ranked d
    JOIN ranked k ON k.user_id = d.user_id AND k.rn = 1
    WHERE d.total > 1 AND d.rn > 1
  LOOP
    -- Tablas con UNIQUE sobre (padre, participante): quitar la fila del duplicado si el
    -- conservado ya la tiene, y luego reasignar el resto.
    DELETE FROM public.event_participants d
    WHERE d.participant_id = r.dup_id
      AND EXISTS (SELECT 1 FROM public.event_participants k
                  WHERE k.event_id = d.event_id AND k.participant_id = r.keep_id);
    UPDATE public.event_participants SET participant_id = r.keep_id WHERE participant_id = r.dup_id;
    UPDATE public.event_participants SET parent_participant_id = r.keep_id WHERE parent_participant_id = r.dup_id;

    DELETE FROM public.activity_participants d
    WHERE d.participant_id = r.dup_id
      AND EXISTS (SELECT 1 FROM public.activity_participants k
                  WHERE k.activity_id = d.activity_id AND k.participant_id = r.keep_id);
    UPDATE public.activity_participants SET participant_id = r.keep_id WHERE participant_id = r.dup_id;

    -- Sin UNIQUE: reasignación directa.
    UPDATE public.expenses                  SET payer_id            = r.keep_id WHERE payer_id            = r.dup_id;
    UPDATE public.expense_payers            SET participant_id      = r.keep_id WHERE participant_id      = r.dup_id;
    UPDATE public.splits                    SET participant_id      = r.keep_id WHERE participant_id      = r.dup_id;
    UPDATE public.settlements               SET from_participant_id = r.keep_id WHERE from_participant_id = r.dup_id;
    UPDATE public.settlements               SET to_participant_id   = r.keep_id WHERE to_participant_id   = r.dup_id;
    UPDATE public.consolidation_assignments SET payer_id            = r.keep_id WHERE payer_id            = r.dup_id;
    UPDATE public.consolidation_assignments SET debtor_id           = r.keep_id WHERE debtor_id           = r.dup_id;

    DELETE FROM public.participants WHERE id = r.dup_id;
    merged := merged + 1;
  END LOOP;

  RAISE NOTICE 'Participantes propios duplicados fusionados: %', merged;
END $$;
