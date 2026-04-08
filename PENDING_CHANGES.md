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
- ✨ **EventDetail — Eliminación múltiple de participantes**: nuevo modo de selección múltiple en el tab Participantes. Botón tacho de basura (rojo) a la derecha del "Agregar" activa el modo. Participantes con gastos aparecen bloqueados (ícono candado, opacidad reducida) con mensaje explicativo al tocarlos. Un único Alert de confirmación elimina todos los seleccionados. Al confirmar, limpia filtro de búsqueda y vuelve al modo normal.
- ✨ **AddParticipantModal — Mensaje de éxito consolidado al agregar participantes**: al agregar múltiples participantes (tab Amigos o Masivo) se muestra un único Alert al final en lugar de N alertas individuales.
- ✨ **EventDetail — Tab Resumen: card "Liquidaciones Pagadas"**: nueva sección que aparece únicamente cuando existen liquidaciones marcadas como pagadas (y el evento no está completado). Muestra cada liquidación con: ícono de comprobante (`file-image-outline`) tocable si existe imagen o bloqueado/atenuado si no; nombre del pagador → receptor; monto en verde; y fecha de pago — todo en la misma fila inferior (`space-between`).
- ✨ **EventDetail — Tab Resumen: barra de acciones fija**: la barra con los íconos de compartir (clipboard-check, file-document) y los botones de estado (Completar/Archivar/Reactivar) queda fija al hacer scroll, extraída del `ScrollView` al igual que en el tab Participantes. Los botones de estado están alineados a la derecha con `flex: 1` + `justifyContent: 'flex-end'` separados por un divisor vertical.
- ✨ **EventDetail — Tab Participantes: barra de acciones fija**: la barra con título "👥 Participantes", botón Agregar y botón tacho de basura (y su equivalente en modo selección) ahora queda fija fuera del `ScrollView`, visible siempre sin importar cuánto se scrollee la lista.
- ✨ **EventDetail — Tab Gastos: eliminación múltiple de gastos**: nuevo modo de selección múltiple en el tab Gastos, simétrico al de Participantes. Botón tacho de basura (rojo translúcido) aparece junto al botón "Agregar" cuando el evento está activo y tiene al menos un gasto. Al activarlo, la barra de acciones cambia al modo selección mostrando el contador. Cada gasto muestra un checkbox (☑/☐). Un único Alert de confirmación elimina todos los seleccionados. Al confirmar, limpia la búsqueda y vuelve al modo normal. Los botones Editar/Eliminar individuales y el ícono de comprobante se ocultan durante la selección. El modo se resetea automáticamente al cambiar de tab.
- ✨ **EventDetail — Tab Gastos: buscador y barra de título/acciones fijos**: el buscador y la barra con título "💸 Gastos" + acciones (Agregar / tacho) quedan fijos fuera del `ScrollView`, visibles siempre sin importar el desplazamiento de la lista.
- ✨ **CreateExpense — Soporte para múltiples pagadores (Opción B — tabla `expense_payers`)**: un gasto ahora puede ser pagado por más de una persona. En la card "¿Quién pagó?" se agregó un switch "Múltiples pagadores". Al activarlo, aparece la lista de todos los participantes del evento con checkboxes (todos desmarcados por defecto). Al marcar un participante, el monto se distribuye automáticamente en partes iguales entre los seleccionados. El monto por pagador es editable manualmente; si la suma no coincide con el total del gasto, se muestra un indicador de alerta en rojo. El modo simple (pagador único) mantiene el comportamiento anterior con buscador y radio buttons. Los datos se persisten en la nueva tabla `expense_payers` en SQLite, retrocompatible con gastos existentes de pagador único. Los cálculos de balances y liquidaciones (`calculations.ts` y `database.ts → calculateBalancesFromData`) se actualizaron para usar los pagadores reales cuando existen. Al editar un gasto multi-pagador existente, el formulario carga correctamente el estado previo. EventDetail muestra los nombres de todos los pagadores separados por coma en lugar del nombre único.

### 🔧 Correcciones de Bugs

- ✅ **database.ts — `removeParticipantFromEvent` eliminaba amigos permanentes de la app**: al quitar un amigo (`participantType = 'friend'`) de un evento donde era el único evento en que participaba, la función lo borraba de la tabla `participants` global. Corregido: ahora solo elimina el registro de `participants` si el participante no es de tipo `'friend'`.
- ✅ **AddParticipantModal — Re-renders y pantalla con comportamiento errático al tipear nombre**: el `useEffect` de validación tenía `currentParticipants` y `participants` (arrays del Context) en su dependency array. Al cambiar la referencia del array en cada re-render del padre, el effect se disparaba en ciclo. Corregido usando `useRef` para acceder a esos valores dentro del timeout sin incluirlos como dependencias. Además se eliminó el estado intermedio `isChecking: true` (validación 100% síncrona), que generaba renders extra innecesarios.

### ✨ Mejoras

