# CONTEXTO DEL PROYECTO — SplitSmart App

> Documento de contexto para retomar el trabajo (por otra IA o en otra sesión). Generado el 2026-08-31.

Sos un asistente de programación que va a continuar el trabajo en **SplitSmart**, una app React Native (Expo) para dividir gastos entre grupos de personas (viajes, eventos, etc.). Leé este documento antes de tocar código.

## 1. Stack técnico
- **Framework**: React Native + Expo SDK 54, TypeScript, React Navigation (bottom-tabs + native-stack).
- **Persistencia local**: SQLite (`expo-sqlite`) en nativo (Android/iOS), IndexedDB (librería `idb`) en web. Selección de plataforma vía `DatabaseFactory` (interfaz común `IDatabaseService`).
- **Backend/Sync**: Supabase (Postgres + RLS) como nube opcional. Sincronización bidireccional manual (push/pull), NO realtime.
- **Auth**: sistema local (usuario/password en texto plano, ⚠️ deuda técnica conocida) + Google OAuth vía Supabase (PKCE) + biometría (`expo-local-authentication`) + usuario demo.
- **Versión actual**: `1.10.5` (package.json / app.json), próxima en desarrollo `1.10.6` (ver `PENDING_CHANGES.md`).
- Scripts de build: `build-apk.ps1`, `build-apk-dev.ps1`, `build-aab.ps1`, `versiones.ps1` (incrementa versión antes de un build EAS).

## 2. Estructura clave
- `src/context/DataContext.tsx`: lógica central de datos (eventos, gastos, participantes, liquidaciones, import/export, sincronización).
- `src/services/database.ts`: implementación SQLite (nativo).
- `src/services/IndexedDBDatabaseService.ts`: implementación IndexedDB (web).
- `src/services/SupabaseSyncService.ts`: push/pull hacia Supabase.
- `src/services/SharedEventService.ts`: compartir eventos por QR/código corto.
- `src/screens/EventDetail/index.tsx`: pantalla principal de gestión de un evento (gastos, participantes, liquidaciones, actividades/organización), con lógica de roles (dueño/editor/viewer).
- `supabase/*.sql`: migraciones (`schema.sql`, `rls.sql`, `lww-sync.sql`, `shared-collaboration.sql`, `add-activities.sql`, `add-short-code.sql`, `fix-participants-recursion.sql`).
- `CHANGELOG.md`: historial de versiones publicadas. `PENDING_CHANGES.md`: bitácora de cambios sin publicar aún (se vacía al generar un build).

## 3. Funcionalidades principales ya implementadas
- Gestión de eventos con estados: **activo** (todo editable), **bloqueado** (solo pagos), **cerrado** (solo lectura).
- Participantes "representados" (secundarios) que cuelgan de un participante principal para balances.
- Gastos con múltiples pagadores, splits (equal/fixed/percentage/custom), multi-moneda con conversión.
- Liquidaciones (settlements) auto-calculadas al crear/editar/borrar gastos o participantes (algoritmo minimiza transacciones).
- Consolidación/condonación de deudas.
- Compartir eventos por **QR o código corto** con roles `editor` (puede escribir gastos/actividades, no gestiona participantes ni config del evento) y `viewer` (solo lectura total).
- Sincronización **Last-Write-Wins (LWW)** por `updated_at` entre local y Supabase, con manejo de tombstones (borrados) y reconciliación de eliminaciones remotas en el pull.
- Tours guiados (onboarding) en las pantallas principales.
- Calculadora integrada al cargar gastos, validación de nombres en tiempo real, selección múltiple para borrar, etc.

## 4. Arquitectura de sincronización (crítico, leer antes de tocar sync)
- Cada tabla sincronizable usa `sync_status` ('pending' | 'synced'). **Toda función `update*` debe marcar `sync_status='pending'`** o el cambio nunca se sube y el pull lo revierte (bug histórico ya corregido varias veces).
- Push sube solo lo `pending` (nativo) o recalcula todo (web, sección `_pushWeb`) — asimetría conocida, riesgo de pisar cambios recientes en web.
- Pull respeta LWW: solo sobrescribe local si el remoto es más nuevo.
- Existen "guardas FK" (`_existingIds`) para no violar foreign keys subiendo hijos cuyo padre aún no está en la nube (típico tras importar por QR).
- Los borrados usan tabla de tombstones (`deletions`) y se propagan en orden FK-safe.
- Reconciliación de borrados remotos: en el pull se eliminan localmente registros que ya no existen en la nube, con salvaguardas para no borrar datos propios por error.
- **IMPORTANTE**: cambios en código nativo (SQLite/lógica de sync nativa) **no se ven sin rebuild del APK** (el bundle JS va embebido en release/dev builds). Cambios web sí se ven recargando Metro.

