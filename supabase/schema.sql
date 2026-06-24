-- =====================================================================
-- SplitSmart — Supabase (PostgreSQL) Schema v2
-- =====================================================================
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
--
-- Este script es IDEMPOTENTE: puede correrse en instalaciones nuevas
-- y en bases de datos existentes sin pérdida de datos.
--
-- Mapeo de tipos SQLite → PostgreSQL:
--   TEXT/INTEGER booleans → BOOLEAN
--   TEXT timestamps       → TIMESTAMPTZ
--   TEXT IDs              → UUID
--   INTEGER (0/1)         → BOOLEAN
--
-- EJECUCIÓN: Primero schema.sql, luego rls.sql
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── HELPER: auto-update updated_at ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- ─── HELPER: verificar participación del usuario en un evento ─────────────────
-- Centraliza la verificación "¿participa el usuario en este evento?"
-- Usada por múltiples políticas RLS para evitar sub-queries repetidas.
-- SECURITY DEFINER: se ejecuta con privilegios del owner (bypasea RLS internamente).
-- STABLE: no modifica datos; Postgres puede cachear el resultado por query.
CREATE OR REPLACE FUNCTION public.user_participates_in_event(event_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.event_participants ep
    JOIN public.participants p ON ep.participant_id = p.id
    WHERE ep.event_id = event_uuid
      AND p.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

-- ─── HELPER: acceso al evento (creador O participante) ───────────────────────
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
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

-- ─── TRIGGER: crear public.users al registrarse via Auth ─────────────────────
-- Se ejecuta en auth.users (INSERT) → crea el perfil en public.users.
-- Aplica para Google OAuth, email/password, magic link, etc.
-- username = email_prefix + primeros 8 chars del UUID (garantiza unicidad).
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
BEGIN
  base_username := LOWER(REGEXP_REPLACE(
    COALESCE(
      NEW.raw_user_meta_data->>'preferred_username',
      SPLIT_PART(NEW.email, '@', 1),
      'user'
    ),
    '[^a-z0-9_]', '_', 'g'
  ));
  final_username := base_username || '_' || SUBSTRING(NEW.id::text, 1, 8);

  INSERT INTO public.users (id, username, email, name, sync_status)
  VALUES (
    NEW.id,
    final_username,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    'synced'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE TRIGGER trg_on_new_auth_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ─── SHARED_EVENTS (QR sharing) ─── SE CREA PRIMERO (referenciada por events) ─
-- Snapshot de eventos para compartir por QR anónimo.
-- DIFERENCIA con event_invitations: el destinatario es ANÓNIMO.
--   Cualquiera con el share_id (UUID secreto) puede escanear el QR.
-- owner_id → auth.uid() sin FK declarada (auth.users no es accesible via FK).
--   El RLS garantiza que solo el owner puede modificar.
-- expires_at: vencimiento automático del QR (90 días por defecto).
CREATE TABLE IF NOT EXISTS public.shared_events (
  share_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       UUID NOT NULL,
  owner_name     TEXT NOT NULL,
  event_snapshot JSONB NOT NULL,
  role           TEXT NOT NULL DEFAULT 'viewer'
                 CHECK (role IN ('editor', 'viewer')),
  expires_at     TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days'),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shared_events_owner      ON public.shared_events(owner_id);
CREATE INDEX IF NOT EXISTS idx_shared_events_expires_at ON public.shared_events(expires_at);

CREATE OR REPLACE TRIGGER trg_shared_events_updated_at
  BEFORE UPDATE ON public.shared_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── USERS ───────────────────────────────────────────────────────────────────
-- Perfil de aplicación vinculado a auth.users de Supabase Auth.
-- id = auth.users.id (UUID generado por Supabase al registrarse).
-- La contraseña la gestiona Supabase Auth, NO se almacena aquí.
-- NOTA: Al sincronizar desde SQLite, excluir el campo 'password'.
--   Mapear: sqlite.users.supabase_user_id → supabase.users.id
CREATE TABLE IF NOT EXISTS public.users (
  id                             UUID PRIMARY KEY,  -- = auth.users.id
  username                       TEXT UNIQUE NOT NULL,
  email                          TEXT UNIQUE NOT NULL,
  name                           TEXT NOT NULL,
  phone                          TEXT,
  alias_cbu                      TEXT,
  avatar                         TEXT,
  preferred_currency             TEXT NOT NULL DEFAULT 'ARS',
  auto_logout                    TEXT NOT NULL DEFAULT 'never',
  skip_password                  BOOLEAN NOT NULL DEFAULT FALSE,
  auto_login                     BOOLEAN NOT NULL DEFAULT FALSE,
  chat_mode_advanced             BOOLEAN NOT NULL DEFAULT FALSE,
  biometric_enabled              BOOLEAN NOT NULL DEFAULT FALSE,
  notifications_expense_added    BOOLEAN NOT NULL DEFAULT TRUE,
  notifications_payment_received BOOLEAN NOT NULL DEFAULT FALSE,
  notifications_event_updated    BOOLEAN NOT NULL DEFAULT FALSE,
  notifications_weekly_report    BOOLEAN NOT NULL DEFAULT FALSE,
  privacy_share_email            BOOLEAN NOT NULL DEFAULT FALSE,
  privacy_share_phone            BOOLEAN NOT NULL DEFAULT FALSE,
  privacy_allow_invitations      BOOLEAN NOT NULL DEFAULT TRUE,
  privacy_share_event            BOOLEAN NOT NULL DEFAULT TRUE,
  last_login                     TIMESTAMPTZ,
  created_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Control de sincronización: 'synced' = en la nube y sin cambios locales
  sync_status                    TEXT NOT NULL DEFAULT 'synced'
                                 CHECK (sync_status IN ('pending', 'synced', 'conflict'))
);

CREATE OR REPLACE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── USER_PREFERENCES ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  key        TEXT NOT NULL,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, key)
);
CREATE INDEX IF NOT EXISTS idx_user_prefs_user_id ON public.user_preferences(user_id);
-- ─── EVENTS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.events (
  id               UUID PRIMARY KEY,
  name             TEXT NOT NULL,
  description      TEXT,
  start_date       TIMESTAMPTZ NOT NULL,
  location         TEXT,
  currency         TEXT NOT NULL DEFAULT 'ARS',
  total_amount     REAL NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'closed', 'completed', 'archived')),
  type             TEXT NOT NULL DEFAULT 'public'
                   CHECK (type IN ('public', 'private')),
  category         TEXT DEFAULT 'evento',
  creator_id       UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_locked        BOOLEAN NOT NULL DEFAULT FALSE,
  is_express       BOOLEAN NOT NULL DEFAULT FALSE,
  closing_comment  TEXT,
  closed_at        TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  -- Campos para eventos compartidos por QR (recibidos)
  -- is_shared=TRUE: evento importado de otro usuario
  -- shared_role: permiso con que fue importado
  -- share_id: referencia al snapshot en shared_events (para re-fetch/refresh)
  is_shared        BOOLEAN NOT NULL DEFAULT FALSE,
  shared_role      TEXT CHECK (shared_role IN ('editor', 'viewer')),
  share_id         UUID REFERENCES public.shared_events(share_id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sync_status      TEXT NOT NULL DEFAULT 'synced'
                   CHECK (sync_status IN ('pending', 'synced', 'conflict'))
);

