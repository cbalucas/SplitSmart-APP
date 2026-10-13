# Cambios Pendientes de Registrar — SplitSmart

> **Propósito:** Bitácora de trabajo en curso entre sesiones de chat.
> Registrar aquí TODOS los cambios realizados antes de generar un nuevo APK/AAB.
> Una vez generado el build, mover el contenido a `CHANGELOG.md` y vaciar este archivo.

---

## 🗂️ Versión en desarrollo: v1.10.6

> Cambios realizados después del build de v1.10.5

### 🚀 Nuevas Funcionalidades

- **Contraseñas locales protegidas con hash**: nuevo `src/utils/passwordHash.ts` (PBKDF2-HMAC-SHA256, 20.000 iteraciones, salt aleatorio, formato `pbkdf2$sha256$iter$salt$hash`; dependencia JS pura `@noble/hashes`, sin código nativo). `createUser`, `updateUserPassword` y `verifyUserPassword` (SQLite e IndexedDB) guardan/validan con hash y `AuthContext.login` valida vía `verifyUserPassword`. **Migración transparente**: las claves viejas en texto plano siguen funcionando y pasan a hash en el primer login correcto. Una contraseña vacía almacenada ya no autentica.
- **Bloqueo temporal de login por intentos fallidos**: nuevo `src/utils/loginThrottle.ts`. 5 fallos seguidos bloquean esa cuenta 30 s (por id de usuario, así no se evade alternando usuario/email; persistido en AsyncStorage). `LoginScreen` muestra un aviso en pantalla con **cuenta regresiva en vivo** y deshabilita el botón ("Iniciar Sesión (Ns)"). Textos en es/en/pt. No aplica a cuentas con `skip_password` ni a Google/biometría.

### 🔧 Correcciones de Bugs

- **Viewer (QR solo lectura) podía hacer cambios que no se reflejaban**: la UI permitía al rol `viewer` marcar liquidaciones pagadas/comprobantes, crear/editar/eliminar/asignar actividades. Esas escrituras se guardaban localmente (`sync_status='pending'`) pero RLS (settlements_update, activities_insert/update/delete = user_can_edit_event) las rechaza para viewer → nunca se reflejaban en el dueño ("hago cosas que no se ven en las actualizaciones"). Se agregó guarda `isViewerReadOnly` en handlers: `handleToggleSettlementPaid`, `handleUpdateSettlementReceipt`, `handleSaveActivity`, `handleSaveAssign`, `handleDeleteActivity`; se deshabilitó UI para viewer (SettlementItem, checkbox de asignación de actividades, botón deshacer pagos). El rol `editor` conserva la capacidad (RLS user_can_edit_event lo permite).
- **Cuenta que importa evento por QR sincronizaba solo una parte (no el evento completo)**: la fila en `event_collaborators` (requerida por RLS `user_can_access_event` para que el colaborador pueda LEER expenses/settlements/activities/participants del evento) solo se intentaba crear una vez, al momento de importar el QR (`DataContext.importSharedEvent`), y solo se reintentaba en el `push()` para colaboradores con rol `editor`. Si ese primer intento fallaba (import offline, sesión de Supabase aún no lista, error transitorio de red) el colaborador quedaba SIN registrar para siempre: el `pull()` nunca volvía a intentar el alta, por lo que el evento quedaba congelado con el snapshot inicial y jamás recibía las actualizaciones posteriores del dueño (ni las del propio colaborador `editor`, que igual necesita el registro para que sus escrituras pasen RLS). Afectaba tanto a `editor` como a `viewer` (este último nunca tenía reintento alguno). Fix: nuevos helpers `_ensureCollaboratorRegistration` (nativo) y `_ensureCollaboratorRegistrationWeb` (web) que, al inicio de CADA `pull()`, recorren los eventos locales `is_shared=1` con `share_id` y `shared_role` en (`editor`,`viewer`) y hacen upsert idempotente en `event_collaborators`. Autocura el registro fallido en cualquier sync posterior, sin esperar a un nuevo import ni a que el usuario tenga rol editor.
- **Chequeo de actualización roto**: en `UpdateService.ts` la constante `FETCH_TIMEOUT_MS` había quedado dentro de un comentario sin cerrar → `ReferenceError` capturado en silencio y la consulta a Play Store nunca funcionaba. Además `Home` leía `version` de `app.json` (que vive en `expo.version`) y pasaba `undefined`; ahora usa `Constants.expoConfig?.version`.
- **Destello azul con "OK" al cerrar cualquier alerta (incluida la de cerrar sesión)**: `CustomAlert.dismiss` reiniciaba el estado a uno vacío mientras el `Modal` aún hacía el fade-out, mostrando un instante una alerta vacía con botón OK por defecto. Ahora solo pone `visible:false` y conserva el contenido.
- **Push web podía pisar cambios más recientes de la nube**: `_pushWeb` subía todo incondicionalmente. Nueva guarda LWW `_notOlderThanRemote` (eventos, participantes, gastos, splits, liquidaciones, actividades): solo sube filas con `updated_at` local >= remoto; ante error de red mantiene el comportamiento previo. Solo afecta a web.
- **Vinculación de cuenta en web**: `IndexedDBDatabaseService` no implementaba `linkUserToSupabase` (solo SQLite); se agregó.
- **Splits de Evento Express** usaban `type: 'custom'` (valor inválido de `Split.type`); ahora `'fixed'`.
- **Traducciones y estilos**: faltaba `helpQ1` en inglés y portugués del asistente Splitty; claves duplicadas en `LanguageContext` y 6 estilos duplicados en `EventDetail/styles.ts` (se conservó la definición efectiva, sin cambio visual).
- **ManageFriends**: `FriendItem` llamaba `createStyles` sin `insets`.
- **Limpieza de datos (Perfil)**: `clearAllData(includeVersions)` ahora propaga el parámetro desde el contexto.

