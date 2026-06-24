# Cambios Pendientes de Registrar — SplitSmart

> **Propósito:** Bitácora de trabajo en curso entre sesiones de chat.
> Registrar aquí TODOS los cambios realizados antes de generar un nuevo APK/AAB.
> Una vez generado el build, mover el contenido a `CHANGELOG.md` y vaciar este archivo.

---

## 🗂️ Versión en desarrollo: v1.10.5

> Cambios realizados después del build de v1.10.4

### 🚀 Nuevas Funcionalidades

- **Vinculación usuario local ↔ Supabase**: Un usuario local con email puede vincularse a su cuenta de Supabase si el email coincide. La app ofrece hacerlo tras el login y pide confirmación. El método `linkToSupabase(password)` maneja el flujo completo. El usuario Demo queda protegido y NUNCA se vincula.
- **Campo `supabaseUserId` en User**: El tipo `User` ahora expone el UUID de Supabase vinculado (`supabaseUserId?: string`). `undefined` = usuario solo-local.
- **Columna `supabase_user_id` en SQLite**: Migración automática agrega la columna a la tabla `users`. Nuevos métodos: `linkUserToSupabase()`, `getUserBySupabaseId()`.
- **Tablas Supabase nuevas** (`schema.sql` + `rls.sql`):
  - `push_tokens` — tokens Expo/FCM/APNs por dispositivo por usuario
  - `notifications` — notificaciones in-app y push con tipos: `expense_added`, `expense_modified`, `payment_sent`, `payment_received`, `settlement_reminder`, `event_updated`, `event_invitation`, `event_closed`
  - `event_invitations` — invitaciones para compartir eventos entre usuarios (con estado pending/accepted/declined/expired)
- **`DEMO_USER_ID` exportado** desde `demoUser.ts` como constante centralizada
- **`offerLinkToSupabase`** state en AuthContext: se activa tras login/auto-login de usuario no-demo con email real sin `supabase_user_id`. Las pantallas pueden usarlo para mostrar un banner/modal de vinculación.
- **`dismissLinkOffer()`** en AuthContext: descarta la oferta para la sesión actual.

### 🔧 Correcciones de Bugs

_(ninguna aún)_

### ✨ Mejoras

- `autoLoginIfEnabled()` ahora usa la constante importada `DEMO_USER_ID` en vez de una variable local.
- `logout()` resetea `offerLinkToSupabase = false`.
- `_mapDbUserToUser()` incluye `supabaseUserId` desde `dbUser.supabase_user_id`.
- `updateUserProfile()` acepta `supabaseUserId` como campo actualizable.

### 📁 Archivos Modificados

- `src/types/index.ts` — campo `supabaseUserId` en interfaz User
- `src/constants/demoUser.ts` — exporta `DEMO_USER_ID`
- `src/services/database.ts` — migración + métodos `linkUserToSupabase`, `getUserBySupabaseId`
- `src/context/AuthContext.tsx` — `linkToSupabase`, `dismissLinkOffer`, `offerLinkToSupabase`, guards demo
- `supabase/schema.sql` — tablas `push_tokens`, `notifications`, `event_invitations`
- `supabase/rls.sql` — RLS para las 3 nuevas tablas

---

## 📋 Instrucciones de uso

1. **Al inicio de cada sesión**: leer este archivo para retomar el contexto
2. **Durante la sesión**: agregar cada cambio realizado en la sección correspondiente
3. **Al generar el build**: copiar el contenido a `CHANGELOG.md` y limpiar este archivo
4. **Incrementar versión**: ejecutar `.\versiones.ps1`

---

## 🗺️ Roadmap — Próximas Funcionalidades (planificadas)

### P1 — Flujo de vinculación en UI
- Crear `LinkToSupabaseModal` (componente o sección en ProfileScreen)
- Usar `offerLinkToSupabase` del AuthContext para mostrar banner no-intrusivo
- Guardar preferencia "no mostrar más" via `user_preferences`

### P2 — Push Notifications
- Instalar `expo-notifications`
- Registrar token en Supabase `push_tokens` al login online
- Crear `PushNotificationService.ts` que envíe via Expo Push API
- Lanzar notificaciones en: `createExpense`, `markSettlementPaid`, evento cerrado/modificado
- Soporte Android FCM + iOS APNs (vía Expo)

### P3 — Compartir eventos y amigos
- **Local**: generar código QR / código alfanumérico con datos del evento (JSON comprimido)
- **Supabase**: usar tabla `event_invitations` — invitar por email, el invitado acepta y se agrega como participante
- Búsqueda de usuarios por email/username para invitar

### P4 — Sincronización Supabase (SupabaseSyncService)
- Implementar `SupabaseSyncService.ts` activando `CLOUD_SYNC_ENABLED = true` en `SyncFactory.ts`
- Mapeo `localUserId → supabase_user_id` en cada push
- Manejo de conflictos offline-first (strategy: 'local' | 'server')
