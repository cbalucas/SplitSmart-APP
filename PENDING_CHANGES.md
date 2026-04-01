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

### ✨ Mejoras

_(ninguna aún)_

### 📁 Archivos Modificados

- `src/screens/ManageFriends/language.ts` — nueva clave `duplicateName` en `alerts.error` (ES/EN/PT)
- `src/screens/ManageFriends/styles.ts` — nuevo estilo `errorText`
- `src/screens/ManageFriends/index.tsx` — estado `duplicateNameError` + validación + mensaje inline
- `src/components/AddParticipantModal/index.tsx` — validaciones de duplicado en los 3 handlers (amigos, nuevo, masivo)
- `src/context/LanguageContext.tsx` — 5 nuevas claves bajo `addParticipant.error`/`addParticipant.alert` (ES/EN/PT)

---

## 📋 Instrucciones de uso

1. **Al inicio de cada sesión**: leer este archivo para retomar el contexto
2. **Durante la sesión**: agregar cada cambio realizado en la sección correspondiente
3. **Al generar el build**: copiar el contenido a `CHANGELOG.md` y limpiar este archivo
4. **Incrementar versión**: seguir el proceso del documento `Prompt/Incrementar Version APP`
