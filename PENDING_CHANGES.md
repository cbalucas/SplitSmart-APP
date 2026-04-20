# Cambios Pendientes de Registrar — SplitSmart

> **Propósito:** Bitácora de trabajo en curso entre sesiones de chat.
> Registrar aquí TODOS los cambios realizados antes de generar un nuevo APK/AAB.
> Una vez generado el build, mover el contenido a `CHANGELOG.md` y vaciar este archivo.

---

## 🗂️ Versión en desarrollo: v1.9.1

> Cambios realizados después del build de v1.9.0
> Commits locales: `b1c0a73` → `e9f1613` (7 commits, no pusheados a origin)

---

### 🚀 Nuevas Funcionalidades

#### CreateEvent — Rediseño completo de UI (commit `e9f1613`)
- **Layout de 2 cards** en lugar de las 4 anteriores, usando el mismo design language que ProfileScreen (borde de color en el top, header con ícono + título)
- **Card 1 — Información** (borde azul `#2196F3`, ícono `calendar-edit`): agrupa Nombre, Fecha, Ubicación y Descripción en un único bloque visual
- **Campo Ubicación**: nuevo `rightIcon="map-search-outline"` que aparece solo cuando hay texto — al presionarlo abre Google Maps vía `Linking.openURL()` con la dirección codificada
- **Card 2 — Opciones** (borde naranja `#FF9800`, ícono `cog-outline`): colapsable/expandible con `TouchableOpacity` en el header y animación de chevron
  - **Contraída**: muestra 3 chips resumen — `[🇦🇷 ARS]` · `[🌐 Público / 🔒 Privado]` · `[✈️ Categoría]` — cada uno con ícono, texto y color semántico
  - **Expandida — fila superior**: cards cíclicas estilo ProfileScreen — Card Moneda (cicla ARS→USD→EUR→BRL al tap) + Card Tipo (alterna Público↔Privado al tap)
  - **Expandida — fila inferior**: pills de categoría en `flexWrap` (Viaje, Casa, Cena, Trabajo, Evento, Otro)
- **Card Compartir**: preparada y oculta via `const SHOW_SHARE_CARD = false` — activar cuando la funcionalidad esté lista; se integra automáticamente en la fila de cards expandidas y en los chips contraídos
- **TutorialOverlay actualizado**: reducido de 4 pasos a 2 (uno por card); textos actualizados en ES, EN y PT para describir el nuevo layout
- **Helper `getCategoryLabel()`**: mapea el key interno de categoría al texto traducido para los chips contraídos

#### ProfileScreen — Rediseño completo de UI
- **Sistema de cards unificado**: todas las secciones usan `infoNavCard` (grid 2 col, altura 82 px, borde superior de color) y `statCardWide` (fila completa, borde izquierdo de color), consistentes con el design language de la app
- **Estadísticas — card Amigos**: color `#9C27B0` → `#E91E63`
- **Información Personal (vista)**: grid de 2 cards — Nombre `#4CAF50` + Usuario `#2196F3` en fila; Email `#FF9800` y Teléfono `#9C27B0` como `statCardWide`
- **Seguridad**: fila de 2 `infoNavCard` — Cambiar Contraseña `#E91E63` (sin texto de contraseña `••••••••`) + Omitir Contraseña con indicador `ACTIVO`/`DESACTIVADO` y borde dinámico
- **Preferencias**: todas las cards con wrapper `height:82` explícito; Auto Login como `statCardWide` con `ACTIVADO`/`DESACTIVADO` + subtítulo descriptivo
- **Sección Error Guide**: rediseñada como grid 4×2 de `infoNavCard` (8 pantallas); un único `Modal` reutilizable muestra la lista de errores de la pantalla seleccionada con `ScrollView`
- **Sección Próximamente**: rediseñada con 3 `statCardWide` (Notificaciones de Pago `#4CAF50` · Login Biométrico `#9C27B0` · Compartir Evento `#2196F3`) y ícono `rocket-launch` a la derecha como indicador visual

#### HeaderBar — Menú overflow rediseñado
- **Dropdown con borde de color**: el menú kebab (`⋮`) ahora despliega un dropdown posicionado debajo del header (`top: insets.top + 56 + 4, right: 8`) con ítems tipo `sheetItem` — cada uno con `borderLeftWidth:4` y color semántico:
  - Modo claro/oscuro → `#FF9800` naranja
  - Idioma → `#2196F3` azul
  - Ayuda → `#4CAF50` verde
  - Acciones custom (`overflowBeforeItems` / `overflowAfterItems`) → `#9C27B0` violeta / `#607D8B` gris
  - Cerrar sesión → `#F44336` rojo (con separador visual)
