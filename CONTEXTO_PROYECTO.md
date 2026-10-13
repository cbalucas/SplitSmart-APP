# CONTEXTO DEL PROYECTO — SplitSmart App

> Documento de contexto para retomar el trabajo (por otra IA o en otra sesión). Generado el 2026-08-31; actualizado el 2026-10-13.

Sos un asistente de programación que va a continuar el trabajo en **SplitSmart**, una app React Native (Expo) para dividir gastos entre grupos de personas (viajes, eventos, etc.). Leé este documento antes de tocar código.

## 1. Stack técnico
- **Framework**: React Native + Expo SDK 54, TypeScript, React Navigation (bottom-tabs + native-stack).
- **Persistencia local**: SQLite (`expo-sqlite`) en nativo (Android/iOS), IndexedDB (librería `idb`) en web. Selección de plataforma vía `DatabaseFactory` (interfaz común `IDatabaseService`).
- **Backend/Sync**: Supabase (Postgres + RLS) como nube opcional. Sincronización bidireccional (push/pull) disparada al loguear, tras cada escritura, al volver a primer plano (mín. 30 s) y por Supabase Realtime (suscripción a events/expenses/settlements/participants → pull con debounce de 1,5 s).
- **Auth**: sistema local (usuario/password con hash PBKDF2-SHA256 + salt, ver `src/utils/passwordHash.ts`; migra claves viejas en texto plano al primer login correcto; bloqueo de 30 s tras 5 fallos en `src/utils/loginThrottle.ts`) + Google OAuth vía Supabase (PKCE) + biometría (`expo-local-authentication`) + usuario demo.
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
- Push sube solo lo `pending` (nativo) o todo (web, `_pushWeb`). En web una guarda LWW (`_notOlderThanRemote`) omite filas cuyo `updated_at` local sea menor al remoto, así no pisa cambios más nuevos de otro dispositivo. Las escrituras web siguen sin marcar `sync_status` de forma consistente; se confía en `updated_at`, que sí se actualiza siempre.
- Pull respeta LWW: solo sobrescribe local si el remoto es más nuevo.
- Existen "guardas FK" (`_existingIds`) para no violar foreign keys subiendo hijos cuyo padre aún no está en la nube (típico tras importar por QR).
- Los borrados usan tabla de tombstones (`deletions`) y se propagan en orden FK-safe.
- Reconciliación de borrados remotos: en el pull se eliminan localmente registros que ya no existen en la nube, con salvaguardas para no borrar datos propios por error.
- **IMPORTANTE**: cambios en código nativo (SQLite/lógica de sync nativa) **no se ven sin rebuild del APK** (el bundle JS va embebido en release/dev builds). Cambios web sí se ven recargando Metro.

## 5. Estado actual (v1.10.6, sin publicar aún)
Todo el detalle está en `PENDING_CHANGES.md`. Resumen:
- **Rol viewer de solo lectura** (guarda `isViewerReadOnly` en `EventDetail`) y **reintento idempotente del alta en `event_collaborators`** al inicio de cada pull (`_ensureCollaboratorRegistration*`). Pendiente: validar en dispositivo real.
- **Limpieza de tipos**: `npx tsc --noEmit` = 0 errores (antes 53). `IDatabaseService` declara ahora las funciones de consolidación y `linkUserToSupabase`; el handle crudo `db` se sigue usando con `(databaseService as any).db` (es privado en ambas implementaciones).
- **Bugs corregidos**: `UpdateService` (constante dentro de un comentario), versión leída de `app.json` en Home (ahora `expo-constants`), splits de Express con `type:'custom'` → `'fixed'`, `linkUserToSupabase` ausente en IndexedDB, traducciones `helpQ1` faltantes, estilos/claves duplicadas.
- **Seguridad**: hash de contraseñas + bloqueo por intentos (dependencia nueva `@noble/hashes`, JS puro).
- **UX**: `CustomAlert` ya no muestra un destello azul "OK" al cerrarse; el bloqueo de login muestra cuenta regresiva en vivo.
- **Web**: guarda LWW en el push.
- `shared-collaboration.sql` **ya está ejecutado** en la instancia de Supabase (la tabla `event_collaborators` existe).

## 6. Deuda técnica / problemas conocidos
- Archivos enormes: `EventDetail/index.tsx` (~5.800 líneas), `database.ts` (~4.800), `ProfileScreen/index.tsx` (~3.600). Candidatos a dividir.
- Los scripts de `test/*.js` no usan Jest; `npm test` no ejecuta pruebas reales. No hay tests automatizados de cálculo/sync.
- Posibles duplicados sin confirmar: `components/Button/index.tsx` y `components/Card/index.tsx` (los imports resuelven a `Button.tsx`/`Card.tsx`), `CHANGELOG.md.bak`. `services/SyncService.ts` NO es duplicado: es `LocalOnlySyncService`, el fallback de `SyncFactory`.
- `CHANGELOG.md` se detiene en la 1.9.1 aunque la app va por la 1.10.x: faltan las entradas 1.10.0–1.10.5.
- Escrituras web no marcan `sync_status` de forma uniforme (mitigado con la guarda LWW; ver §4).
- El `share_id` actúa como token del QR y `shared_events` es legible por quien lo conozca (por diseño); el código corto de 8 caracteres se genera con `Math.random()` (no criptográfico).
- Los logs de `DataContext.tsx` tienen texto con doble codificación (mojibake) en los emojis; es solo cosmético.
- Gestión de participantes (agregar/quitar) sigue reservada al dueño del evento (alineado con RLS).
- Varios archivos usan fin de línea CRLF y otros LF; respetar el de cada archivo al editar.

## 7. Cómo trabajar en este repo (convenciones)
- Idioma de la UI y de los mensajes al usuario: **español**.
- Antes de un build, mover el contenido de `PENDING_CHANGES.md` a `CHANGELOG.md` y ejecutar `versiones.ps1` para incrementar versión.
- Reglas de sync a respetar siempre: (1) todo `update*` nuevo debe marcar `sync_status='pending'`; (2) al insertar con FKs en SQLite, padres antes que hijos; (3) todo ID nuevo debe generarse con `generateId()` de `src/utils/uuid.ts` (nunca `Date.now()_random`).
- Cambios en lógica nativa requieren rebuild de APK para poder probarse en dispositivo/emulador.

## 8. Hacia dónde vamos (próximos pasos sugeridos)
- Validar en dispositivo real el rol viewer/editor y el rendimiento del hash de contraseñas (PBKDF2, 20.000 iteraciones), y hacer el build de la 1.10.6.
- Completar `CHANGELOG.md` (1.10.x) y mover ahí `PENDING_CHANGES.md` al generar el build.
- Confirmar y borrar los archivos duplicados de §6.
- Agregar pruebas automatizadas (Jest) para `calculations.ts`, `ConsolidationService` y `passwordHash`.
- Evaluar partir los archivos gigantes.
