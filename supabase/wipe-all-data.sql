-- =====================================================================
-- SplitSmart — BORRADO COMPLETO DE DATOS (RESET)
-- =====================================================================
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
--
-- ⚠️  ADVERTENCIA: Esto ELIMINA TODOS LOS DATOS de forma IRREVERSIBLE.
--     - Deja todas las tablas vacías (como recién creadas).
--     - Reinicia los contadores SERIAL (app_versions, consolidation_assignments).
--     - Elimina TAMBIÉN los usuarios de autenticación (auth.users).
--     NO borra la estructura (tablas, funciones, triggers, políticas RLS).
--
-- Hacer un backup antes si hay dudas.
-- =====================================================================

BEGIN;

-- ─── 1) Vaciar todas las tablas de la aplicación (schema public) ──────────────
-- Un único TRUNCATE con CASCADE resuelve todas las FK (incluidas las RESTRICT)
-- porque todas las tablas referenciadas se truncan a la vez.
-- RESTART IDENTITY reinicia las secuencias SERIAL a 1.
TRUNCATE TABLE
  public.activity_participants,
  public.activities,
  public.event_invitations,
  public.notifications,
  public.push_tokens,
  public.consolidation_assignments,
  public.app_versions,
  public.settlements,
  public.splits,
  public.expense_payers,
  public.expenses,
  public.event_participants,
  public.participants,
  public.events,
  public.user_preferences,
  public.shared_events,
  public.users
RESTART IDENTITY CASCADE;

-- ─── 2) Eliminar los usuarios de autenticación (Supabase Auth) ────────────────
-- Esto borra el login de todos los usuarios. Requiere permisos de servicio
-- (el SQL Editor del Dashboard los tiene).
DELETE FROM auth.users;

-- ─── 3) Vaciar archivos de Storage (recibos y avatars) ────────────────────────
-- Las imágenes que se suben a Supabase Storage viven en storage.objects.
-- Esto elimina TODOS los archivos de todos los buckets, dejándolos vacíos
-- (los buckets en sí NO se borran, solo su contenido).
-- Nota: si además tenés avatars/recibos guardados como base64 en columnas TEXT
-- (users.avatar, participants.avatar, expenses.receipt_image, settlements.receipt_image),
-- esos ya se eliminaron en el TRUNCATE del paso 1.
DELETE FROM storage.objects;

COMMIT;

-- ─── Verificación (opcional) ──────────────────────────────────────────────────
-- SELECT 'users' AS tabla, COUNT(*) FROM public.users
-- UNION ALL SELECT 'events', COUNT(*) FROM public.events
-- UNION ALL SELECT 'auth.users', COUNT(*) FROM auth.users
-- UNION ALL SELECT 'storage.objects', COUNT(*) FROM storage.objects;
