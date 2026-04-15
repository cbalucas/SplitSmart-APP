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

---

## 🔮 Funcionalidades Planificadas (NO implementadas aún)

### Rediseño de Estados de Eventos

**Objetivo:** Simplificar estados a `Activo → Activo Bloqueado → Cerrado`.

#### Mapeo de estados

| Estado DB actual | Nuevo comportamiento | Cambio en DB |
|---|---|---|
| `active` | 🟢 Activo — todo editable | Ninguno |
| `completed` | 🔒 Activo Bloqueado — solo pagos/liquidaciones | `status='active'` + `is_locked=1` |
| `archived` | 📁 Cerrado — solo lectura total | Solo label en UI |
| `closed` | Sin uso — ignorar | Ninguno |

#### PASO 1 — Base de datos y tipos

**`src/services/database.ts`** — Migration nueva columna (agregar junto a las migraciones existentes ~línea 232):
```ts
// Migration: Add is_locked column to events table
try {
  const eventsInfo = await this.db.getAllAsync(`PRAGMA table_info(events)`);
  const hasIsLocked = eventsInfo.some((col: any) => col.name === 'is_locked');
  if (!hasIsLocked) {
    await this.db.execAsync('ALTER TABLE events ADD COLUMN is_locked INTEGER NOT NULL DEFAULT 0');
    // Migrar eventos completados → activos bloqueados
    await this.db.execAsync(`UPDATE events SET status = 'active', is_locked = 1 WHERE status = 'completed'`);
    console.log('✅ Migration: Added is_locked column, migrated completed → active+locked');
  }
} catch (error) {
  console.error('❌ Error in is_locked migration:', error);
}
```

Tabla CREATE para nuevas instalaciones — agregar `is_locked INTEGER NOT NULL DEFAULT 0` (~línea 557).

En `mapRowToEvent()`: `isLocked: row.is_locked === 1 || row.is_locked === true`

En `updateEvent()`:
```ts
if (updates.isLocked !== undefined) {
  fields.push('is_locked = ?');
  values.push(updates.isLocked ? 1 : 0);
}
```

**`src/types/index.ts`**:
```ts
status: 'active' | 'archived';  // 'closed' y 'completed' deprecados
isLocked?: boolean;
```

**`src/screens/Home/types.ts`**:
```ts
status: 'active' | 'archived';
isLocked?: boolean;
export type HomeEventStatus = 'active' | 'locked' | 'archived';
```

#### PASO 2 — Home Screen

**`src/screens/Home/index.tsx`** — Métricas (~línea 202):
```ts
const lockedCount = eventsWithAmounts.filter(e => e.status === 'active' && e.isLocked).length;
const archivedCount = eventsWithAmounts.filter(e => e.status === 'archived').length;
```

Tarjeta de métrica "Completados" → "Bloqueados" con `status: 'locked'`.

Orden: `const STATUS_ORDER = { active: 0, locked: 1, archived: 2 };`

Filtro:
```ts
if (statusFilter === 'locked') {
  result = result.filter(e => e.status === 'active' && e.isLocked);
} else if (statusFilter) {
  result = result.filter(e => e.status === statusFilter && !e.isLocked);
}
```

**`src/screens/Home/language.ts`** — labels:
```ts
locked: 'Bloqueados' / 'Locked' / 'Bloqueados'
archived: 'Cerrados' / 'Closed' / 'Fechados'
```

#### PASO 3 — EventDetail Screen (~50 reemplazos)

**Variables auxiliares** al tope del componente (después de cargar `event`):
```ts
const isLocked = event?.isLocked === true;
const isClosed = event?.status === 'archived';
const isEditable = event?.status === 'active' && !isLocked;
```

**Regla de permisos:**
- `isEditable` → puede agregar gastos, participantes, editar
- `!isClosed` → puede marcar pagos, consolidar, usar liquidaciones
- `isClosed` → read-only total

**Tabla de reemplazos de condicionales:**
```
event?.status === 'active'                              → isEditable
event?.status === 'active' || status === 'completed'    → !isClosed
event.status === 'archived' || status === 'completed'   → isClosed (en guards de return)
event?.status !== 'active'                              → !isEditable (en guards de return)
event?.status !== 'completed'                           → isClosed (en guards de markPaid/receipt)
status === 'completed' (en colores/badges)              → isLocked (mismos colores warning)
status === 'archived' (en colores/badges)               → isClosed
```

**Label de estado:**
```ts
// ANTES:
event.status === 'active' ? '🟢 Activo' : event.status === 'completed' ? '✅ Completado' : '📁 Archivado'
// DESPUÉS:
isClosed ? '📁 Cerrado' : isLocked ? '🔒 Bloqueado' : '🟢 Activo'
```

