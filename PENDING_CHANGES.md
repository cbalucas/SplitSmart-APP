# Cambios Pendientes de Registrar — SplitSmart

> **Propósito:** Bitácora de trabajo en curso entre sesiones de chat.
> Registrar aquí TODOS los cambios realizados antes de generar un nuevo APK/AAB.
> Una vez generado el build, mover el contenido a `CHANGELOG.md` y vaciar este archivo.

---

## 🗂️ Versión en desarrollo: v1.10.6

> Cambios realizados después del build de v1.10.5

### 🚀 Nuevas Funcionalidades

_(ninguna aún)_

### 🔧 Correcciones de Bugs

- **Viewer (QR solo lectura) podía hacer cambios que no se reflejaban**: la UI permitía al rol `viewer` marcar liquidaciones pagadas/comprobantes, crear/editar/eliminar/asignar actividades. Esas escrituras se guardaban localmente (`sync_status='pending'`) pero RLS (settlements_update, activities_insert/update/delete = user_can_edit_event) las rechaza para viewer → nunca se reflejaban en el dueño ("hago cosas que no se ven en las actualizaciones"). Se agregó guarda `isViewerReadOnly` en handlers: `handleToggleSettlementPaid`, `handleUpdateSettlementReceipt`, `handleSaveActivity`, `handleSaveAssign`, `handleDeleteActivity`; se deshabilitó UI para viewer (SettlementItem, checkbox de asignación de actividades, botón deshacer pagos). El rol `editor` conserva la capacidad (RLS user_can_edit_event lo permite).
- **Cuenta que importa evento por QR sincronizaba solo una parte (no el evento completo)**: la fila en `event_collaborators` (requerida por RLS `user_can_access_event` para que el colaborador pueda LEER expenses/settlements/activities/participants del evento) solo se intentaba crear una vez, al momento de importar el QR (`DataContext.importSharedEvent`), y solo se reintentaba en el `push()` para colaboradores con rol `editor`. Si ese primer intento fallaba (import offline, sesión de Supabase aún no lista, error transitorio de red) el colaborador quedaba SIN registrar para siempre: el `pull()` nunca volvía a intentar el alta, por lo que el evento quedaba congelado con el snapshot inicial y jamás recibía las actualizaciones posteriores del dueño (ni las del propio colaborador `editor`, que igual necesita el registro para que sus escrituras pasen RLS). Afectaba tanto a `editor` como a `viewer` (este último nunca tenía reintento alguno). Fix: nuevos helpers `_ensureCollaboratorRegistration` (nativo) y `_ensureCollaboratorRegistrationWeb` (web) que, al inicio de CADA `pull()`, recorren los eventos locales `is_shared=1` con `share_id` y `shared_role` en (`editor`,`viewer`) y hacen upsert idempotente en `event_collaborators`. Autocura el registro fallido en cualquier sync posterior, sin esperar a un nuevo import ni a que el usuario tenga rol editor.
- **Chequeo de actualización roto**: en `UpdateService.ts` la constante `FETCH_TIMEOUT_MS` había quedado dentro de un comentario sin cerrar → `ReferenceError` capturado en silencio y la consulta a Play Store nunca funcionaba. Además `Home` leía `version` de `app.json` (que vive en `expo.version`) y pasaba `undefined`; ahora usa `Constants.expoConfig?.version`.
- **Vinculación de cuenta en web**: `IndexedDBDatabaseService` no implementaba `linkUserToSupabase` (solo SQLite); se agregó.
- **Splits de Evento Express**: usaban `type: 'custom'` (valor inválido de `Split.type`); ahora `'fixed'`.
- **Traducciones**: faltaba `helpQ1` en inglés y portugués del asistente Splitty; claves duplicadas en `LanguageContext` y 6 estilos duplicados en `EventDetail/styles.ts` (se conservó la definición efectiva, sin cambio visual).
- **ManageFriends**: `FriendItem` llamaba `createStyles` sin `insets`.
- **Limpieza de datos (Perfil)**: `clearAllData(includeVersions)` ahora propaga el parámetro desde el contexto.
- **Push web podía pisar cambios más recientes de la nube**: `_pushWeb` subía todo incondicionalmente. Se agregó la guarda LWW `_notOlderThanRemote` (eventos, participantes, gastos, splits, liquidaciones, actividades): solo se suben filas con `updated_at` local >= remoto; ante error de red mantiene el comportamiento previo. Solo afecta a web.
- **Destello azul con "OK" al cerrar cualquier alerta (incluida la de cerrar sesión)**: `CustomAlert.dismiss` reiniciaba el estado a uno vacío mientras el `Modal` aún hacía el fade-out, mostrando un instante una alerta vacía azul con botón OK por defecto. Ahora solo pone `visible:false` y conserva el contenido.
- **Bloqueo de login sin cuenta regresiva**: el aviso de espera era un alert estático. Ahora `LoginScreen` muestra un aviso en pantalla con cuenta regresiva en vivo y deshabilita el botón ("Iniciar Sesión (Ns)") hasta que termina.
- **Tipos**: `tsc --noEmit` pasa de 53 errores a 0 (`IDatabaseService` declara las funciones de consolidación y `linkUserToSupabase`; tipo de filtro `locked` en Home; parámetros `any` explícitos en sync; `catch (e: any)` en import).