CREATE INDEX IF NOT EXISTS idx_events_creator_id  ON public.events(creator_id);
CREATE INDEX IF NOT EXISTS idx_events_status      ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_sync_status ON public.events(sync_status);
CREATE INDEX IF NOT EXISTS idx_events_is_shared   ON public.events(is_shared) WHERE is_shared = TRUE;
CREATE INDEX IF NOT EXISTS idx_events_share_id    ON public.events(share_id);

CREATE OR REPLACE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── PARTICIPANTS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.participants (
  id                  UUID PRIMARY KEY,
  name                TEXT NOT NULL,
  email               TEXT,
  phone               TEXT,
  alias_cbu           TEXT,
  avatar              TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  participant_type    TEXT NOT NULL DEFAULT 'temporary'
                      CHECK (participant_type IN ('friend', 'temporary')),
  user_id             UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_by_user_id  UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_public           BOOLEAN NOT NULL DEFAULT FALSE,
  times_used          INTEGER NOT NULL DEFAULT 0,
  last_used_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  sync_status         TEXT NOT NULL DEFAULT 'synced'
                      CHECK (sync_status IN ('pending', 'synced', 'conflict'))
);

CREATE INDEX IF NOT EXISTS idx_participants_user_id    ON public.participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_created_by ON public.participants(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_participants_type       ON public.participants(participant_type);

CREATE OR REPLACE TRIGGER trg_participants_updated_at
  BEFORE UPDATE ON public.participants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── EVENT_PARTICIPANTS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_participants (
  id                    UUID PRIMARY KEY,
  event_id              UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  participant_id        UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  role                  TEXT NOT NULL DEFAULT 'member'
                        CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  balance               REAL NOT NULL DEFAULT 0,
  joined_at             TIMESTAMPTZ DEFAULT NOW(),
  -- NULL = participante primario; UUID = participante secundario (apuntando al primario)
  parent_participant_id UUID REFERENCES public.participants(id) ON DELETE SET NULL,
  UNIQUE (event_id, participant_id)
);

CREATE INDEX IF NOT EXISTS idx_ep_event_id       ON public.event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_ep_participant_id ON public.event_participants(participant_id);

-- ─── EXPENSES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.expenses (
  id              UUID PRIMARY KEY,
  event_id        UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  description     TEXT NOT NULL,
  amount          REAL NOT NULL,                     -- en la moneda del evento
  currency        TEXT NOT NULL DEFAULT 'USD',       -- moneda original del gasto
  original_amount REAL,                              -- monto en moneda original (si difiere)
  conversion_rate REAL NOT NULL DEFAULT 1.0,
  date            TIMESTAMPTZ NOT NULL,
  category        TEXT,
  payer_id        UUID NOT NULL REFERENCES public.participants(id) ON DELETE RESTRICT,
  -- payer_name: desnormalizado intencionalmente.
  -- Preserva el nombre histórico aunque el participante sea renombrado/eliminado.
  payer_name      TEXT NOT NULL DEFAULT '',
  receipt_image   TEXT,                              -- URL en Supabase Storage
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  sync_status     TEXT NOT NULL DEFAULT 'synced'
                  CHECK (sync_status IN ('pending', 'synced', 'conflict'))
);

CREATE INDEX IF NOT EXISTS idx_expenses_event_id    ON public.expenses(event_id);
CREATE INDEX IF NOT EXISTS idx_expenses_payer_id    ON public.expenses(payer_id);
CREATE INDEX IF NOT EXISTS idx_expenses_sync_status ON public.expenses(sync_status);
CREATE INDEX IF NOT EXISTS idx_expenses_date        ON public.expenses(date);

CREATE OR REPLACE TRIGGER trg_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── EXPENSE_PAYERS (multi-pagador) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.expense_payers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id     UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  amount         REAL NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- sync_status: necesario para sync bidireccional (consistente con otras tablas)
  sync_status    TEXT NOT NULL DEFAULT 'synced'
                 CHECK (sync_status IN ('pending', 'synced', 'conflict'))
);