- **Overlay más oscuro** (`rgba(0,0,0,0.2)`) y sombra mejorada (`elevation:10`)
- Propagación automática a todas las pantallas que usan `HeaderBar` con overflow activo (Home, EventDetail, CreateEvent, CreateExpense, ProfileScreen, ManageFriends, SignUp)

#### CustomAlert — Modal de acción
- **Soporte de íconos en botones**: nueva prop `icon?: string` en `AlertButton` — muestra un `MaterialCommunityIcons` a la izquierda del texto del botón
- **Nuevo layout para 2+ botones regulares**: modo columna con botones destructivos y cancelar en filas separadas (Eliminar fila completa roja + Cancelar fila completa gris al final)
- **Separación entre botones**: `gap:8` en `buttonsColumn`

#### Modal cambio de imagen de perfil
- Botones rediseñados con íconos: `📷 Foto` · `🖼 Galería` · `🗑 Eliminar` · `Cancelar`
- Tipo de alert cambiado a `'info'` (borde azul) en lugar de `'destructive'` (rojo)

---

### 🔧 Correcciones de Bugs

- **Íconos `earth-outline` / `lock-outline` no existen en MaterialCommunityIcons** (chips contraídos de CreateEvent): aparecía `?` en lugar del ícono. Fix: reemplazados por `earth` y `lock` (variantes sólidas que sí existen en el set)
- **Color del candado inconsistente**: en los chips contraídos el ícono 🔒 era rojo `#F44336`; en las cards expandidas era amarillo `#FFC107`. Unificado a `#FFC107` en ambos contextos
- **Cards de altura desigual (Preferencias)**: `alignItems:'stretch'` de Yoga/RN estiraba las cards sin altura explícita. Fix: wrapper `<View style={{ flex:1, height:82 }}>` en todas las cards de grilla + `overflow:'hidden'` en `infoNavCard`
- **Card Tema sin wrapper**: era un `TouchableOpacity` directo sin wrapper de altura. Corregido con el mismo patrón que las otras cards
- **`flex:1` inline en Cierre Aut.**: estaba en el `infoNavCard` en vez del wrapper. Movido al `<View>` contenedor
- **Traducciones no actualizadas en runtime**: la fuente de verdad de i18n es `LanguageContext.tsx`, no los archivos `.json`. Claves `autoLogout` y `currency` corregidas directamente en el contexto
- **Emojis corruptos (`?`) en títulos de alertas de éxito** (`ProfileScreen`): 4 alertas de éxito tenían `? ${t('success')}` en lugar de `✅ ${t('success')}` por pérdida de encoding del emoji al editar el archivo
- **Tipo de alert incorrecto en mensajes de éxito**: `type:'error'` (rojo) en "Contraseña actualizada" y "Omitir contraseña actualizada" — corregido a `type:'success'` (verde) + emoji `✅`
- **Botón Eliminar foto no funcionaba**: `updateUserProfile(user.id, { avatar: undefined })` no ejecutaba el UPDATE en la DB porque la condición `updates.avatar !== undefined` era `false`. Fix: pasar `{ avatar: null }` — la firma de `updateUserProfile` actualizada a `avatar?: string | null`
- **Botón fuera del recuadro en `CustomAlert` con 3+ botones**: `flex:1` en modo columna sin altura fija en el padre causaba desborde. Fix: `btnColumnItem` con `flex:0, alignSelf:'stretch'`
- **`} extra` en JSX de `SignUpScreen`**: comentario `{/* ... */}}` con `}` extra se renderizaba como string literal, disparando "Text strings must be rendered within a `<Text>` component" al navegar a Crear Cuenta
- **`SyntaxError` en `HeaderBar.tsx`**: `onPress={() => {}>` le faltaba un `}` para cerrar la función flecha. Corregido a `onPress={() => {}}}>`

---

### ✨ Mejoras