- **ManageFriends — Nuevas traducciones de validación de nombre** (`nameValidation.tooShort/checking/available/duplicate`) en ES, EN y PT, en archivo `language.ts` propio de la pantalla.
- **AddParticipantModal — Nuevas claves de traducción** (`addParticipant.nameValidation.*`) en ES, EN y PT dentro de `LanguageContext.tsx`.
- **LanguageContext — Nuevas claves para flujo de amigo duplicado** en EventDetail (`eventDetail.duplicateFriendWarning`, `eventDetail.convertDuplicateTitle`, `eventDetail.convertDuplicateMessage`, `eventDetail.replaceWithExisting`, `eventDetail.replacedSuccess`) en ES, EN y PT.
- **LanguageContext — Nuevas claves para eliminación múltiple de participantes** (`participants.selectMode`, `participants.cancelSelect`, `participants.selectedCount`, `participants.deleteSelected`, `participants.confirmDeleteSelected`, `participants.deletedSelected`, `participants.cannotDeleteHasExpenses`) en ES, EN y PT.
- **EventDetail — Tab Participantes: modo selección se resetea al cambiar de tab**: al navegar a otro tab y volver, los participantes siempre se muestran en modo normal (sin selección activa ni filtro de búsqueda).
- **EventDetail — Cards de participantes: botón eliminar individual eliminado**: la eliminación individual por ✕ fue removida. La única vía de eliminación es el modo selección múltiple con el tacho de basura.
- **EventDetail — Cards de participantes: layout del panel derecho invertido**: el lápiz de editar queda arriba y el balance abajo (`flexDirection: 'column'`).
- **EventDetail — Cards de participantes: montos de pagado/división más grandes**: `fontSize` subido de `11` a `13` con `fontWeight: '500'`. El 💰 (pagado) solo se muestra si el monto es mayor a $0.
- **LanguageContext — Nuevas claves para liquidaciones pagadas** (`summary.paidSettlements`, `summary.paidSettlementsEmpty`, `summary.paidOn`) en ES, EN y PT.
- **EventDetail — Tab Resumen: card "Liquidaciones Pagadas" oculta en eventos completados**: si el evento tiene `status === 'completed'`, la card no se renderiza ya que no es necesaria en ese estado.
- **LanguageContext — Nuevas claves para eliminación múltiple de gastos** (`expenses.selectMode`, `expenses.cancelSelect`, `expenses.selectedCount`, `expenses.deleteSelected`, `expenses.confirmDeleteSelected`, `expenses.deletedSelected`) en ES (sección adicional y principal), EN y PT.
- **EventDetail — Tab Gastos: modo selección se resetea al cambiar de tab**: al navegar a otro tab y volver, los gastos siempre se muestran en modo normal (sin selección activa).

### 📁 Archivos Modificados

| Archivo | Tipo de cambio |
|---|---|
| `src/screens/ManageFriends/language.ts` | Nuevo: sección `nameValidation` en interfaz y 3 idiomas |
| `src/screens/ManageFriends/styles.ts` | Nuevo: 7 estilos de validación de input |
| `src/screens/ManageFriends/index.tsx` | Reemplaza estado `duplicateNameError` por `NameValidation`; nueva lógica y UI de validación en tiempo real |
| `src/components/AddParticipantModal/index.tsx` | `NameValidation` + `useRef` + validación en tiempo real; fix re-renders; prop `onAddParticipant` cambiada a `Participant \| Participant[]`; mensaje consolidado |
| `src/context/LanguageContext.tsx` | Nuevas claves: `addParticipant.nameValidation.*`, `eventDetail.convertDuplicate*`, `participants.selectMode/cancelSelect/selectedCount/deleteSelected/confirmDeleteSelected/deletedSelected/cannotDeleteHasExpenses`, `summary.paidSettlements/paidSettlementsEmpty/paidOn`, `expenses.selectMode/cancelSelect/selectedCount/deleteSelected/confirmDeleteSelected/deletedSelected` |
| `src/screens/EventDetail/index.tsx` | `EditParticipantModalContent`: banner amigo duplicado. `handleSaveEditedParticipant`: intercepción duplicado + reemplazo. `handleAddParticipant`: refactorizado a `async`, acepta array, Alert consolidado. Nuevos estados `isParticipantSelectMode`/`selectedParticipantIds`. Nueva función `handleRemoveSelectedParticipants`. `renderParticipantesTab`: barra de acciones fija (fuera del ScrollView), header modo selección, checkbox/candado por item, reset al cambiar tab, layout panel derecho invertido, montos más grandes, 💰 oculto si $0. `renderResumenTab`: barra de acciones fija (fuera del ScrollView) con íconos compartir a la izquierda y botones estado a la derecha; nueva card "Liquidaciones Pagadas" (oculta si `status=completed`) con ícono comprobante tocable/bloqueado, monto y fecha en fila inferior. Nuevos estados `isExpenseSelectMode`/`selectedExpenseIds`. Nueva función `handleRemoveSelectedExpenses`. `renderGastosTab`: buscador y barra de acciones fijos (fuera del ScrollView); modo selección múltiple con checkboxes; botón tacho de basura junto al Agregar; acciones individuales ocultas en modo selección; reset al cambiar tab. |
| `src/screens/EventDetail/styles.ts` | `participantRightSection`: cambiado a `flexDirection: 'column'` |
| `src/services/database.ts` | Fix: `removeParticipantFromEvent` no borra amigos permanentes |

---

## 📋 Instrucciones de uso

1. **Al inicio de cada sesión**: leer este archivo para retomar el contexto
2. **Durante la sesión**: agregar cada cambio realizado en la sección correspondiente
3. **Al generar el build**: copiar el contenido a `CHANGELOG.md` y limpiar este archivo
4. **Incrementar versión**: ejecutar `.\versiones.ps1`