CREATE INDEX IF NOT EXISTS idx_expense_payers_expense_id     ON public.expense_payers(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_payers_participant_id ON public.expense_payers(participant_id);

CREATE OR REPLACE TRIGGER trg_expense_payers_updated_at
  BEFORE UPDATE ON public.expense_payers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── SPLITS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.splits (
  id             UUID PRIMARY KEY,
  expense_id     UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  amount         REAL NOT NULL,
  percentage     REAL,
  type           TEXT NOT NULL DEFAULT 'equal'
                 CHECK (type IN ('equal', 'fixed', 'percentage', 'custom')),
  is_paid        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  sync_status    TEXT NOT NULL DEFAULT 'synced'
                 CHECK (sync_status IN ('pending', 'synced', 'conflict'))
);

CREATE INDEX IF NOT EXISTS idx_splits_expense_id     ON public.splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_splits_participant_id ON public.splits(participant_id);
CREATE INDEX IF NOT EXISTS idx_splits_is_paid        ON public.splits(is_paid) WHERE is_paid = FALSE;

CREATE OR REPLACE TRIGGER trg_splits_updated_at
  BEFORE UPDATE ON public.splits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── SETTLEMENTS (liquidaciones) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.settlements (
  id                    UUID PRIMARY KEY,
  event_id              UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  -- ON DELETE RESTRICT (explícito): no se puede eliminar un participante con liquidaciones.
  -- Los nombres desnormalizados preservan el historial si el participante cambia.
  from_participant_id   UUID NOT NULL REFERENCES public.participants(id) ON DELETE RESTRICT,
  from_participant_name TEXT NOT NULL,
  to_participant_id     UUID NOT NULL REFERENCES public.participants(id) ON DELETE RESTRICT,
  to_participant_name   TEXT NOT NULL,
  amount                REAL NOT NULL,
  is_paid               BOOLEAN NOT NULL DEFAULT FALSE,
  paid_at               TIMESTAMPTZ,
  event_status          TEXT NOT NULL DEFAULT 'active',
  receipt_image         TEXT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sync_status           TEXT NOT NULL DEFAULT 'synced'
                        CHECK (sync_status IN ('pending', 'synced', 'conflict'))
);

CREATE INDEX IF NOT EXISTS idx_settlements_event_id    ON public.settlements(event_id);
CREATE INDEX IF NOT EXISTS idx_settlements_from_p      ON public.settlements(from_participant_id);
CREATE INDEX IF NOT EXISTS idx_settlements_to_p        ON public.settlements(to_participant_id);
CREATE INDEX IF NOT EXISTS idx_settlements_is_paid     ON public.settlements(is_paid) WHERE is_paid = FALSE;
CREATE INDEX IF NOT EXISTS idx_settlements_sync_status ON public.settlements(sync_status);

CREATE OR REPLACE TRIGGER trg_settlements_updated_at
  BEFORE UPDATE ON public.settlements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── APP_VERSIONS ─────────────────────────────────────────────────────────────
-- changelog_* se guarda como JSONB (arrays de strings)
CREATE TABLE IF NOT EXISTS public.app_versions (
  id                     SERIAL PRIMARY KEY,
  version                TEXT UNIQUE NOT NULL,
  version_name           TEXT,
  release_date           TEXT NOT NULL,
  is_current             BOOLEAN NOT NULL DEFAULT FALSE,
  changelog_improvements JSONB DEFAULT '[]',
  changelog_features     JSONB DEFAULT '[]',
  changelog_bugfixes     JSONB DEFAULT '[]',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_versions_current ON public.app_versions(is_current);

-- ─── CONSOLIDATION_ASSIGNMENTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.consolidation_assignments (
  id          SERIAL PRIMARY KEY,
  event_id    UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  -- ON DELETE RESTRICT: igual que settlements, para proteger integridad histórica
  payer_id    UUID NOT NULL REFERENCES public.participants(id) ON DELETE RESTRICT,
  payer_name  TEXT NOT NULL,
  debtor_id   UUID NOT NULL REFERENCES public.participants(id) ON DELETE RESTRICT,
  debtor_name TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consolidation_event_id ON public.consolidation_assignments(event_id);

CREATE OR REPLACE TRIGGER trg_consolidation_updated_at
  BEFORE UPDATE ON public.consolidation_assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── PUSH_TOKENS ──────────────────────────────────────────────────────────────
-- Token Expo/FCM/APNs para enviar push notifications al dispositivo del usuario.
-- Un usuario puede tener tokens en múltiples dispositivos.
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  platform   TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);

CREATE OR REPLACE TRIGGER trg_push_tokens_updated_at
  BEFORE UPDATE ON public.push_tokens
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
-- Notificaciones en-app y push para usuarios registrados en Supabase.
-- Canal de entrega: push (expo-notifications), in-app (leída en la app), whatsapp (legacy).
CREATE TABLE IF NOT EXISTS public.notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Destinatario: usuario registrado en Supabase
  recipient_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  -- Contexto de la notificación
  event_id        UUID REFERENCES public.events(id) ON DELETE CASCADE,
  -- Tipo de notificación
  type            TEXT NOT NULL
                  CHECK (type IN (
                    'expense_added',      -- nuevo gasto en evento
                    'expense_modified',   -- gasto editado
                    'payment_sent',       -- alguien marcó pago como enviado
                    'payment_received',   -- liquidación marcada como pagada
                    'settlement_reminder',-- recordatorio de deuda pendiente
                    'event_updated',      -- cambios en datos del evento
                    'event_invitation',   -- invitación a participar en un evento
                    'event_closed'        -- evento cerrado/liquidado
                  )),
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  -- Datos extras (JSON) para navegar a la pantalla correcta al tocar la notif
  data            JSONB,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  read_at         TIMESTAMPTZ,
  -- Canales de entrega intentados
  sent_push       BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── NOTIFICATIONS: índices adicionales ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notifications_recipient  ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_event      ON public.notifications(event_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread     ON public.notifications(recipient_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- ─── EVENT_INVITATIONS ────────────────────────────────────────────────────────
-- Invitaciones para compartir un evento entre usuarios (local o Supabase).
-- El invitado puede aceptar → se agrega como participante en el evento.
-- CONSTRAINT chk_invitee_present: al menos uno de invitee_user_id o invitee_email
--   debe estar presente (no se puede invitar a nadie sin identificador).
CREATE TABLE IF NOT EXISTS public.event_invitations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  inviter_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  -- Destinatario: puede ser usuario existente o invitado por email
  invitee_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  invitee_email   TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  role            TEXT NOT NULL DEFAULT 'member'
                  CHECK (role IN ('admin', 'member', 'viewer')),
  message         TEXT,
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  responded_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_invitee_present
    CHECK (invitee_user_id IS NOT NULL OR invitee_email IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_invitations_event_id  ON public.event_invitations(event_id);
CREATE INDEX IF NOT EXISTS idx_invitations_invitee   ON public.event_invitations(invitee_user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email     ON public.event_invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_invitations_status    ON public.event_invitations(status) WHERE status = 'pending';

CREATE OR REPLACE TRIGGER trg_event_invitations_updated_at
  BEFORE UPDATE ON public.event_invitations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── MIGRACIONES PARA INSTANCIAS EXISTENTES (idempotente) ────────────────────
-- Estas sentencias son seguras de correr en cualquier estado de la BD.

-- events: campos de sharing (v2)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_shared   BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS shared_role TEXT CHECK (shared_role IN ('editor', 'viewer'));
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS share_id    UUID;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'events_share_id_fkey') THEN
    ALTER TABLE public.events ADD CONSTRAINT events_share_id_fkey
      FOREIGN KEY (share_id) REFERENCES public.shared_events(share_id) ON DELETE SET NULL;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_events_is_shared ON public.events(is_shared) WHERE is_shared = TRUE;
CREATE INDEX IF NOT EXISTS idx_events_share_id  ON public.events(share_id);

-- expenses: payer_name desnormalizado (v2)
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS payer_name TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);

-- expense_payers: sync_status y trigger (v2)
ALTER TABLE public.expense_payers ADD COLUMN IF NOT EXISTS sync_status TEXT
  NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('pending', 'synced', 'conflict'));
CREATE INDEX IF NOT EXISTS idx_expense_payers_participant_id ON public.expense_payers(participant_id);

-- splits: índice adicional (v2)
CREATE INDEX IF NOT EXISTS idx_splits_is_paid ON public.splits(is_paid) WHERE is_paid = FALSE;

-- settlements: índice is_paid (v2)
CREATE INDEX IF NOT EXISTS idx_settlements_is_paid ON public.settlements(is_paid) WHERE is_paid = FALSE;

-- participants: índice is_public (v2)
CREATE INDEX IF NOT EXISTS idx_participants_is_public ON public.participants(is_public) WHERE is_public = TRUE;

-- user_preferences: índice por user_id (v2)
CREATE INDEX IF NOT EXISTS idx_user_prefs_user_id ON public.user_preferences(user_id);

-- shared_events: campo expires_at (v2)
ALTER TABLE public.shared_events ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ
  DEFAULT (NOW() + INTERVAL '90 days');
CREATE INDEX IF NOT EXISTS idx_shared_events_expires_at ON public.shared_events(expires_at);