### 🔒 Seguridad

- **Contraseñas locales con hash**: nuevo `src/utils/passwordHash.ts` (PBKDF2-HMAC-SHA256, 20.000 iteraciones, salt aleatorio, formato `pbkdf2$sha256$iter$salt$hash`; usa la dependencia JS pura `@noble/hashes`, sin código nativo). `createUser`, `updateUserPassword` y `verifyUserPassword` (SQLite e IndexedDB) guardan/validan con hash. `AuthContext.login` ahora valida vía `verifyUserPassword`.
- **Migración transparente**: las contraseñas viejas en texto plano siguen funcionando y se convierten a hash en el primer login correcto. Una contraseña vacía almacenada ya no autentica.
- **Bloqueo por intentos fallidos**: nuevo `src/utils/loginThrottle.ts`. 5 fallos seguidos bloquean el login de esa cuenta 30 s (por id de usuario, persistido en AsyncStorage); `LoginScreen` muestra el aviso con los segundos restantes (es/en/pt). No aplica a cuentas con `skip_password` ni a Google/biometría.

### ✨ Mejoras

- **Logs de colaboración mejorados**: agregados logs `console.error` más informativos cuando falla el registro del colaborador en `event_collaborators` (importación o push). Esto ayuda a diagnosticar por qué las ediciones de un rol `editor` por QR no propagan. Logs con contexto: eventId, userId, shareId, error exacto. Antes eran `console.warn` silenciosos.

### 📁 Archivos Modificados

- Seguridad de contraseñas: `utils/passwordHash.ts` (nuevo), `utils/loginThrottle.ts` (nuevo), `database.ts`, `IndexedDBDatabaseService.ts`, `AuthContext.tsx`, `Auth/LoginScreen.tsx`, `Auth/language.ts`, `components/CustomAlert/index.tsx`, `package.json` (+`@noble/hashes`)

- Paso de limpieza de tipos/bugs: `UpdateService.ts`, `Home/{index,types}`, `IDatabaseService.ts`, `IndexedDBDatabaseService.ts`, `LanguageContext.tsx`, `EventDetail/styles.ts`, `ExpressEvent/{index,language}`, `ManageFriends/index.tsx`, `SignUpScreen.tsx`, `SupabaseSyncService.ts`, `DataContext.tsx`

- `src/screens/EventDetail/index.tsx` (handlers de liquidaciones y actividades)
- `src/context/DataContext.tsx` (importSharedEvent → logs mejorados)
- `src/services/SupabaseSyncService.ts` (push de event_collaborators → logs mejorados; nuevo reintento de registro de colaborador en pull nativo y web)

---

## 📋 Instrucciones de uso

1. **Al inicio de cada sesión**: leer este archivo para retomar el contexto
2. **Durante la sesión**: agregar cada cambio realizado en la sección correspondiente
3. **Al generar el build**: copiar el contenido a `CHANGELOG.md` y limpiar este archivo
4. **Incrementar versión**: ejecutar `.\versiones.ps1`