- **Chips contraídos de Opciones más grandes y con texto**: padding `8×4` → `10×6`, font `12` → `13 bold`, ícono `14` → `16`; ahora muestran el label además del ícono (moneda: código + flag; tipo: "Público"/"Privado" con color semántico; categoría: nombre con color semántico)
- **Reorden del contenido expandido**: Moneda + Tipo (cards cíclicas) aparecen primero; Categoría (pills) aparece debajo — flujo más natural al configurar el evento
- **Título de Card 2**: renombrado de "Preferencias" → "Opciones" en los 3 idiomas (ES: `Opciones`, EN: `Options`, PT: `Opções`)
- **Chip de Compartir en chips contraídos**: cuando `SHOW_SHARE_CARD = true`, aparece un chip `[share Compartir]` entre Tipo y Categoría — preparado para la futura funcionalidad
- **Separación visual entre HeaderBar y primera card**: `paddingTop:16` en `scrollViewContent` para evitar que el contenido quede pegado al header
- **Textos del TutorialOverlay actualizados** (`LanguageContext.tsx`):
  - Paso 1: describe los 4 campos de la Card Información (nombre, fecha, ubicación, descripción)
  - Paso 2: explica que se puede expandir la sección Opciones y qué se configura (moneda, tipo, categoría)
- **Etiquetas de Preferencias abreviadas** (`LanguageContext.tsx` + `localization/*.json`):
  - `"Moneda Preferida"` → `"Moneda"` / `"Preferred Currency"` → `"Currency"`
  - `"Cierre Automático"` → `"Cierre Aut."` / `"Auto Logout"` → `"Auto Close"`
  - `"5 minutos"` → `"5 min."` / `"15 minutos"` → `"15 min."` / `"30 minutos"` → `"30 min."`
- **`numberOfLines={1}`** en todos los labels de valor de cards para evitar desbordamiento
- **`MaterialCommunityIcons` importado en `CustomAlert`** para soporte nativo de íconos en botones

---

### 📁 Archivos Modificados

| Archivo | Cambios |
|---|---|
| `src/screens/CreateEvent/index.tsx` | Rediseño completo: 2 cards, ubicación con Maps, chips contraídos, cards cíclicas, SHOW_SHARE_CARD, getCategoryLabel |
| `src/screens/CreateEvent/styles.ts` | Nuevos estilos: `cardInfo`, `cardConfig`, `cardHeaderRow`, `cardHeaderTitle`, `scrollViewContent`, `configSummaryRow`, `configSummaryChip`, `configSummaryText`, `configSummaryFlag`, `prefGrid`, `prefCard`, `prefCardTitle` |
| `src/screens/CreateEvent/language.ts` | Títulos actualizados (ES/EN/PT): `basicInformation` → "Información/Information/Informações"; `financialConfiguration` → "Opciones/Options/Opções" |
| `src/context/LanguageContext.tsx` | Tour CreateEvent (ES/EN/PT): paso 1 "Información del evento", paso 2 "Opciones" con textos del nuevo layout; claves `dates` y `privacy` conservadas por compatibilidad |
| `src/screens/ProfileScreen/index.tsx` | Rediseño completo: Error Guide grid+modal, Próximamente statCardWide, corrección emojis y tipos de alert |
| `src/screens/ProfileScreen/styles.ts` | `infoNavCard`: `overflow:'hidden'`; nuevos estilos `statsGrid`, `infoNavCardTitle`, etc. |
| `src/screens/ProfileScreen/types.ts` | Ajustes de tipos |
| `src/components/CustomAlert/index.tsx` | Soporte `icon` en botones, layout columna corregido, `MaterialCommunityIcons` importado |
| `src/components/HeaderBar.tsx` | Menú overflow rediseñado: dropdown con borde de color por ítem, posición bajo header |
| `src/services/alertService.ts` | `AlertButton.icon?: string` agregado |
| `src/services/database.ts` | `updateUserProfile`: `avatar?: string \| null`; fix columna `is_locked` |
| `src/screens/Auth/SignUpScreen.tsx` | Fix `}` extra en JSX (bug preexistente) |
| `src/screens/EventDetail/index.tsx` | Ajustes menores |
| `src/localization/es.json` | Claves Preferencias abreviadas (coherencia, no usado en runtime) |
| `src/localization/en.json` | Ídem |

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

#### Fase 6 — Cambios de UI/UX
- `CreateEvent`: en sección "Privacidad" agregar toggle "Compartir con otros usuarios" (`isShared`) + toggle secundario "Evento abierto" (`isOpen`)
- `EventDetail`: botón "Compartir" en HeaderBar, nueva tab "Colaboradores" (si `isShared = true`), indicador sync ☁️/⏳/❌, nombre del autor en gastos de colaboradores
- `HomeScreen`: nueva sección "Eventos compartidos" (eventos donde el usuario es colaborador, no owner)
- `ProfileScreen`: nueva sección "Cuenta Cloud" — vincular/desvincular, estado sync, botón "Sincronizar ahora"

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
