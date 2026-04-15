# Cambios Pendientes de Registrar — SplitSmart

> **Propósito:** Bitácora de trabajo en curso entre sesiones de chat.
> Registrar aquí TODOS los cambios realizados antes de generar un nuevo APK/AAB.
> Una vez generado el build, mover el contenido a `CHANGELOG.md` y vaciar este archivo.

---

## 🗂️ Versión en desarrollo: v1.7.1

> Cambios realizados después del build de v1.7.0

### 🚀 Nuevas Funcionalidades

- **Cerrar sesión en todos los menús de HeaderBar**: nueva prop `showLogout` en `HeaderBar`. Al activarla aparece la opción "Cerrar sesión" (en rojo, con separador) al final del menú desplegable. La confirmación usa idioma activo (es/en/pt). Se eliminó la lógica de logout dispersa en cada pantalla.
- **Selección múltiple con "Todos"**: en el modo selección de gastos y participantes se puede tildar/destildar todos de un toque. La barra muestra checkbox circular a la izquierda (vacío / parcial / completo) con el texto "Todos" y los botones de acción (🗑 / ✕) como íconos circulares a la derecha.

### 🔧 Correcciones de Bugs

- **Estado vacío de gastos**: el link "Agregar participantes primero →" fue reemplazado por "Se deben Agregar Participantes" con el mismo estilo de link y navegación a la pestaña de participantes.

### ✨ Mejoras

- **UX barra de selección**: diseño rediseñado (gastos y participantes) con patrón checkbox-izquierda + acciones-derecha, acorde a apps modernas. Sin filas de botones de texto saturadas.
- **Texto uniforme**: ambos modos de selección muestran "Todos" cuando no hay nada seleccionado (antes decían "Seleccionar Todos" vs "Todos" de forma inconsistente).
- `HeaderBar`: `useAuth` y `showAlert` importados internamente — las pantallas ya no necesitan manejar logout propio.

### 📁 Archivos Modificados

- `src/components/HeaderBar.tsx` — prop `showLogout`, imports `useAuth` + `showAlert`, labels multiidioma
- `src/screens/Home/index.tsx` — eliminado `handleLogout` y `overflowAfterItems` de logout; agregado `showLogout={true}`
- `src/screens/ManageFriends/index.tsx` — agregado `showLogout={true}`
- `src/screens/CreateEvent/index.tsx` — agregado `showLogout={true}`
- `src/screens/CreateExpense/index.tsx` — agregado `showLogout={true}`
- `src/screens/EventDetail/index.tsx` — `showLogout={true}`, rediseño barra selección gastos/participantes, fix texto estado vacío gastos
- `src/screens/ProfileScreen/index.tsx` — agregado `showLogout={true}`
- `src/components/AddParticipantModal/index.tsx` — agregado `showLogout={true}`
- `src/context/LanguageContext.tsx` — claves: `expenses.noParticipantsForExpenses`, `participants.selectAll`, normalización `expenses.selectAll` → "Todos"

---

## 📋 Instrucciones de uso

1. **Al inicio de cada sesión**: leer este archivo para retomar el contexto
2. **Durante la sesión**: agregar cada cambio realizado en la sección correspondiente
3. **Al generar el build**: copiar el contenido a `CHANGELOG.md` y limpiar este archivo
4. **Incrementar versión**: ejecutar `.\versiones.ps1`
