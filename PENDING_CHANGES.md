# Cambios Pendientes de Registrar — SplitSmart

> **Propósito:** Bitácora de trabajo en curso entre sesiones de chat.
> Registrar aquí TODOS los cambios realizados antes de generar un nuevo APK/AAB.
> Una vez generado el build, mover el contenido a `CHANGELOG.md` y vaciar este archivo.

---

## 🗂️ Versión en desarrollo: v1.10.3

> Cambios realizados después del build de v1.10.2

### 🚀 Nuevas Funcionalidades

- **Monto pendiente en EventCard (Home)**: Las cards del Home ahora muestran el monto de liquidaciones pendientes debajo del total del evento (alineado a la derecha, color naranja `#FF9800`), solo cuando es mayor a cero.
- **Imágenes de Splitty por idioma**: Se creó `src/constants/splitty.ts` con la función `getSplittyImage(language)` y el flag `USE_THEMED_SPLITTY`. Cuando está activo, muestra `Splitty_AR.png` (es), `Splitty_PT.png` (pt) o `Splitty_US.png` (en) en EventCard, Home, ProfileScreen y ExpressEvent. Fallback al Splitty genérico si el idioma no tiene imagen asignada.

### 🔧 Correcciones de Bugs

- **Monto pendiente incorrecto en card (liquidaciones huérfanas)**: La card del Home mostraba montos pendientes incorrectos (ej. $28.000) cuando un evento no tenía gastos pero sí liquidaciones antiguas en la base de datos. Se agregó la condición `eventHasExpenses` en `loadEventCounts`: si el evento no tiene gastos, `pendingAmount = 0`, alineando la card con lo que EventDetail efectivamente muestra.
- **Monto pendiente no se actualizaba tras pagar una liquidación**: El FlatList del Home no re-renderizaba las EventCards después de marcar una liquidación como pagada. Se agregó `extraData={eventSettlements}` al FlatList para forzar la actualización al cambiar los datos de liquidaciones.
- **Popup de actualización no aparecía al lanzar nueva versión**: El `checkForUpdate` en `App.tsx` podía colgarse indefinidamente si el fetch a Play Store no respondía. Se agregó `fetchWithTimeout()` con `AbortController` (5 segundos) en `UpdateService.ts`, y se movió la llamada a un `useFocusEffect` en el Home con un flag de sesión (`updateChecked` ref) para evitar revisiones duplicadas.

### ✨ Mejoras

- **CreateExpense — orden de campos**: Reordenados los campos de la card "Información del Gasto" a: Descripción → **Fecha** → Monto (antes: Descripción → Monto → Fecha).
- **CreateExpense — label de monto eliminado**: Se eliminó el label duplicado "Monto" que aparecía sobre el campo de importe en modo moneda única. Limpieza de la clave `amountFieldLabel` en los 3 bloques de idioma del archivo `language.ts` (es/en/pt).
- **EventCard — liquidaciones**: La fila colapsable de liquidaciones ahora muestra solo el conteo `(pagadas/total)` sin repetir el monto pendiente (ya visible en la fila principal).

### 📁 Archivos Modificados

- `src/screens/CreateExpense/index.tsx` — reorden de campos en JSX
- `src/screens/CreateExpense/language.ts` — eliminación de `amountFieldLabel` en es/en/pt
- `src/components/EventCard.tsx` — monto pendiente, Splitty por idioma, conteo de liquidaciones
- `src/screens/Home/index.tsx` — cálculo pendingAmount con guard, extraData FlatList, checkForUpdate en useFocusEffect, Splitty por idioma
- `src/screens/Home/types.ts` — `pendingSettlementAmount?: number` en `HomeEventData`
- `src/services/UpdateService.ts` — `fetchWithTimeout()` con AbortController (5 s)
- `src/context/LanguageContext.tsx` — clave `eventCard.pending` en es/en/pt
- `src/constants/splitty.ts` *(nuevo)* — helper `getSplittyImage()` y flag `USE_THEMED_SPLITTY`
- `src/screens/ProfileScreen/index.tsx` — Splitty por idioma
- `src/screens/ExpressEvent/index.tsx` — Splitty por idioma (6 ocurrencias)
- `App.tsx` — eliminación del `useEffect` de updateCheck (movido al Home)

---

## 📋 Instrucciones de uso

1. **Al inicio de cada sesión**: leer este archivo para retomar el contexto
2. **Durante la sesión**: agregar cada cambio realizado en la sección correspondiente
3. **Al generar el build**: copiar el contenido a `CHANGELOG.md` y limpiar este archivo
4. **Incrementar versión**: ejecutar `.\versiones.ps1`