**Nuevas funciones** (reemplazan `handleChangeStatus`):
```ts
const handleToggleLock = async () => {
  const newLocked = !isLocked;
  showAlert({
    type: 'confirm',
    title: newLocked ? '🔒 Bloquear Evento' : '🔓 Desbloquear Evento',
    message: newLocked
      ? 'El evento quedará bloqueado. No se podrán agregar gastos ni participantes, pero podrás registrar pagos.'
      : '¿Deseas desbloquear el evento para permitir nuevamente agregar gastos y participantes?',
    buttons: [
      { text: 'Cancelar', style: 'cancel' },
      { text: newLocked ? 'Bloquear' : 'Desbloquear', onPress: async () => {
        await updateEvent(eventId, { isLocked: newLocked });
        await loadEventData();
      }}
    ]
  });
};

const handleCloseEvent = async () => {
  showAlert({
    type: 'destructive',
    title: '📁 Cerrar Evento',
    message: 'El evento quedará cerrado permanentemente. No podrás modificar ningún aspecto del mismo.',
    buttons: [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar Evento', style: 'destructive', onPress: async () => {
        await updateEvent(eventId, { status: 'archived', isLocked: true });
        await databaseService.updateSettlementsEventStatus(eventId, 'archived');
        await loadEventData();
      }}
    ]
  });
};
```

**Card Acciones en tab Resumen** — reemplazar botones actuales:
```tsx
{!isClosed && (
  <TouchableOpacity onPress={handleToggleLock}>
    <MaterialCommunityIcons name={isLocked ? 'lock-open' : 'lock'} />
    <Text>{isLocked ? t('eventDetail.unlockEvent') : t('eventDetail.lockEvent')}</Text>
  </TouchableOpacity>
)}
{!isClosed && (
  <TouchableOpacity onPress={handleCloseEvent}>
    <MaterialCommunityIcons name="archive" />
    <Text>{t('eventDetail.closeEvent')}</Text>
  </TouchableOpacity>
)}
// Sin botón de reactivar desde Cerrado
```

**Check "Marcar todos los pagos realizados"** — agregar en sección Liquidaciones:
```ts
const allSettlementsPaid = settlements.length > 0 && settlements.every(s => s.isPaid);

const handleMarkAllSettlementsPaid = async () => {
  if (allSettlementsPaid) return;
  showAlert({
    type: 'confirm',
    title: '✅ Marcar todos como pagados',
    message: `¿Confirmas que los ${settlements.length} pagos fueron realizados?`,
    buttons: [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: async () => {
        for (const s of settlements) {
          if (!s.isPaid) await databaseService.markSettlementAsPaid(s.id);
        }
        await loadEventData();
      }}
    ]
  });
};
```

```tsx
{!isClosed && settlements.length > 0 && (
  <TouchableOpacity onPress={handleMarkAllSettlementsPaid}>
    <MaterialCommunityIcons
      name={allSettlementsPaid ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
      size={20} color={allSettlementsPaid ? theme.colors.success : theme.colors.onSurfaceVariant}
    />
    <Text>{t('eventDetail.markAllPaid')}</Text>
  </TouchableOpacity>
)}
```

#### PASO 4 — LanguageContext

Nuevas claves a agregar en ES / EN / PT:
```
'events.locked': 'Bloqueado' / 'Locked' / 'Bloqueado'
'events.closed': 'Cerrado' / 'Closed' / 'Fechado'
'eventDetail.lockEvent': 'Bloquear Evento' / 'Lock Event' / 'Bloquear Evento'
'eventDetail.unlockEvent': 'Desbloquear Evento' / 'Unlock Event' / 'Desbloquear Evento'
'eventDetail.closeEvent': 'Cerrar Evento' / 'Close Event' / 'Fechar Evento'
'eventDetail.markAllPaid': 'Todos los pagos realizados' / 'All payments done' / 'Todos os pagamentos realizados'
'eventDetail.lockConfirmTitle': '🔒 Bloquear Evento'
'eventDetail.lockConfirmMsg': 'El evento quedará bloqueado...'
'eventDetail.unlockConfirmTitle': '🔓 Desbloquear Evento'
'eventDetail.closeConfirmTitle': '📁 Cerrar Evento'
'eventDetail.closeConfirmMsg': 'El evento quedará cerrado permanentemente...'
```

#### PASO 5 — SearchBar en liquidaciones (independiente, puede hacerse solo)

En `renderResumenTab()` de `EventDetail/index.tsx`, Card de Liquidaciones:
```ts
const [settlementSearch, setSettlementSearch] = useState('');

const filteredSettlements = getDisplaySettlements().filter(s =>
  s.fromParticipantName.toLowerCase().includes(settlementSearch.toLowerCase()) ||
  s.toParticipantName.toLowerCase().includes(settlementSearch.toLowerCase())
);
```

```tsx
{getDisplaySettlements().length > 3 && (
  <SearchBar
    value={settlementSearch}
    onChangeText={setSettlementSearch}
    placeholder="Buscar por deudor o acreedor..."
    style={{ marginBottom: 12 }}
  />
)}
// Usar filteredSettlements en lugar de getDisplaySettlements() en la lista
```

#### Notas
- Implementar en orden: Paso 1 → 2 → 3 → 4 → 5
- Probar migración con app existente que tenga eventos en estado `completed`
- El EventCard en Home debe mostrar 🔒 junto al nombre del evento bloqueado
- La función `handleChangeStatus` (~línea 954 EventDetail) debe ser reemplazada completamente
- `handleMarkSettlementPaid` (~línea 776) y `handleAddReceipt` (~línea 899): cambiar guard `status !== 'completed'` → `isClosed`

