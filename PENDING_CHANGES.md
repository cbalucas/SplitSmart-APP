# Cambios Pendientes de Registrar — SplitSmart

> **Propósito:** Bitácora de trabajo en curso entre sesiones de chat.
> Registrar aquí TODOS los cambios realizados antes de generar un nuevo APK/AAB.
> Una vez generado el build, mover el contenido a `CHANGELOG.md` y vaciar este archivo.

---

## 🗂️ Versión en desarrollo: v1.4.7

> Cambios realizados después del build de v1.4.6

### 🚀 Nuevas Funcionalidades

_(ninguna aún)_

### 🔧 Correcciones de Bugs

- **Validación de nombres duplicados en amigos y participantes**: se previene la creación de amigos o participantes con nombre ya existente (case-insensitive).
  - Al crear o editar un amigo en `ManageFriends`: muestra mensaje de error inline bajo el campo nombre (sin Alert).
  - Al agregar amigos desde el modal `AddParticipantModal` (tab "Mis Amigos"): verifica que ningún amigo seleccionado tenga el mismo nombre que un participante ya en el evento.
  - Al crear un participante nuevo (tab "Nuevo"): verifica duplicado contra el evento; si `saveAsFriend` está activo, también verifica contra la lista global de amigos.
  - Al crear participantes masivos (tab "Masivo", nombres propios): verifica todos los nombres contra los participantes existentes del evento.

- **Sección Seguridad en Perfil siempre visible**: la sección "Seguridad" (cambio de contraseña) dejó de estar oculta detrás del modo edición y ahora siempre se muestra en `ProfileScreen`.

- **Modal cambio de contraseña mejorado**: el popup ahora incluye:
  - Campo "Contraseña actual" con validación contra la base de datos (`verifyUserPassword`)
  - Campo "Nueva contraseña" con indicador de fortaleza en tiempo real (6 niveles con colores)
  - Campo "Confirmar nueva contraseña" con etiqueta de error roja si no coinciden
  - Botones con ojo para mostrar/ocultar en cada campo
  - Botón Confirmar deshabilitado mientras las contraseñas no coincidan
  - Textos de botones centrados

- **Validación y filtrado de teléfono en toda la app**: los 5 campos de teléfono (SignUp, Perfil, AddParticipantModal, ManageFriends, EventDetail) ahora:
  - Filtran en tiempo real: solo permiten `+` al inicio, dígitos, espacios, guiones y paréntesis
  - Validan formato al guardar (excepto EventDetail que no tiene botón de guardado dedicado) y muestran Alert traducido

- **Validación y filtrado de email en toda la app**: los 5 campos de email (SignUp, Perfil, AddParticipantModal, ManageFriends, EventDetail) ahora:
  - Filtran en tiempo real: convierten a minúsculas y eliminan espacios al escribir
  - Validan formato al guardar y muestran Alert traducido con mensaje descriptivo (formato `usuario@dominio.com`)
  - El mensaje hardcodeado en `ProfileScreen` fue reemplazado por claves de traducción

- **Mensaje de email inválido en SignUp más descriptivo**: el Alert ahora indica explícitamente que el email no es válido y muestra el formato esperado (`usuario@dominio.com`)

### ✨ Mejoras

_(ninguna aún)_

### 📁 Archivos Modificados

- `src/screens/ManageFriends/language.ts` — claves `duplicateName`, `phoneInvalid`, `emailInvalid` en `alerts.error` (ES/EN/PT); interfaz TypeScript actualizada
- `src/screens/ManageFriends/styles.ts` — nuevo estilo `errorText`
- `src/screens/ManageFriends/index.tsx` — estado `duplicateNameError`; filtros y validaciones de teléfono y email
- `src/components/AddParticipantModal/index.tsx` — validaciones de duplicado; filtros y validaciones de teléfono y email
- `src/context/LanguageContext.tsx` — claves bajo `addParticipant.error`, `profile.message`, `profile.passwordStrength.*`, `profile.currentPassword`, `profile.confirmPassword`, `eventDetail.error.emailInvalid` (ES/EN/PT)
- `src/screens/ProfileScreen/index.tsx` — sección seguridad siempre visible; modal contraseña reconstruido; filtros y validaciones de teléfono y email
- `src/screens/ProfileScreen/styles.ts` — estilos para modal contraseña: `modalPasswordRow`, `modalPasswordInput`, `modalEyeButton`, `passwordStrengthContainer/Bar/Fill/Text`, `modalButtonConfirmDisabled`, `modalPasswordMismatch`
- `src/services/database.ts` — nuevo método `verifyUserPassword(userId, password)`
- `src/context/DataContext.tsx` — interfaz, implementación y valor de `verifyUserPassword`
- `src/screens/Auth/SignUpScreen.tsx` — filtro tiempo real en email; mensaje `emailInvalid` más descriptivo
- `src/screens/Auth/language.ts` — mensajes `emailInvalid` descriptivos con formato esperado (ES/EN/PT)
- `src/screens/EventDetail/index.tsx` — filtro tiempo real en email; validación antes de `onSave()`

---

## 📋 Instrucciones de uso

1. **Al inicio de cada sesión**: leer este archivo para retomar el contexto
2. **Durante la sesión**: agregar cada cambio realizado en la sección correspondiente
3. **Al generar el build**: copiar el contenido a `CHANGELOG.md` y limpiar este archivo
4. **Incrementar versión**: seguir el proceso del documento `Prompt/Incrementar Version APP`
