-- ============================================================================
-- Migración: agregar columna "description" a public.activities
-- Idempotente y segura de re-ejecutar.
-- Ejecutar en el SQL Editor de Supabase.
-- ============================================================================

ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS description TEXT;
