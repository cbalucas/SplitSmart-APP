# Cambios Pendientes de Registrar — SplitSmart

> **Propósito:** Bitácora de trabajo en curso entre sesiones de chat.
> Registrar aquí TODOS los cambios realizados antes de generar un nuevo APK/AAB.
> Una vez generado el build, mover el contenido a `CHANGELOG.md` y vaciar este archivo.

---

## 🗂️ Versión en desarrollo: v1.9.2

> Cambios realizados después del build de v1.9.1

### 🚀 Nuevas Funcionalidades

- **Soporte Web (PWA) — Capa de abstracción de base de datos**
  - `src/services/IDatabaseService.ts` — Interfaz TypeScript con todas las firmas públicas de la BD (~40 métodos)
  - `src/services/DatabaseFactory.ts` — Factory que selecciona automáticamente la implementación según `Platform.OS`
  - `src/services/IndexedDBDatabaseService.ts` — Implementación completa para web usando IndexedDB (via `idb`)
  - En móvil (iOS/Android) sigue usando `expo-sqlite` sin ningún cambio
  - En browser usa IndexedDB: mismo schema (11 object stores), misma lógica de negocio, mismos algoritmos de liquidación
- **Botón Atrás en versión web** — Todas las pantallas de la app web muestran un botón "‹" para volver a la pantalla anterior, igual a como funciona en el celular
- **Compartir por WhatsApp Web** — Al tocar "Compartir" en el resumen de un evento, en la versión web se abre WhatsApp Web en lugar del link de app móvil
- **PWA instalable** — La versión web puede instalarse en el escritorio o en el celular como si fuera una app nativa (ícono, pantalla completa, sin barra del navegador)
- **Amigo vinculado al perfil** — Al entrar al perfil, si no tenés un amigo creado con tus datos, la app te ofrece crearlo automáticamente. Así los demás usuarios pueden agregarte a eventos desde la lista de amigos
- **Notificación automática de actualización** — La app ahora consulta directamente el Play Store para saber si hay una versión más nueva disponible y te avisa al iniciar la sesión

### 🔧 Correcciones de Bugs

- **Notificación de nueva versión no aparecía** — El aviso de "hay una versión nueva" se mostraba antes de que la pantalla de notificaciones estuviese lista, por lo que se perdía silenciosamente. Ahora se espera a que el splash termine antes de mostrar el aviso
- **Cámara en web abría selector de archivos** — En la versión web, tomar foto abría el explorador de archivos en lugar de la cámara. Ahora la opción "Foto" se oculta en web y solo aparece "Galería"
- **Fotos y galería en Perfil y Amigos (web)** — Corregido el flujo de selección de imagen en ambas pantallas para que funcione correctamente en el navegador

### ✨ Mejoras

- **Nombres de participantes con mayúscula** — Los participantes generados por Splitty (el asistente de voz/texto) ahora aparecen con la primera letra en mayúscula
- **Sincronización de datos Perfil ↔ Amigo vinculado** — Si editás tus datos en el Perfil (nombre, teléfono, alias/CBU, foto), esos cambios también se actualizan en tu amigo vinculado. Y viceversa: si alguien edita el amigo que representa tu perfil, el perfil también se actualiza
- **latest-version.json se actualiza automáticamente** — Al ejecutar `versiones.ps1` para incrementar la versión, el archivo `latest-version.json` también se actualiza solo, sin necesidad de editarlo a mano
- **Detección de versión directamente desde Play Store** — En lugar de depender solo del archivo JSON en GitHub, la app ahora consulta la página del Play Store en tiempo real para obtener la versión publicada más reciente

### 📁 Archivos Modificados

- `src/services/database.ts` — Agrega `implements IDatabaseService`; exporta clase `DatabaseService`
- `src/services/IDatabaseService.ts` — Interfaz completa de la BD
- `src/services/DatabaseFactory.ts` — Factory web/nativo
- `src/services/IndexedDBDatabaseService.ts` — Implementación IndexedDB para web (métodos de consolidación incluidos)
- `src/services/UpdateService.ts` — Consulta Play Store en nativo; fallback a GitHub JSON; fix timing del alert
- `src/context/DataContext.tsx` — Import desde DatabaseFactory; agrega `getParticipantByUserId`
- `src/screens/ProfileScreen/index.tsx` — Botón atrás web; fix cámara web; verificación amigo vinculado al entrar
- `src/screens/ManageFriends/index.tsx` — Botón atrás web; fix cámara web; sincronización al perfil al editar amigo vinculado
- `src/screens/EventDetail/index.tsx` — Botón atrás web; WhatsApp Web URL
- `src/screens/CreateEvent/index.tsx` — Botón atrás web
- `src/screens/CreateExpense/index.tsx` — Botón atrás web
- `src/screens/ExpressEvent/index.tsx` — Botón atrás web; capitalización de nombres Splitty
- `src/components/HeaderBar.tsx` — Auto-detección de historial para botón atrás en web
- `src/components/AddParticipantModal/index.tsx` — Botón atrás web
- `src/components/ConsolidationModal/index.tsx` — Botón atrás web
- `src/components/CustomAlert/index.tsx` — Layout vertical cuando algún botón tiene ícono
- `src/localization/es.json` + `en.json` — Textos "Acerca de" actualizados
- `app.json` — Config web PWA completa
- `versiones.ps1` — Actualización automática de `latest-version.json`
- `latest-version.json` — Mantenido en sync con la versión publicada
- `web/manifest.json` — Manifiesto PWA
- `web/index.html` — HTML base con meta tags Apple, registro del service worker
- `web/sw.js` — Service worker con estrategia network-first y caché offline
- `App.tsx` — Fix: `checkForUpdate` se lanza después del splash

