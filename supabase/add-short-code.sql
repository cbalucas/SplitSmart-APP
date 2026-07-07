-- ─────────────────────────────────────────────────────────────────────────────
-- Migración: agrega short_code a shared_events
-- ─────────────────────────────────────────────────────────────────────────────
-- Permite vincular un evento compartido ingresando un código corto legible
-- (8 caracteres, sin caracteres ambiguos) además de escanear el QR.
--
-- Aplicar en el SQL Editor de Supabase. Es idempotente: se puede correr varias veces.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.shared_events
  ADD COLUMN IF NOT EXISTS short_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_shared_events_short_code
  ON public.shared_events(short_code);
