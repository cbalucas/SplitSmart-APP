# 💸 SplitSmart

App móvil (y web) para dividir gastos entre grupos de personas: viajes, asados, cumpleaños, salidas. Calcula quién le debe a quién con la menor cantidad de transferencias posible, funciona sin conexión y, si el usuario lo desea, sincroniza con la nube y permite compartir eventos por QR.

<p align="center">
  <img src="./assets/splitsmart/icon.png" width="128" height="128" alt="SplitSmart Logo">
</p>

> **Versión actual:** ver `package.json` / `app.json`. Historial en [`CHANGELOG.md`](./CHANGELOG.md); cambios sin publicar en [`PENDING_CHANGES.md`](./PENDING_CHANGES.md).

## ✨ Funcionalidades

**Eventos y gastos**
- Eventos con tres estados: **activo** (todo editable), **bloqueado** (solo pagos) y **cerrado** (solo lectura).
- Gastos con uno o varios pagadores, división igual, por monto fijo, por porcentaje o personalizada.
- Multi-moneda (ARS, USD, EUR, BRL) con tasa de conversión por gasto.
- Calculadora integrada, comprobantes con foto y categorías.
- **Participantes representados**: una persona que lleva a otras (ej. su familia) y paga/cobra por ellas.
- **Evento Express (Splitty ⚡)**: asistente tipo chat para crear un evento completo en pocos pasos.
- **Organización**: lista de tareas del evento con asignados y plantillas reutilizables.

**Liquidaciones**
- Se recalculan solas al crear, editar o borrar gastos o participantes; el algoritmo minimiza la cantidad de transferencias.
- Marcar pagos como realizados, adjuntar comprobante y deshacer en lote.
- Consolidación y condonación de deudas (alguien paga por otro).
- Resumen para compartir por WhatsApp.

**Cuentas y seguridad**
- Cuenta local (usuario/contraseña), **Google** (OAuth con Supabase), **biometría** y usuario **Demo** con datos de ejemplo.
- Contraseñas locales guardadas con hash (PBKDF2-SHA256 + salt) y bloqueo de 30 s tras 5 intentos fallidos.
- Auto-login y auto-logout configurables.

**Nube y colaboración (opcional)**
- Sincronización con **Supabase** (push/pull, *last-write-wins* por `updated_at`, borrados propagados, Realtime y sync al volver a primer plano).
- Compartir un evento por **QR o código corto** con rol `editor` (carga gastos y actividades) o `viewer` (solo lectura). Los permisos los aplica RLS en Supabase.

**Experiencia**
- Español, inglés y portugués · tema claro/oscuro · tours guiados por pantalla · aviso de nueva versión.

## 🏗️ Stack

| Capa | Tecnología |
|---|---|
| App | React Native 0.81 · React 19 · Expo SDK 54 · TypeScript |
| Navegación | React Navigation (native-stack) |
| Datos locales | SQLite (`expo-sqlite`) en Android/iOS · IndexedDB (`idb`) en web, detrás de `IDatabaseService` |
| Nube | Supabase (Postgres + Auth + RLS + Realtime) |
| Builds | EAS Build / Gradle local (scripts `.ps1`) |

```
App.tsx → Theme → Language → Auth → Data → Navigation
src/
├── components/    UI reutilizable (Button, Card, CustomAlert, TutorialOverlay…)
├── context/       Auth, Data (estado + sync), Language, Theme
├── screens/       Home, CreateEvent, EventDetail, CreateExpense, ExpressEvent,
│                  ManageFriends, ProfileScreen, Auth/*
├── services/      database.ts (SQLite) · IndexedDBDatabaseService.ts (web)
│                  SupabaseSyncService.ts · SharedEventService.ts · calculations.ts
│                  ConsolidationService.ts · UpdateService.ts
├── utils/         uuid, passwordHash, loginThrottle
├── localization/  es / en
└── types/         modelos y navegación
supabase/          esquema, RLS y migraciones SQL
```

## 🚀 Puesta en marcha

Requisitos: Node 18+, npm, y (para Android) Android Studio o una cuenta de EAS.

```bash
git clone https://github.com/cbalucas/SplitSmart-APP.git
cd SplitSmart-APP
npm install
cp .env.example .env     # completar las variables (ver abajo)
npm start                # Expo dev server
npm run web              # versión web
```

### Variables de entorno (`.env`, no se versiona)
| Variable | Uso |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima (protegida por RLS) |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Client ID web de Google para el login nativo |

Sin Supabase la app funciona 100 % local; solo se desactivan Google, la sincronización y compartir por QR.

### Base de datos en Supabase
Ejecutar en el SQL Editor, en este orden: `schema.sql` → `rls.sql` → `lww-sync.sql` → `shared-collaboration.sql` → `add-activities.sql` → `add-activity-description.sql` → `add-short-code.sql` → `fix-participants-recursion.sql`. Son idempotentes. Sin `shared-collaboration.sql` el rol `editor` no puede escribir.

### Scripts
```bash
npm run android | ios            # ejecutar en dispositivo/emulador (requiere prebuild)
npm run build:apk:dev            # APK de preview (EAS)
npm run build:apk:prod           # APK de producción (EAS)
.\build-apk.ps1 | .\build-aab.ps1  # builds locales con Gradle
npm run lint
npx tsc --noEmit                 # chequeo de tipos (debe dar 0 errores)
```

## 🔖 Versionado y releases
1. Registrar cada cambio en `PENDING_CHANGES.md`.
2. Antes de un build: `.\versiones.ps1` (mueve lo pendiente a `CHANGELOG.md` e incrementa versión en `app.json`, `package.json`, `build.gradle` y `latest-version.json`).
3. Generar el build con los scripts `build-*.ps1`.

Detalle en [`VERSIONING.md`](./VERSIONING.md).

## 🧭 Reglas de sincronización (importante para quien toque el código)
- Toda función `update*` debe marcar `sync_status = 'pending'`, o el cambio nunca sube y el pull lo revierte.
- Insertar siempre padres antes que hijos (claves foráneas).
- Los IDs nuevos se generan con `generateId()` de `src/utils/uuid.ts`.
- Los cambios en lógica nativa (SQLite/sync) requieren un nuevo build para verse en el dispositivo.

## 📄 Más documentación
- [`CONTEXTO_PROYECTO.md`](./CONTEXTO_PROYECTO.md) — contexto técnico para retomar el trabajo.
- [`docs/privacy-policy.html`](./docs/privacy-policy.html) — política de privacidad.
