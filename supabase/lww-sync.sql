-- =====================================================================
-- SplitSmart — Last-Write-Wins (LWW) por updated_at
-- =====================================================================
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- Ejecutar DESPUÉS de schema.sql (redefine public.set_updated_at()).
--
-- PROBLEMA QUE RESUELVE
--   El push del cliente hace `upsert(..., onConflict:'id')` incondicional:
--   sobrescribe la fila en Supabase con la copia local, SIN comparar fechas.
--   Además, el trigger set_updated_at() ponía updated_at = NOW() en cada UPDATE,
--   por lo que la nube reflejaba "cuándo se sincronizó", no "cuándo se editó".
--   Resultado: la web (con una copia vieja en IndexedDB) pisaba en la nube los
--   cambios más recientes hechos desde la app. Ganaba "quien sincroniza último".
--
-- SOLUCIÓN (LWW real por updated_at del cliente)
--   Se redefine set_updated_at() para que, en cada UPDATE:
--     1. Preserve el updated_at que envía el cliente (refleja la edición real).
--     2. Si el registro entrante es MÁS VIEJO que el existente → RETURN OLD,
--        es decir, conserva la fila de la nube sin cambios (rechaza el pisado).
--     3. Si el cliente no envía updated_at → se usa NOW() (comportamiento previo).
--
--   Como todos los triggers trg_*_updated_at ya usan esta función, con solo
--   redefinirla el LWW aplica a: users, events, participants, expenses,
--   expense_payers, splits, settlements, shared_events, activities, y cualquier
--   otra tabla que use este trigger.
--
-- Este script es IDEMPOTENTE.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- INSERT: si el cliente no provee updated_at, usar NOW().
  IF TG_OP = 'INSERT' THEN
    IF NEW.updated_at IS NULL THEN
      NEW.updated_at := NOW();
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE sin updated_at del cliente → comportamiento clásico (marca de servidor).
  IF NEW.updated_at IS NULL THEN
    NEW.updated_at := NOW();
    RETURN NEW;
  END IF;

  -- LWW: si el registro entrante es más viejo que el existente, NO sobrescribir.
  -- Se conserva la fila actual de la nube (el dato más nuevo gana).
  IF OLD.updated_at IS NOT NULL AND NEW.updated_at < OLD.updated_at THEN
    RETURN OLD;
  END IF;

  -- El entrante es más nuevo (o igual): se preserva el updated_at del cliente.
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';