### 📦 Dependencias Instaladas

| Paquete | Versión | Propósito |
|---|---|---|
| `react-native-web` | latest | Render de RN en browsers |
| `react-dom` | latest | Requerido por react-native-web |
| `@expo/webpack-config` | latest | Bundler web |
| `idb` | latest | Wrapper Promise sobre IndexedDB |

---

## 📋 Instrucciones de uso

1. **Al inicio de cada sesión**: leer este archivo para retomar el contexto
2. **Durante la sesión**: agregar cada cambio realizado en la sección correspondiente
3. **Al generar el build**: copiar el contenido a `CHANGELOG.md` y limpiar este archivo
4. **Incrementar versión**: ejecutar `.\versiones.ps1`

---

## 🔭 Hoja de Ruta — v2.0: Backend + Sincronización + Eventos Colaborativos

> **Estado**: Planificado. Prioridad BAJA — los bugs de v1.9.x tienen prioridad.
> Retomar este plan una vez estabilizada la versión actual.

### Resumen ejecutivo

Migrar SplitSmart de offline-only a arquitectura cloud-first con **Supabase** (PostgreSQL + Auth + Realtime + Storage, región São Paulo). La DB local SQLite se mantiene como caché offline. Los eventos personales siguen 100% offline; los eventos marcados como "Compartir" se sincronizan en la nube y permiten colaboración en tiempo real entre usuarios registrados.

**Stack elegido:** Supabase BaaS · Cuenta obligatoria para colaborar · Toggle "Compartir" nuevo (no reemplaza público/privado)

---

### Arquitectura

```
[Dispositivo A]              [Supabase — sa-east-1]         [Dispositivo B]
SQLite local ←──SyncService──→  PostgreSQL + Auth          SQLite local (caché)
                             ←──Realtime WebSocket──────→
                             ←──Storage (comprobantes)──→
```

**Regla de oro:** eventos `isShared = false` → 100% offline sin cambios. Eventos `isShared = true` → fuente de verdad en Supabase; SQLite como caché; WebSocket para sync en tiempo real.

---

### Fases de implementación

#### Fase 1 — Infraestructura Supabase + Schema PostgreSQL
- Crear proyecto Supabase en `sa-east-1`. Obtener `SUPABASE_URL` y `SUPABASE_ANON_KEY`
- Tablas en PostgreSQL: `profiles`, `events` (+ `is_shared`, `share_token`, `is_open`, `owner_id`), `event_members` (NUEVA: roles owner/admin/collaborator/viewer), `participants`, `expenses`, `expense_payers`, `splits`, `settlements`, `notifications` (NUEVA)
- Configurar **Row Level Security (RLS)**: lectura de evento solo si `owner_id = auth.uid()` OR miembro en `event_members`; escritura solo si role IN ('owner','admin','collaborator') AND `is_open = true`
- Migraciones SQLite local (en `database.ts`): columnas `is_shared`, `share_token`, `is_open`, `supabase_synced` en tabla `events`; tablas nuevas `event_members` y `notifications`
- Crear `src/config/supabase.ts` + `.env` con keys (agregar a `.gitignore`)

#### Fase 2 — Autenticación Cloud
- Instalar `@supabase/supabase-js` + `expo-secure-store` (para persistir JWT)
- Crear `src/services/SupabaseService.ts`: `signUp()`, `signIn()`, `signOut()`, `getSession()`, `onAuthStateChange()`
- Actualizar `AuthContext.tsx`: estado `cloudSession` + `isCloudLinked`; login intenta Supabase primero, cae a local como fallback (compatibilidad v1.x)
- Actualizar `LoginScreen.tsx` y `SignUpScreen.tsx` para cloud auth
- Migración no destructiva: usuarios v1.x ven banner "Vinculá tu cuenta" en ProfileScreen — no bloqueante

