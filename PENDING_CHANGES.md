# Cambios Pendientes de Registrar — SplitSmart

> **Propósito:** Bitácora de trabajo en curso entre sesiones de chat.
> Registrar aquí TODOS los cambios realizados antes de generar un nuevo APK/AAB.
> Una vez generado el build, mover el contenido a `CHANGELOG.md` y vaciar este archivo.

---

## 🗂️ Versión en desarrollo: v1.4.9

> Cambios realizados después del build de v1.4.8

### 🚀 Nuevas Funcionalidades

_(ninguna aún)_

### 🔧 Correcciones de Bugs

- ✅ **EventDetail — Totales de participantes no se actualizaban al agregar gastos** (`src/context/DataContext.tsx`): `getSplitsByEvent` leía del estado en memoria (`splits`) en lugar de la BD. Al volver de `CreateExpense`, `useFocusEffect` llamaba `loadEventData()` antes de que el estado global se propagara, dejando los splits stale. Corregido consultando `databaseService.getSplitsByEvent(eventId)` directamente (igual que `getExpensesByEvent`), garantizando datos frescos en cada carga.

### ✨ Mejoras

_(ninguna aún)_

### 📁 Archivos Modificados

- `src/context/DataContext.tsx`

---

## 📋 Instrucciones de uso

1. **Al inicio de cada sesión**: leer este archivo para retomar el contexto
2. **Durante la sesión**: agregar cada cambio realizado en la sección correspondiente
3. **Al generar el build**: copiar el contenido a `CHANGELOG.md` y limpiar este archivo
4. **Incrementar versión**: seguir el proceso del documento `Prompt/Incrementar Version APP`