## 5. Estado actual / último trabajo en curso (v1.10.6, sin publicar aún)
Bug corregido recientemente: el rol **viewer** (QR solo lectura) podía interactuar con checkboxes y acciones (marcar liquidaciones pagadas, subir comprobantes, crear/editar/eliminar/asignar actividades) que localmente quedaban en `sync_status='pending'`, pero las políticas RLS de Supabase (`user_can_edit_event`) las rechazaban silenciosamente → nunca se reflejaban en el dueño del evento. Se agregó la guarda `isViewerReadOnly` en los handlers de `EventDetail/index.tsx` (`handleToggleSettlementPaid`, `handleUpdateSettlementReceipt`, `handleSaveActivity`, `handleSaveAssign`, `handleDeleteActivity`) y se deshabilitó la UI correspondiente. También se mejoraron los logs de diagnóstico de colaboración (`event_collaborators`) en `DataContext.importSharedEvent` y `SupabaseSyncService.push`.

Archivos tocados en esta ronda:
- `src/screens/EventDetail/index.tsx`
- `src/context/DataContext.tsx`
- `src/services/SupabaseSyncService.ts`

Este trabajo todavía está en `PENDING_CHANGES.md` (no pasó a `CHANGELOG.md` ni se generó build nuevo).

## 6. Deuda técnica / problemas conocidos (no bloqueantes pero relevantes)
- Contraseñas locales en texto plano (sin hash) — riesgo de seguridad documentado, pendiente de resolver.
- Sin rate limiting de login ni validación de complejidad de password aplicada.
- Errores de `tsc` preexistentes no relacionados con sync: `IDatabaseService` no declara `db`, `getConsolidationAssignments`, `saveConsolidationAssignments`, `clearConsolidationAssignments`, `linkUserToSupabase`; claves duplicadas en `LanguageContext.tsx` y `EventDetail/styles.ts`. No bloquean build de Metro/EAS pero conviene limpiarlos.
- `shared-collaboration.sql` debe estar ejecutado en la instancia de Supabase del usuario para que el rol `editor` funcione end-to-end (a diferencia de `lww-sync.sql` que sí se confirmó ejecutado). Sin él, ninguna escritura de un editor por QR se propaga.
- Push web (`_pushWeb`) sube gastos incondicionalmente (no filtra por pending) porque no todas las escrituras web marcan `sync_status` de forma consistente — riesgo latente de pisar cambios recientes.
- Gestión de participantes (agregar/quitar) sigue reservada exclusivamente al dueño del evento (alineado con RLS), no delegable a editores.

## 7. Cómo trabajar en este repo (convenciones)
- Idioma de la UI y de los mensajes al usuario: **español**.
- Antes de un build, mover el contenido de `PENDING_CHANGES.md` a `CHANGELOG.md` y ejecutar `versiones.ps1` para incrementar versión.
- Reglas de sync a respetar siempre: (1) todo `update*` nuevo debe marcar `sync_status='pending'`; (2) al insertar con FKs en SQLite, padres antes que hijos; (3) todo ID nuevo debe generarse con `generateId()` de `src/utils/uuid.ts` (nunca `Date.now()_random`).
- Cambios en lógica nativa requieren rebuild de APK para poder probarse en dispositivo/emulador.

## 8. Hacia dónde vamos (próximos pasos sugeridos)
- Confirmar/ejecutar `shared-collaboration.sql` en la instancia real de Supabase para habilitar de punta a punta el rol `editor`.
- Terminar de validar el fix de v1.10.6 (rol viewer) en dispositivo real y mover el registro a `CHANGELOG.md` + build.
- Evaluar hashing de contraseñas locales (bcrypt/argon2) como mejora de seguridad prioritaria.
- Unificar el criterio de `sync_status` en escrituras web para evitar pisadas de datos recientes en `_pushWeb`.
- Limpiar errores preexistentes de `tsc` (tipos de `IDatabaseService`, claves duplicadas de i18n/estilos).
