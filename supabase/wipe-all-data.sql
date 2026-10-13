-- =====================================================================
-- SplitSmart — BORRADO COMPLETO DE DATOS (RESET)
-- =====================================================================
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
--
-- ⚠️  ADVERTENCIA: Esto ELIMINA TODOS LOS DATOS de forma IRREVERSIBLE.
--     - Deja todas las tablas vacías (como recién creadas).
--     - Reinicia los contadores SERIAL (app_versions, consolidation_assignments).
--     - Elimina TAMBIÉN los usuarios de autenticación (auth.users).
--     - Vacía también app_versions (datos de referencia de versiones).
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
  public.event_collaborators,
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

-- ─── Storage ──────────────────────────────────────────────────────────────────
-- La app NO usa Supabase Storage: avatars y comprobantes se guardan como texto en
-- columnas (users.avatar, participants.avatar, expenses.receipt_image,
-- settlements.receipt_image) y ya se eliminaron en el TRUNCATE del paso 1.
-- Nota: Supabase bloquea el DELETE directo sobre storage.objects ("Direct deletion from
-- storage tables is not allowed"); si algún día hubiera archivos, se vacían desde
-- Dashboard → Storage o con la Storage API, no con SQL.

COMMIT;

-- ─── Verificación (opcional) ──────────────────────────────────────────────────
-- SELECT 'users' AS tabla, COUNT(*) FROM public.users
-- UNION ALL SELECT 'events', COUNT(*) FROM public.events
-- UNION ALL SELECT 'event_collaborators', COUNT(*) FROM public.event_collaborators
-- UNION ALL SELECT 'shared_events', COUNT(*) FROM public.shared_events
-- UNION ALL SELECT 'auth.users', COUNT(*) FROM auth.users;

-- =====================================================================
-- DESPUÉS DE EJECUTARLO — datos locales de cada dispositivo
-- =====================================================================
-- Este script solo limpia la NUBE. Cada celular/navegador conserva su base local
-- y su sesión. Para evitar estados mezclados (la sincronización interpretaría lo
-- que falta en la nube como "borrado" y lo eliminaría, o intentaría subirlo con
-- usuarios que ya no existen):
--   • App: Perfil → borrar datos (incluyendo usuarios) o desinstalar/reinstalar.
--   • Web: borrar los datos del sitio (DevTools → Application → Clear site data).
--   • Volver a registrarse / iniciar sesión (los usuarios de Auth ya no existen).
