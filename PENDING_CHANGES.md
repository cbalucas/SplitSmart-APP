# Cambios Pendientes de Registrar — SplitSmart

> **Propósito:** Bitácora de trabajo en curso entre sesiones de chat.
> Registrar aquí TODOS los cambios realizados antes de generar un nuevo APK/AAB.
> Una vez generado el build, mover el contenido a `CHANGELOG.md` y vaciar este archivo.

---

## 🗂️ Versión en desarrollo: v1.4.11

> Cambios realizados después del build de v1.4.10

### 🚀 Nuevas Funcionalidades

- ✨ **ManageFriends — Validación de nombre en tiempo real**: al escribir el nombre de un nuevo amigo (o al editar uno existente), se verifica instantáneamente (debounce 400ms) si ya existe otro amigo con ese nombre. Muestra indicadores visuales: ícono ✅/❌ sobre el campo, borde verde/rojo, y mensaje de estado debajo del input. Reemplaza la validación anterior que solo ocurría al presionar "Crear".
- ✨ **AddParticipantModal — Validación de nombre en tiempo real (tab "Nuevo")**: al escribir el nombre de un nuevo participante, se verifica en tiempo real (debounce 400ms) si ya existe en el evento actual. Si el toggle "Guardar como amigo" está activo, también verifica contra la lista global de amigos. Indicadores visuales idénticos al patrón de ManageFriends.
- ✨ **EventDetail — Detección y resolución de amigo duplicado al convertir participante**: al activar "Convertir en Amigo" en el modal de edición de un participante temporal, se muestra un banner de advertencia naranja en tiempo real si ya existe un amigo con ese nombre. Al intentar guardar, se ofrece la opción "Usar amigo existente" que reemplaza el participante temporal por el amigo ya registrado (elimina el temporal del evento y agrega el amigo real).

### 🔧 Correcciones de Bugs

- ✅ **database.ts — `removeParticipantFromEvent` eliminaba amigos permanentes de la app**: al quitar un amigo (`participantType = 'friend'`) de un evento donde era el único evento en que participaba, la función lo borraba de la tabla `participants` global. Corregido: ahora solo elimina el registro de `participants` si el participante no es de tipo `'friend'`.
- ✅ **AddParticipantModal — Re-renders y pantalla con comportamiento errático al tipear nombre**: el `useEffect` de validación tenía `currentParticipants` y `participants` (arrays del Context) en su dependency array. Al cambiar la referencia del array en cada re-render del padre, el effect se disparaba en ciclo. Corregido usando `useRef` para acceder a esos valores dentro del timeout sin incluirlos como dependencias. Además se eliminó el estado intermedio `isChecking: true` (validación 100% síncrona), que generaba renders extra innecesarios.

### ✨ Mejoras

- **ManageFriends — Nuevas traducciones de validación de nombre** (`nameValidation.tooShort/checking/available/duplicate`) en ES, EN y PT, en archivo `language.ts` propio de la pantalla.
- **AddParticipantModal — Nuevas claves de traducción** (`addParticipant.nameValidation.*`) en ES, EN y PT dentro de `LanguageContext.tsx`.
- **LanguageContext — Nuevas claves para flujo de amigo duplicado** en EventDetail (`eventDetail.duplicateFriendWarning`, `eventDetail.convertDuplicateTitle`, `eventDetail.convertDuplicateMessage`, `eventDetail.replaceWithExisting`, `eventDetail.replacedSuccess`) en ES, EN y PT.

### 📁 Archivos Modificados

| Archivo | Tipo de cambio |
|---|---|
| `src/screens/ManageFriends/language.ts` | Nuevo: sección `nameValidation` en interfaz y 3 idiomas |
| `src/screens/ManageFriends/styles.ts` | Nuevo: 7 estilos de validación de input |
| `src/screens/ManageFriends/index.tsx` | Reemplaza estado `duplicateNameError` por `NameValidation`; nueva lógica y UI de validación en tiempo real |
| `src/components/AddParticipantModal/index.tsx` | Nuevo: `NameValidation` + `useRef` + validación en tiempo real con debounce; fix re-renders |
| `src/context/LanguageContext.tsx` | Nuevas claves: `addParticipant.nameValidation.*` y `eventDetail.convertDuplicate*` / `replacedSuccess` / `duplicateFriendWarning` |
| `src/screens/EventDetail/index.tsx` | `EditParticipantModalContent`: banner de advertencia por amigo duplicado. `handleSaveEditedParticipant`: intercepción de duplicado con Alert y opción de reemplazo |
| `src/services/database.ts` | Fix: `removeParticipantFromEvent` ya no borra amigos permanentes de `participants` |

---

## 📋 Instrucciones de uso

1. **Al inicio de cada sesión**: leer este archivo para retomar el contexto
2. **Durante la sesión**: agregar cada cambio realizado en la sección correspondiente
3. **Al generar el build**: copiar el contenido a `CHANGELOG.md` y limpiar este archivo
4. **Incrementar versión**: ejecutar `.\versiones.ps1`