#### Fase 3 — Capa de Sincronización (SyncService)
- Crear `src/services/SyncService.ts`: `uploadEvent()`, `downloadSharedEvents()`, `syncEventBidirectional()`, `processOfflineQueue()`, `watchEvent()`
- Cola offline en `AsyncStorage`: `OfflineOperation { id, type, entity, entityId, eventId, data, timestamp, attempts }`; máx 3 reintentos; conflictos resueltos por `updated_at` (last-write-wins)
- Crear `src/context/SyncContext.tsx`: expone `isSyncing`, `lastSyncAt`, `syncError`, `pendingOperations`, `isOnline`
- Detectar conectividad con `@react-native-community/netinfo`
- IDs locales (timestamp_nanoid) → mapeo a UUIDs Supabase en tabla `sync_id_map` en SQLite

#### Fase 4 — Sistema de Tokens + Deep Links
- Crear `src/services/ShareTokenService.ts`: `generateToken()` → `nanoid(10)`, `createShareLink()` → `splitsmart://join/{token}`, `validateToken()`
- Agregar `"scheme": "splitsmart"` en `app.json` + `intentFilters` Android
- Nueva pantalla `src/screens/EventShare/index.tsx`: QR code (`react-native-qrcode-svg`), copiar link, compartir vía `expo-sharing`, toggle "Evento abierto", lista de colaboradores, botón "Invalidar token"
- Nueva pantalla `src/screens/JoinEvent/index.tsx`: preview del evento (sin auth), prompt registro si no tiene cuenta, botón "Unirme" → crea `event_members`
- Deep link handler en `navigation/index.tsx`: `splitsmart://join/{token}` → navegar a `JoinEvent` (o Login si no autenticado)

#### Fase 5 — Colaboración Real-time + Notificaciones
- Supabase Realtime en canal `event:{eventId}`: escucha cambios en `expenses`, `participants`, `event_members`; actualiza SQLite local + dispara `refreshData()`
- Indicador "● En vivo" en EventDetail cuando canal conectado
- Nueva función `canEdit(eventId)` en DataContext: true si role IN ('owner','admin','collaborator') AND `is_open = true`
- Nueva pantalla `src/screens/EventCollaborators/index.tsx`: lista miembros, cambiar roles, remover, transferir ownership
- Notificaciones in-app: tabla `notifications` + Realtime subscription; tipos: 'joined', 'expense_added', 'settlement_paid', 'event_closed'
- Nueva pantalla `src/screens/Notifications/index.tsx` + badge contador en HeaderBar de Home

#### Fase 6 — Cambios de UI/UX
- `CreateEvent`: en sección "Privacidad" agregar toggle "Compartir con otros usuarios" (`isShared`) + toggle secundario "Evento abierto" (`isOpen`)
- `EventDetail`: botón "Compartir" en HeaderBar, nueva tab "Colaboradores" (si `isShared = true`), indicador sync ☁️/⏳/❌, nombre del autor en gastos de colaboradores
- `HomeScreen`: nueva sección "Eventos compartidos" (eventos donde el usuario es colaborador, no owner)
- `ProfileScreen`: nueva sección "Cuenta Cloud" — vincular/desvincular, estado sync, botón "Sincronizar ahora"

#### Fase 7 — Autenticación Biométrica (Huella Digital / Face ID)

> **Prerrequisitos:** Fase 2 completada (auth context ya actualizado). Se puede implementar en paralelo con Fase 3+.

**Contexto:** `expo-local-authentication` v17 y `expo-secure-store` v15 ya están instalados. Permisos `USE_FINGERPRINT` y `USE_BIOMETRIC` ya declarados en `app.json`. Traducciones ya existen en es/en/pt. Solo falta conectar la lógica.

