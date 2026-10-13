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

### ✨ Mejoras

_(ninguna aún)_

### ✨ Mejoras

- **Logs de colaboración mejorados**: agregados logs `console.error` más informativos cuando falla el registro del colaborador en `event_collaborators` (importación o push). Esto ayuda a diagnosticar por qué las ediciones de un rol `editor` por QR no propagan. Logs con contexto: eventId, userId, shareId, error exacto. Antes eran `console.warn` silenciosos.

### 📁 Archivos Modificados

- `src/screens/EventDetail/index.tsx` (handlers de liquidaciones y actividades)
- `src/context/DataContext.tsx` (importSharedEvent → logs mejorados)
- `src/services/SupabaseSyncService.ts` (push de event_collaborators → logs mejorados; nuevo reintento de registro de colaborador en pull nativo y web)

---

## 📋 Instrucciones de uso

1. **Al inicio de cada sesión**: leer este archivo para retomar el contexto
2. **Durante la sesión**: agregar cada cambio realizado en la sección correspondiente
3. **Al generar el build**: copiar el contenido a `CHANGELOG.md` y limpiar este archivo
4. **Incrementar versión**: ejecutar `.\versiones.ps1`