### ✨ Mejoras

- **Tipado limpio**: `npx tsc --noEmit` pasa de 53 errores a 0. `IDatabaseService` declara `getConsolidationAssignments`, `saveConsolidationAssignments`, `clearConsolidationAssignments` y `linkUserToSupabase`; el filtro `locked` de Home tiene su tipo; parámetros `any` explícitos en el sync; `catch (e: any)` en la importación.
- **Logs de colaboración mejorados**: `console.error` con contexto (eventId, userId, shareId, error exacto) cuando falla el registro del colaborador en `event_collaborators` (importación o push). Antes eran `console.warn` silenciosos.
- **Documentación**: `README.md` reescrito (estaba en v1.2.0 / RN 0.75 / "100% offline"); `CONTEXTO_PROYECTO.md` actualizado (sync con Realtime, hash de contraseñas, estado y deuda técnica); `VERSIONING.md` ya no fija una versión desactualizada.

### ⚠️ Pendiente de validar en dispositivo (requiere build)

- Rol `viewer`/`editor` por QR de punta a punta (`shared-collaboration.sql` ya está ejecutado en Supabase).
- Tiempo de verificación del hash de contraseña en un celular real (en PC ~90 ms).
- Cambio de contraseña desde Perfil y login posterior.
- Antes del build: completar `CHANGELOG.md` (le faltan las entradas 1.10.0–1.10.5).

### 📁 Archivos Modificados

**Nuevos**
- `src/utils/passwordHash.ts`, `src/utils/loginThrottle.ts`

**Autenticación / seguridad**
- `src/context/AuthContext.tsx`, `src/screens/Auth/LoginScreen.tsx`, `src/screens/Auth/language.ts`, `src/services/database.ts`, `src/services/IndexedDBDatabaseService.ts`, `package.json` y `package-lock.json` (+`@noble/hashes`)

**Sincronización / datos**
- `src/services/SupabaseSyncService.ts` (reintento de registro de colaborador en pull nativo y web; guarda LWW en push web; logs de colaboración; tipos)
- `src/context/DataContext.tsx` (importSharedEvent → logs mejorados; `clearAllData(includeVersions)`; tipos)
- `src/services/IDatabaseService.ts`

**Pantallas / UI**
- `src/screens/EventDetail/index.tsx` (guardas `isViewerReadOnly`), `src/screens/EventDetail/styles.ts`
- `src/screens/Home/index.tsx`, `src/screens/Home/types.ts`, `src/screens/ExpressEvent/index.tsx`, `src/screens/ExpressEvent/language.ts`, `src/screens/ManageFriends/index.tsx`, `src/screens/Auth/SignUpScreen.tsx`
- `src/components/CustomAlert/index.tsx`, `src/context/LanguageContext.tsx`, `src/services/UpdateService.ts`

**Documentación**
- `README.md`, `CONTEXTO_PROYECTO.md`, `VERSIONING.md`

---

## 📋 Instrucciones de uso

1. **Al inicio de cada sesión**: leer este archivo para retomar el contexto
2. **Durante la sesión**: agregar cada cambio realizado en la sección correspondiente
3. **Al generar el build**: copiar el contenido a `CHANGELOG.md` y limpiar este archivo
4. **Incrementar versión**: ejecutar `.\versiones.ps1`