- `src/services/database.ts`: migración `ALTER TABLE users ADD COLUMN biometric_enabled INTEGER DEFAULT 0` (mismo patrón que `skip_password`); agregar columna en `CREATE TABLE users`; agregar método `toggleBiometricLogin(userId, enabled)` — espejo de `toggleAutoLogin`
- Crear `src/services/BiometricService.ts`: `isAvailable()` → `hasHardwareAsync() && isEnrolledAsync()`; `authenticate(promptMessage)` → `authenticateAsync()`; `saveUserId()` / `getSavedUserId()` / `clearUserId()` via `SecureStore` (cifrado)
- `src/types/index.ts`: agregar `biometricEnabled?: boolean` a interface `User`
- `src/context/AuthContext.tsx`: nuevos valores `biometricAvailable`, `biometricLoginEnabled`; métodos `biometricLogin()` (SecureStore → BD → autenticar → setUser) y `toggleBiometricLogin(enabled)` (al activar: exige huella primero para confirmar → guarda en BD + SecureStore; al desactivar: limpia BD + SecureStore); actualizar mapeo `User` en `login()`, `refreshUser()` y `autoLoginIfEnabled()`
- `src/screens/ProfileScreen/index.tsx`: mover ítem "Ingreso Biométrico" de sección "Próximamente" a sección de seguridad; reemplazar badge por `Switch` funcional; si `!biometricAvailable` mostrar chip "No disponible" en lugar del switch
- `src/screens/Auth/LoginScreen.tsx`: mostrar botón de huella digital solo si `biometricAvailable && biometricLoginEnabled`; llama `biometricLogin()` y navega a Home si tiene éxito
- `src/screens/Auth/language.ts`: agregar claves `biometricButton` y `biometricError` en es/en/pt
- `src/context/LanguageContext.tsx`: actualizar `profile.biometricLoginDesc` de "Próximamente" a descripción real; agregar `profile.biometricNotAvailable` en los 3 idiomas

**Impacto en usuarios existentes:** cero — la migración aplica `DEFAULT 0` a todas las filas. Nadie ve el botón de huella hasta activarlo manualmente.

**Decisión de seguridad:** el `userId` se guarda en `SecureStore` (cifrado por el SO), no en SQLite ni AsyncStorage. Para activar biometría el usuario debe confirmar con su huella primero — no se puede activar accidentalmente.

---

### Dependencias nuevas (v2.0)

| Paquete | Propósito |
|---|---|
| `@supabase/supabase-js` | Cliente Supabase |
| `@react-native-community/netinfo` | Detectar conectividad |
| `react-native-qrcode-svg` | Generar QR code |
| `nanoid` | Generar shareTokens |
| `expo-clipboard` | Copiar link al portapapeles |

> `expo-local-authentication` y `expo-secure-store` ya están instalados desde v1.x.

---

### Archivos nuevos (v2.0)
- `src/config/supabase.ts`
- `src/services/SupabaseService.ts`
- `src/services/SyncService.ts`
- `src/services/ShareTokenService.ts`
- `src/services/BiometricService.ts`
- `src/context/SyncContext.tsx`
- `src/screens/JoinEvent/index.tsx`
- `src/screens/EventShare/index.tsx`
- `src/screens/EventCollaborators/index.tsx`
- `src/screens/Notifications/index.tsx`

### Archivos modificados (v2.0)
- `src/types/index.ts` — tipos `Event` (is_shared, share_token, is_open) + `EventMember` + `Notification`
- `src/types/navigation.ts` — rutas: `JoinEvent`, `EventShare`, `EventCollaborators`, `Notifications`
- `src/services/database.ts` — migraciones nuevas
- `src/context/AuthContext.tsx` — cloud auth + cloudSession
- `src/context/DataContext.tsx` — sync methods + canEdit()
- `src/navigation/index.tsx` — pantallas nuevas + deep link listener
- `src/screens/CreateEvent/index.tsx` — toggle isShared + isOpen
- `src/screens/EventDetail/index.tsx` — tab colaboradores + share btn + sync indicator
- `src/screens/Home/index.tsx` — sección eventos compartidos
- `src/screens/Auth/LoginScreen.tsx` — cloud auth + botón biométrico
- `src/screens/Auth/SignUpScreen.tsx` — cloud registration
- `src/screens/ProfileScreen/index.tsx` — cloud account section + switch biométrico
- `app.json` — scheme + intentFilters

---

### Notas técnicas críticas (v2.0)
- **Migración usuarios v1.x**: no destructiva. Banner no bloqueante en ProfileScreen. El usuario puede seguir sin cuenta cloud — solo pierde acceso a "Compartir".
- **IDs locales vs cloud**: tabla `sync_id_map` en SQLite resuelve timestamp_nanoid → UUID de Supabase.
- **Imágenes de comprobantes**: al activar "Compartir", imágenes locales se suben a Supabase Storage y la URL se actualiza en BD.
- **Seguridad del token**: shareToken da preview sin auth; el join siempre requiere autenticación. El owner puede invalidar el token en cualquier momento.
- **Expenses append-only**: en Supabase los gastos nunca se modifican, se crean nuevos marcando el anterior como `is_deleted`. Evita conflictos de escritura concurrente.

### Fuera de scope v2.0 (v2.1+)
- Soporte web (React Native Web)
- Login social (Google, Apple)
- Notificaciones push (Expo Push + Edge Functions)
- Evento "público" descubrible por todos
- Modo invitado (sin cuenta)
- Pagos reales integrados
