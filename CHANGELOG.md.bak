# Changelog - SplitSmart

## [1.9.0] - 2026-04-19

### 🚀 Nuevas Funcionalidades
- **Tour guiado (TutorialOverlay)** — componente nuevo creado desde cero (`src/components/TutorialOverlay/index.tsx`):
- Overlay oscuro con recorte highlight sobre el elemento destacado
- Borde del highlight con 4 Views independientes (evita clipping en bordes de pantalla)
- Estado `transitioning` que oculta el popup durante la transición entre pasos (sin flash)
- Soporte para `onBeforeShow` (callback antes de mostrar el paso) y `delay` configurable por paso
- Corrección de offset de StatusBar en Android
- Guard contra `currentStep >= steps.length`
- **Tour en Home** — 4 pasos: banner de bienvenida, métricas, lista de eventos, acciones rápidas
- **Tour en EventDetail** — 7 pasos con cambio automático de tab (resumen → participantes → gastos), navegación prev/next correcta
- **Tour en CreateExpense** — 5 pasos con scroll automático a cada card; `ceScrollRef` para desplazamiento previo a `measureInWindow`
- **Tour en CreateEvent** — 4 pasos con scroll automático; nuevo `cevScrollRef`
- **Tour en ManageFriends** — 4 pasos con cambio de tab al paso "Crear amigo"
- **Tour en ProfileScreen** — 9 pasos con scroll automático por sección
- **Tour en AddParticipantModal** — 4 pasos con cambio de tab (amigos → nuevo → en masa); `apFriendsRef` cubre SearchBar + lista
- **Tour en SignUpScreen** — 4 pasos con scroll automático: datos personales, contacto, contraseña, botón crear cuenta

### 🔧 Correcciones de Bugs
- **TutorialOverlay — borde inferior invisible**: reemplazado `borderWidth:2` único por 4 Views de 2px posicionadas absolutamente; el borde ya no se recorta al borde de pantalla
- **TutorialOverlay — flash de popup durante transición**: estado `transitioning` renderiza solo overlay oscuro mientras `onBeforeShow` espera; popup solo aparece cuando `measureInWindow` termina
- **CreateExpense — popup fuera de pantalla en pasos 2-5**: `scrollToCard()` con `measureLayout` hace scroll previo al elemento antes de medir; popup siempre visible
- **AddParticipantModal — paso 2 highlight incorrecto**: `apFriendsRef` movido al return principal cubriendo SearchBar + lista (antes estaba solo dentro de `renderFriendsTab`)
- **AddParticipantModal — error `measureInWindow is not a function`** en paso 3: `KeyboardAvoidingView` no expone `measureInWindow`; envuelto en `<View ref={apNewRef}>` wrapper
- **AddParticipantModal — error `Adjacent JSX elements`**: `return (` + `<Modal` faltante tras agregar el wrapper `</View>` al cerrar `renderNewParticipantTab`
- **LanguageContext — doble coma `,,`** en línea PT `tour.addParticipant.friends.desc`: corregida via PowerShell `TrimEnd(',')`

### ✨ Mejoras
- **Paso 1 eliminado** (header) de los tours de: EventDetail, ProfileScreen, ManageFriends — el tour arranca directamente en el contenido útil
- **AddParticipantModal** — eliminado botón X (cerrar) del HeaderBar; la pantalla ya se cierra con el botón de la barra de navegación
- **ForgotPasswordScreen** — eliminado icono `?` (ayuda) del HeaderBar (sin tour implementado)
- **LoginScreen** — eliminado icono `?` (ayuda) del HeaderBar (sin tour implementado)
- **CreateExpense / CreateEvent** — al abrir el tour, scroll automático al tope (`scrollTo({ y: 0, animated: false })`) para garantizar que el paso 1 siempre esté visible
- **Traducciones** — claves tour agregadas en ES, EN y PT para: `tour.eventdetail.*`, `tour.addParticipant.*`, `tour.createExpense.*`, `tour.createEvent.*`, `tour.signUp.*`

### 🔢 Versiones
- **versionCode**: 21 → 22
- **versionName**: "1.8.0" → "1.9.0"

---


## [1.8.0] - 2026-04-15

### 🚀 Nuevas Funcionalidades
- **Cerrar sesión en todos los menús de HeaderBar**: nueva prop `showLogout` en `HeaderBar`. Al activarla aparece la opción "Cerrar sesión" (en rojo, con separador) al final del menú desplegable. La confirmación usa idioma activo (es/en/pt). Se eliminó la lógica de logout dispersa en cada pantalla.
- **Selección múltiple con "Todos"**: en el modo selección de gastos y participantes se puede tildar/destildar todos de un toque. La barra muestra checkbox circular a la izquierda (vacío / parcial / completo) con el texto "Todos" y los botones de acción (🗑 / ✕) como íconos circulares a la derecha.
- **Sistema de 3 estados de eventos** (`Activo → Bloqueado → Cerrado`):
- `Activo` — todo editable (gastos, participantes, pagos)
- `Bloqueado` — solo se pueden registrar/deshacer pagos; gastos y participantes de solo lectura
- `Cerrado` — lectura total, sin ninguna modificación posible
- Migración automática de DB: eventos `completed` → `active + is_locked=1`
- Nueva columna `is_locked INTEGER` en tabla `events`
- Botones en EventDetail: Bloquear / Desbloquear / Cerrar / Reactivar según estado
- Badge de estado con colores: 🟢 Activo (verde) / 🔒 Bloqueado (naranja) / 📁 Cerrado (gris)
- Barra naranja en EventCard para eventos bloqueados
- Métricas y filtros en Home actualizados para los 3 estados
- **Deshacer pagos con selección múltiple**: nueva sección "Liquidaciones Pagadas" con botón de activar modo selección (ícono circular pequeño), checkbox-all, contador de seleccionados y botón rojo de deshacer. Mismo patrón visual que gastos/participantes.
- **Alertas personalizadas en CreateEvent**: todos los `Alert.alert` nativos migrados a `showAlert` (con borde de color por tipo).

### 🔧 Correcciones de Bugs
- **Estado vacío de gastos**: el link "Agregar participantes primero →" fue reemplazado por "Se deben Agregar Participantes" con el mismo estilo de link y navegación a la pestaña de participantes.
- **Deshacer pagos en bulk no funcionaba**: el segundo `showAlert` de confirmación reemplazaba al primero, dejando un pago sin deshacer. Corregido con parámetro `skipConfirmation` en `handleToggleSettlementPaid` para el bulk undo.
- **Bloquear evento seguía permitiendo agregar gastos/participantes**: los botones del UI usaban `event?.status === 'active'` en lugar de `isEditable`. Corregidas 6 ocurrencias en las pestañas de Gastos y Participantes.
- **Badge de estado mostraba clave cruda `metrics.locked`**: clave inexistente; reemplazada por `events.locked` con valor `"Bloqueado"`.
- **Status "Archivado" en badge y share**: `events.archived` ahora devuelve `"Cerrado"` / `"Closed"` / `"Fechado"` en los 3 idiomas.
- **Filtro "Bloqueados" en Home no traía eventos**: el `useMemo` de `eventsWithAmounts` no propagaba el campo `isLocked` del evento original; siempre era `undefined` y el filtro nunca matcheaba.
- **Alertas en Home sin borde de color**: variable local `showAlert` sobreescribía el import; se corrigió migrando los 7 `Alert.alert` nativos.

### ✨ Mejoras
- **UX barra de selección**: diseño rediseñado (gastos y participantes) con patrón checkbox-izquierda + acciones-derecha, acorde a apps modernas. Sin filas de botones de texto saturadas.
- **Texto uniforme**: ambos modos de selección muestran "Todos" cuando no hay nada seleccionado (antes decían "Seleccionar Todos" vs "Todos" de forma inconsistente).
- `HeaderBar`: `useAuth` y `showAlert` importados internamente — las pantallas ya no necesitan manejar logout propio.
- **Ícono de deshacer pagos reducido**: botón de activar modo deshacer pasó de `36×36` con ícono `18px` a `28×28` con ícono `14px` para no competir visualmente con el badge de cuenta.

### 🔢 Versiones
- **versionCode**: 20 → 21
- **versionName**: "1.7.0" → "1.8.0"

---


## [1.7.0] - 2026-04-13

### 🚀 Nuevas Funcionalidades
- **Participantes Secundarios (representados)**: sistema completo de participantes secundarios como entidades reales en la BD. Un participante primario puede tener N representados; cada secundario se crea con el botón `+` y recibe nombre automático `{Primario} - Nro N` (próximo número libre sin colisión). Incluye: renombrar con ícono lápiz, eliminar con confirmación, selección en modo multi-delete, y validación de nombre único a nivel de UI y BD.
- **Lista de secundarios colapsable**: si un primario tiene más de 1 secundario, la lista empieza colapsada con encabezado "Part. Secundarios (N)" expandible. Con 1 secundario siempre visible. El modo selección fuerza expansión de todas las listas.
- **EventDetail — Tab Gastos: lista expandible de pagadores múltiples**: en la card de cada gasto, cuando hay más de un pagador, la segunda fila muestra `"Pagado por: X Personas"` con un chevron ▼/▲ tocable. Al expandir, se listan todos los pagadores con su nombre y monto individual en filas separadas. Gastos de pagador único mantienen el comportamiento anterior.

### 🔧 Correcciones de Bugs
- **Liquidaciones no consolidaban secundarios**: `useCalculations` generaba liquidaciones independientes para cada secundario. Corregido: se consolida el balance de cada secundario en su primario antes de calcular liquidaciones óptimas. Mismo fix aplicado en `database.ts → recalculateSettlementsForEvent`.
- **Balance del primario no reflejaba secundarios**: la card de balance del participante primario ahora suma automáticamente el balance de todos sus secundarios.
- **Nombres duplicados en creación de secundarios**: al eliminar y recrear un secundario, el contador podía generar el mismo nombre. Corregido con bucle de próximo número libre. Validación duplicada también en BD (`addSecondaryParticipant`).

### ✨ Mejoras
- **Diferenciación visual de secundarios en CreateExpense**: en la lista de división del gasto, los participantes secundarios se muestran indentados (`paddingLeft: 28`), con fondo tintado (`surfaceVariant`), color secundario y fuente reducida (`fontSize: 13`).
- **Diferenciación visual de secundarios en detalle del gasto**: en el modal de detalle, la sección "División del Gasto" muestra secundarios con indentación, prefijo `↳`, color secundario y fuente reducida. El contador del título excluye secundarios.
- **Orden de secundarios debajo de su primario**: tanto en `CreateExpense` (lista de división) como en el modal de detalle del gasto, los participantes secundarios aparecen inmediatamente debajo de su primario correspondiente, ordenados alfabéticamente dentro de cada grupo.
- **Mensajes WhatsApp — sección Representados**: `handleShareSummary` y `handleShareEvent` excluyen secundarios del conteo/listado de participantes e incluyen sección `👨‍👦 *Representados*`. Formato compacto en resumen (`_Nombre_ => N`) y lista en compartir completo. Línea de alias cambiada a `💳 Alias => *alias*`.
- **EventDetail — Mensajes de compartir (WhatsApp y portapapeles)**: acortadas las líneas divisoras `━━━━━━━━━━━━━━━━━━` → `━━━━━━━`. Añadido espacio en blanco extra entre grupos de gastos. Corregida posición del separador en el bloque de advertencia del evento activo.
- **NotificationService — Notificación de pago recibido vía WhatsApp**: reorganizado el orden de los campos. Insertadas líneas divisoras entre encabezado, datos y pie.
- **LanguageContext — i18n completo para participantes secundarios**: claves `participants.addSecondary`, `secondary`, `secondaryOf`, `removeSecondary`, `confirmRemoveSecondary`, `secondaryAdded`, `secondaryNamePlaceholder`, `secondaryNameLabel` presentes en ES, EN y PT.
- **LanguageContext — i18n modo selección de participantes en EN y PT**: corregidas 6 claves faltantes (`participants.selectMode`, `cancelSelect`, `selectedCount`, `deleteSelected`, `confirmDeleteSelected`, `deletedSelected`) que mostraban texto en español en inglés y portugués.
- **LanguageContext — Nuevas claves i18n** `expenses.paidByPersons` / `expenses.paidByPerson` en ES, EN y PT.

### 🔢 Versiones
- **versionCode**: 19 → 20
- **versionName**: "1.6.0" → "1.7.0"

---


## [1.6.0] - 2026-04-10

### 🚀 Nuevas Funcionalidades
- **CreateExpense — Calculadora integrada**: nuevo botón 🧮 al lado del campo Monto que abre un modal de calculadora con operaciones `+`, `-`, `×`, `÷`. Display estilo calculadora tradicional: número en edición abajo (grande) y expresión acumulada arriba (pequeño). Botones "Volver" (1/3) y "Usar (resultado)" (2/3) en el footer
- **CreateExpense — Calculadora: comportamiento post-`=`**: al presionar un operador después de `=`, el resultado se convierte en el primer operando de la nueva expresión
- **CreateExpense — Calculadora: confirmación sin `=`**: si el usuario presiona "Usar" con una expresión pendiente (sin haber presionado `=`), se muestra un popup de confirmación que evalúa y muestra el resultado antes de aplicarlo al monto

### 🔧 Correcciones de Bugs
- **ProfileScreen — Modal "Acerca de": claves i18n faltantes**: eliminadas las secciones "Seguridad y Privacidad" y "Desarrollo" del modal que referenciaban claves inexistentes (`profile.about.privacyCommitment`, `privacyItem1-4Title/Desc`, `devTeam`, `devTeamDesc`), lo que causaba que se mostraran los nombres de variable crudos en pantalla en lugar de texto real
- **ProfileScreen — historial de versiones corrompido**: restaurados todos los emojis e íconos del historial v1.0.0–v1.5.0 que aparecían como `?` y `??` tras ejecutar `versiones.ps1`
- **ProfileScreen — caracteres acentuados**: corregidos todos los `\uFFFD` en comentarios JSX, sección "Seguridad y Privacidad", modal de estadísticas e información técnica
- **ProfileScreen — contaminación `${f.name}`**: eliminados prefijos espurios `${f.name}` en bullet points de la sección de privacidad, detalles de error de importación y sección de info técnica de BD que causaban `ReferenceError: Property 'f' doesn't exist` al abrir el perfil
- **ProfileScreen — sintaxis JSX**: corregido cierre `>` faltante en `<ScrollView>` del modal de historial que generaba `SyntaxError: Unexpected token, expected "..."` (línea 1661)
- **versiones.ps1 — corrupción UTF-8**: agregado `-Encoding UTF8` en `Get-Content` y `Set-Content` del archivo `ProfileScreen/index.tsx` para evitar que futuros incrementos de versión corrompan emojis y caracteres acentuados
- **CreateExpense — Calculadora: decimales perdidos**: corregido bug donde valores decimales (ej: `15.75`) llegaban al campo Monto sin la parte decimal debido a un `replace('.', ',')` incorrecto previo al formateo

### ✨ Mejoras
- **versiones.ps1**: lectura y escritura de `ProfileScreen/index.tsx` ahora siempre en UTF-8, previene regresión permanente del problema de encoding

### 🔢 Versiones
- **versionCode**: 18 → 19
- **versionName**: "1.5.0" → "1.6.0"

---


## [1.5.0] - 2026-04-08

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
- ✨ **CreateExpense — Soporte para múltiples pagadores (Opción B — tabla `expense_payers`)**: un gasto ahora puede ser pagado por más de una persona. En la card "¿Quién pagó?" se agregó un switch "Múltiples pagadores". Al activarlo, aparece la lista de todos los participantes del evento con checkboxes (todos desmarcados por defecto). Al marcar un participante, el monto se distribuye automáticamente en partes iguales entre los seleccionados. El monto por pagador es editable manualmente; si la suma no coincide con el total del gasto, se muestra un indicador de alerta en rojo. El modo simple (pagador único) mantiene el comportamiento anterior con buscador y radio buttons. Los datos se persisten en la nueva tabla `expense_payers` en SQLite, retrocompatible con gastos existentes de pagador único. Los cálculos de balances y liquidaciones (`calculations.ts` y `database.ts → calculateBalancesFromData`) se actualizaron para usar los pagadores reales cuando existen. Al editar un gasto multi-pagador existente, el formulario carga correctamente el estado previo. EventDetail (tab Gastos) muestra los nombres de todos los pagadores separados por coma. En el modal de detalle del gasto, cuando hay múltiples pagadores, el campo "Pagado por" muestra cada pagador en su propia fila con nombre y monto en negrita (en lugar de nombres separados por coma).

### 🔧 Correcciones de Bugs
- ✅ **database.ts — `getExpenses()` no hidrataba el campo `payers`**: el método público `getExpenses()` (usado por `DataContext.refreshData`) mapeaba los gastos sin consultar la tabla `expense_payers`. Como resultado, el array `expenses` del estado global llegaba sin `payers` al motor de cálculo (`CalculationService` y `calculateBalancesFromData`), que caía al fallback `payerId` y acreditaba el monto completo del gasto al primer pagador. Corregido: `getExpenses()` ahora hace un JOIN con `expense_payers` e hidrata el campo `payers` del mismo modo que `getExpensesByEvent()`.
- ✅ **EventDetail — Tab Participantes mostraba `totalPaid` incorrecto en gastos multi-pagador**: la sección de participantes calculaba `totalPaid` localmente como `eventExpenses.filter(e => e.payerId === participant.id).reduce(...)`, sumando el monto completo del gasto para el pagador principal aunque hubiera múltiples pagadores. Corregido: el cálculo ahora usa el mismo patrón que `calculations.ts`: si el gasto tiene `payers`, busca el monto específico de ese participante; si no, usa el comportamiento anterior con `payerId`.
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
- **EventDetail — Cards de participantes: montos de pagado/división más grandes**: `fontSize` subido de `11` a `13` con `fontWeight: '500'`. El 💰 (pagado) solo se muestra si el monto es mayor a # Changelog - SplitSmart

## [1.9.0] - 2026-04-19

### 🚀 Nuevas Funcionalidades
- **Tour guiado (TutorialOverlay)** — componente nuevo creado desde cero (`src/components/TutorialOverlay/index.tsx`):
- Overlay oscuro con recorte highlight sobre el elemento destacado
- Borde del highlight con 4 Views independientes (evita clipping en bordes de pantalla)
- Estado `transitioning` que oculta el popup durante la transición entre pasos (sin flash)
- Soporte para `onBeforeShow` (callback antes de mostrar el paso) y `delay` configurable por paso
- Corrección de offset de StatusBar en Android
- Guard contra `currentStep >= steps.length`
- **Tour en Home** — 4 pasos: banner de bienvenida, métricas, lista de eventos, acciones rápidas
- **Tour en EventDetail** — 7 pasos con cambio automático de tab (resumen → participantes → gastos), navegación prev/next correcta
- **Tour en CreateExpense** — 5 pasos con scroll automático a cada card; `ceScrollRef` para desplazamiento previo a `measureInWindow`
- **Tour en CreateEvent** — 4 pasos con scroll automático; nuevo `cevScrollRef`
- **Tour en ManageFriends** — 4 pasos con cambio de tab al paso "Crear amigo"
- **Tour en ProfileScreen** — 9 pasos con scroll automático por sección
- **Tour en AddParticipantModal** — 4 pasos con cambio de tab (amigos → nuevo → en masa); `apFriendsRef` cubre SearchBar + lista
- **Tour en SignUpScreen** — 4 pasos con scroll automático: datos personales, contacto, contraseña, botón crear cuenta

### 🔧 Correcciones de Bugs
- **TutorialOverlay — borde inferior invisible**: reemplazado `borderWidth:2` único por 4 Views de 2px posicionadas absolutamente; el borde ya no se recorta al borde de pantalla
- **TutorialOverlay — flash de popup durante transición**: estado `transitioning` renderiza solo overlay oscuro mientras `onBeforeShow` espera; popup solo aparece cuando `measureInWindow` termina
- **CreateExpense — popup fuera de pantalla en pasos 2-5**: `scrollToCard()` con `measureLayout` hace scroll previo al elemento antes de medir; popup siempre visible
- **AddParticipantModal — paso 2 highlight incorrecto**: `apFriendsRef` movido al return principal cubriendo SearchBar + lista (antes estaba solo dentro de `renderFriendsTab`)
- **AddParticipantModal — error `measureInWindow is not a function`** en paso 3: `KeyboardAvoidingView` no expone `measureInWindow`; envuelto en `<View ref={apNewRef}>` wrapper
- **AddParticipantModal — error `Adjacent JSX elements`**: `return (` + `<Modal` faltante tras agregar el wrapper `</View>` al cerrar `renderNewParticipantTab`
- **LanguageContext — doble coma `,,`** en línea PT `tour.addParticipant.friends.desc`: corregida via PowerShell `TrimEnd(',')`

### ✨ Mejoras
- **Paso 1 eliminado** (header) de los tours de: EventDetail, ProfileScreen, ManageFriends — el tour arranca directamente en el contenido útil
- **AddParticipantModal** — eliminado botón X (cerrar) del HeaderBar; la pantalla ya se cierra con el botón de la barra de navegación
- **ForgotPasswordScreen** — eliminado icono `?` (ayuda) del HeaderBar (sin tour implementado)
- **LoginScreen** — eliminado icono `?` (ayuda) del HeaderBar (sin tour implementado)
- **CreateExpense / CreateEvent** — al abrir el tour, scroll automático al tope (`scrollTo({ y: 0, animated: false })`) para garantizar que el paso 1 siempre esté visible
- **Traducciones** — claves tour agregadas en ES, EN y PT para: `tour.eventdetail.*`, `tour.addParticipant.*`, `tour.createExpense.*`, `tour.createEvent.*`, `tour.signUp.*`

### 🔢 Versiones
- **versionCode**: 21 → 22
- **versionName**: "1.8.0" → "1.9.0"

---


## [1.8.0] - 2026-04-15

### 🚀 Nuevas Funcionalidades
- **Cerrar sesión en todos los menús de HeaderBar**: nueva prop `showLogout` en `HeaderBar`. Al activarla aparece la opción "Cerrar sesión" (en rojo, con separador) al final del menú desplegable. La confirmación usa idioma activo (es/en/pt). Se eliminó la lógica de logout dispersa en cada pantalla.
- **Selección múltiple con "Todos"**: en el modo selección de gastos y participantes se puede tildar/destildar todos de un toque. La barra muestra checkbox circular a la izquierda (vacío / parcial / completo) con el texto "Todos" y los botones de acción (🗑 / ✕) como íconos circulares a la derecha.
- **Sistema de 3 estados de eventos** (`Activo → Bloqueado → Cerrado`):
- `Activo` — todo editable (gastos, participantes, pagos)
- `Bloqueado` — solo se pueden registrar/deshacer pagos; gastos y participantes de solo lectura
- `Cerrado` — lectura total, sin ninguna modificación posible
- Migración automática de DB: eventos `completed` → `active + is_locked=1`
- Nueva columna `is_locked INTEGER` en tabla `events`
- Botones en EventDetail: Bloquear / Desbloquear / Cerrar / Reactivar según estado
- Badge de estado con colores: 🟢 Activo (verde) / 🔒 Bloqueado (naranja) / 📁 Cerrado (gris)
- Barra naranja en EventCard para eventos bloqueados
- Métricas y filtros en Home actualizados para los 3 estados
- **Deshacer pagos con selección múltiple**: nueva sección "Liquidaciones Pagadas" con botón de activar modo selección (ícono circular pequeño), checkbox-all, contador de seleccionados y botón rojo de deshacer. Mismo patrón visual que gastos/participantes.
- **Alertas personalizadas en CreateEvent**: todos los `Alert.alert` nativos migrados a `showAlert` (con borde de color por tipo).

### 🔧 Correcciones de Bugs
- **Estado vacío de gastos**: el link "Agregar participantes primero →" fue reemplazado por "Se deben Agregar Participantes" con el mismo estilo de link y navegación a la pestaña de participantes.
- **Deshacer pagos en bulk no funcionaba**: el segundo `showAlert` de confirmación reemplazaba al primero, dejando un pago sin deshacer. Corregido con parámetro `skipConfirmation` en `handleToggleSettlementPaid` para el bulk undo.
- **Bloquear evento seguía permitiendo agregar gastos/participantes**: los botones del UI usaban `event?.status === 'active'` en lugar de `isEditable`. Corregidas 6 ocurrencias en las pestañas de Gastos y Participantes.
- **Badge de estado mostraba clave cruda `metrics.locked`**: clave inexistente; reemplazada por `events.locked` con valor `"Bloqueado"`.
- **Status "Archivado" en badge y share**: `events.archived` ahora devuelve `"Cerrado"` / `"Closed"` / `"Fechado"` en los 3 idiomas.
- **Filtro "Bloqueados" en Home no traía eventos**: el `useMemo` de `eventsWithAmounts` no propagaba el campo `isLocked` del evento original; siempre era `undefined` y el filtro nunca matcheaba.
- **Alertas en Home sin borde de color**: variable local `showAlert` sobreescribía el import; se corrigió migrando los 7 `Alert.alert` nativos.

### ✨ Mejoras
- **UX barra de selección**: diseño rediseñado (gastos y participantes) con patrón checkbox-izquierda + acciones-derecha, acorde a apps modernas. Sin filas de botones de texto saturadas.
- **Texto uniforme**: ambos modos de selección muestran "Todos" cuando no hay nada seleccionado (antes decían "Seleccionar Todos" vs "Todos" de forma inconsistente).
- `HeaderBar`: `useAuth` y `showAlert` importados internamente — las pantallas ya no necesitan manejar logout propio.
- **Ícono de deshacer pagos reducido**: botón de activar modo deshacer pasó de `36×36` con ícono `18px` a `28×28` con ícono `14px` para no competir visualmente con el badge de cuenta.

### 🔢 Versiones
- **versionCode**: 20 → 21
- **versionName**: "1.7.0" → "1.8.0"

---


## [1.7.0] - 2026-04-13

### 🚀 Nuevas Funcionalidades
- **Participantes Secundarios (representados)**: sistema completo de participantes secundarios como entidades reales en la BD. Un participante primario puede tener N representados; cada secundario se crea con el botón `+` y recibe nombre automático `{Primario} - Nro N` (próximo número libre sin colisión). Incluye: renombrar con ícono lápiz, eliminar con confirmación, selección en modo multi-delete, y validación de nombre único a nivel de UI y BD.
- **Lista de secundarios colapsable**: si un primario tiene más de 1 secundario, la lista empieza colapsada con encabezado "Part. Secundarios (N)" expandible. Con 1 secundario siempre visible. El modo selección fuerza expansión de todas las listas.
- **EventDetail — Tab Gastos: lista expandible de pagadores múltiples**: en la card de cada gasto, cuando hay más de un pagador, la segunda fila muestra `"Pagado por: X Personas"` con un chevron ▼/▲ tocable. Al expandir, se listan todos los pagadores con su nombre y monto individual en filas separadas. Gastos de pagador único mantienen el comportamiento anterior.

### 🔧 Correcciones de Bugs
- **Liquidaciones no consolidaban secundarios**: `useCalculations` generaba liquidaciones independientes para cada secundario. Corregido: se consolida el balance de cada secundario en su primario antes de calcular liquidaciones óptimas. Mismo fix aplicado en `database.ts → recalculateSettlementsForEvent`.
- **Balance del primario no reflejaba secundarios**: la card de balance del participante primario ahora suma automáticamente el balance de todos sus secundarios.
- **Nombres duplicados en creación de secundarios**: al eliminar y recrear un secundario, el contador podía generar el mismo nombre. Corregido con bucle de próximo número libre. Validación duplicada también en BD (`addSecondaryParticipant`).

### ✨ Mejoras
- **Diferenciación visual de secundarios en CreateExpense**: en la lista de división del gasto, los participantes secundarios se muestran indentados (`paddingLeft: 28`), con fondo tintado (`surfaceVariant`), color secundario y fuente reducida (`fontSize: 13`).
- **Diferenciación visual de secundarios en detalle del gasto**: en el modal de detalle, la sección "División del Gasto" muestra secundarios con indentación, prefijo `↳`, color secundario y fuente reducida. El contador del título excluye secundarios.
- **Orden de secundarios debajo de su primario**: tanto en `CreateExpense` (lista de división) como en el modal de detalle del gasto, los participantes secundarios aparecen inmediatamente debajo de su primario correspondiente, ordenados alfabéticamente dentro de cada grupo.
- **Mensajes WhatsApp — sección Representados**: `handleShareSummary` y `handleShareEvent` excluyen secundarios del conteo/listado de participantes e incluyen sección `👨‍👦 *Representados*`. Formato compacto en resumen (`_Nombre_ => N`) y lista en compartir completo. Línea de alias cambiada a `💳 Alias => *alias*`.
- **EventDetail — Mensajes de compartir (WhatsApp y portapapeles)**: acortadas las líneas divisoras `━━━━━━━━━━━━━━━━━━` → `━━━━━━━`. Añadido espacio en blanco extra entre grupos de gastos. Corregida posición del separador en el bloque de advertencia del evento activo.
- **NotificationService — Notificación de pago recibido vía WhatsApp**: reorganizado el orden de los campos. Insertadas líneas divisoras entre encabezado, datos y pie.
- **LanguageContext — i18n completo para participantes secundarios**: claves `participants.addSecondary`, `secondary`, `secondaryOf`, `removeSecondary`, `confirmRemoveSecondary`, `secondaryAdded`, `secondaryNamePlaceholder`, `secondaryNameLabel` presentes en ES, EN y PT.
- **LanguageContext — i18n modo selección de participantes en EN y PT**: corregidas 6 claves faltantes (`participants.selectMode`, `cancelSelect`, `selectedCount`, `deleteSelected`, `confirmDeleteSelected`, `deletedSelected`) que mostraban texto en español en inglés y portugués.
- **LanguageContext — Nuevas claves i18n** `expenses.paidByPersons` / `expenses.paidByPerson` en ES, EN y PT.

### 🔢 Versiones
- **versionCode**: 19 → 20
- **versionName**: "1.6.0" → "1.7.0"

---


## [1.6.0] - 2026-04-10

### 🚀 Nuevas Funcionalidades
- **CreateExpense — Calculadora integrada**: nuevo botón 🧮 al lado del campo Monto que abre un modal de calculadora con operaciones `+`, `-`, `×`, `÷`. Display estilo calculadora tradicional: número en edición abajo (grande) y expresión acumulada arriba (pequeño). Botones "Volver" (1/3) y "Usar (resultado)" (2/3) en el footer
- **CreateExpense — Calculadora: comportamiento post-`=`**: al presionar un operador después de `=`, el resultado se convierte en el primer operando de la nueva expresión
- **CreateExpense — Calculadora: confirmación sin `=`**: si el usuario presiona "Usar" con una expresión pendiente (sin haber presionado `=`), se muestra un popup de confirmación que evalúa y muestra el resultado antes de aplicarlo al monto

### 🔧 Correcciones de Bugs
- **ProfileScreen — Modal "Acerca de": claves i18n faltantes**: eliminadas las secciones "Seguridad y Privacidad" y "Desarrollo" del modal que referenciaban claves inexistentes (`profile.about.privacyCommitment`, `privacyItem1-4Title/Desc`, `devTeam`, `devTeamDesc`), lo que causaba que se mostraran los nombres de variable crudos en pantalla en lugar de texto real
- **ProfileScreen — historial de versiones corrompido**: restaurados todos los emojis e íconos del historial v1.0.0–v1.5.0 que aparecían como `?` y `??` tras ejecutar `versiones.ps1`
- **ProfileScreen — caracteres acentuados**: corregidos todos los `\uFFFD` en comentarios JSX, sección "Seguridad y Privacidad", modal de estadísticas e información técnica
- **ProfileScreen — contaminación `${f.name}`**: eliminados prefijos espurios `${f.name}` en bullet points de la sección de privacidad, detalles de error de importación y sección de info técnica de BD que causaban `ReferenceError: Property 'f' doesn't exist` al abrir el perfil
- **ProfileScreen — sintaxis JSX**: corregido cierre `>` faltante en `<ScrollView>` del modal de historial que generaba `SyntaxError: Unexpected token, expected "..."` (línea 1661)
- **versiones.ps1 — corrupción UTF-8**: agregado `-Encoding UTF8` en `Get-Content` y `Set-Content` del archivo `ProfileScreen/index.tsx` para evitar que futuros incrementos de versión corrompan emojis y caracteres acentuados
- **CreateExpense — Calculadora: decimales perdidos**: corregido bug donde valores decimales (ej: `15.75`) llegaban al campo Monto sin la parte decimal debido a un `replace('.', ',')` incorrecto previo al formateo

### ✨ Mejoras
- **versiones.ps1**: lectura y escritura de `ProfileScreen/index.tsx` ahora siempre en UTF-8, previene regresión permanente del problema de encoding

### 🔢 Versiones
- **versionCode**: 18 → 19
- **versionName**: "1.5.0" → "1.6.0"

---

.
- **LanguageContext — Nuevas claves para liquidaciones pagadas** (`summary.paidSettlements`, `summary.paidSettlementsEmpty`, `summary.paidOn`) en ES, EN y PT.
- **EventDetail — Tab Resumen: card "Liquidaciones Pagadas" oculta en eventos completados**: si el evento tiene `status === 'completed'`, la card no se renderiza ya que no es necesaria en ese estado.
- **LanguageContext — Nuevas claves para eliminación múltiple de gastos** (`expenses.selectMode`, `expenses.cancelSelect`, `expenses.selectedCount`, `expenses.deleteSelected`, `expenses.confirmDeleteSelected`, `expenses.deletedSelected`) en ES (sección adicional y principal), EN y PT.
- **EventDetail — Tab Gastos: modo selección se resetea al cambiar de tab**: al navegar a otro tab y volver, los gastos siempre se muestran en modo normal (sin selección activa).

### 🔢 Versiones
- **versionCode**: 17 → 18
- **versionName**: "1.4.10" → "1.5.0"

---


## [1.4.10] - 2026-04-06

### 🚀 Nuevas Funcionalidades
_(ninguna)_

### 🔧 Correcciones de Bugs
- ✅ **LanguageSelector — Modal no aparecía al abrirlo desde el overflow del HeaderBar**: Android no soporta Modals anidados. El modal de selección de idioma estaba siendo renderizado dentro del modal del overflow. Solucionado extrayendo el `LanguageSelector` al nivel del `HeaderBar` con control externo via props `visible`/`onClose`, renderizándolo fuera del modal de overflow.
- ✅ **ProfileScreen — Labels `profile.dataStats` y `profile.changelogTitle` se mostraban como clave sin traducir**: las claves existían en `es.json` pero no estaban definidas en `LanguageContext.tsx`. Agregadas en los 3 idiomas (ES/EN/PT).
- ✅ **ProfileScreen — Bloque v1.4.9 ausente en el historial modal**: el script `versiones.ps1` no insertaba el bloque porque buscaba el marcador con `.IndexOf()` exacto pero el comentario tenía texto adicional. Corregido usando `[regex]::Match()` tolerante a texto extra. El bloque v1.4.9 fue insertado manualmente.

### ✨ Mejoras
- **`versiones.ps1` — Búsqueda del marcador de versión con regex**: reemplazado `.IndexOf("{/* Versión $curVer")` por `[regex]::Match()` para tolerar cualquier texto después del número de versión en el comentario JSX.

### 🔢 Versiones
- **versionCode**: 15 → 16
- **versionName**: "1.4.9" → "1.4.10"

---


## [1.4.9] - 2026-04-06

### 🚀 Nuevas Funcionalidades
- ✨ **Script `build-all.ps1`**: nuevo script PowerShell para generar APK y/o AAB en un solo comando, con parámetros `-APK`, `-AAB` y `-Copia`.

### 🔧 Correcciones de Bugs
- ✅ **DataContext — `getSplitsByEvent` con datos stale**: leía del estado en memoria (`splits`) en lugar de la BD. Al volver de `CreateExpense`, `useFocusEffect` llamaba `loadEventData()` antes de que el estado se propagara. Corregido consultando `databaseService.getSplitsByEvent(eventId)` directamente, garantizando datos frescos.
- ✅ **EventDetail — Balance de participantes incorrecto con consolidaciones**: el cálculo anterior usaba `participantBalance.balance` del contexto, que no incorporaba settlements pagados, montos condonados (auto-cancelación) ni deudas absorbidas por terceros. Reescrito calculando directamente desde `eventExpenses` y `eventSplits`, con ajustes por `paidByParticipant`, `receivedByParticipant`, `forgivenAmount`, `absorbedByThirdParty`, `forgivenToOthers` y `absorbedFromOthers`.
- ✅ **EventDetail — Doble conteo en balance cuando settlement condonado se marca como pagado**: los filtros de consolidación (`forgivenAmount`, `absorbedByThirdParty`, `forgivenToOthers`, `absorbedFromOthers`) no excluían los settlements ya pagados, causando que un monto se contara tanto en `paidByParticipant` como en los ajustes de consolidación. Corregido agregando `if (s.isPaid) return false` como primer guard en cada filtro.

### ✨ Mejoras
- **EventDetail — Refresco de datos al cambiar de tab**: nuevo `useEffect` sobre `activeTab` que llama `loadEventData()` al navegar a los tabs `participantes` o `gastos`, garantizando balances siempre actualizados sin necesidad de salir y volver a entrar al evento.
- **EventDetail — Layout de importes del participante**: cambiado de `flexDirection: 'row'` a `flexDirection: 'column'` en la fila de montos (💰 pagado / 💵 debe), mejorando la legibilidad en nombres largos.
- **EventDetail — Visualización de monto efectivo adeudado**: cuando hay condonación o absorción activa, el monto `💵 debe` ahora muestra el original tachado y el monto real que queda pendiente (ej. ~~$50.00~~ → # Changelog - SplitSmart

## [1.9.0] - 2026-04-19

### 🚀 Nuevas Funcionalidades
- **Tour guiado (TutorialOverlay)** — componente nuevo creado desde cero (`src/components/TutorialOverlay/index.tsx`):
- Overlay oscuro con recorte highlight sobre el elemento destacado
- Borde del highlight con 4 Views independientes (evita clipping en bordes de pantalla)
- Estado `transitioning` que oculta el popup durante la transición entre pasos (sin flash)
- Soporte para `onBeforeShow` (callback antes de mostrar el paso) y `delay` configurable por paso
- Corrección de offset de StatusBar en Android
- Guard contra `currentStep >= steps.length`
- **Tour en Home** — 4 pasos: banner de bienvenida, métricas, lista de eventos, acciones rápidas
- **Tour en EventDetail** — 7 pasos con cambio automático de tab (resumen → participantes → gastos), navegación prev/next correcta
- **Tour en CreateExpense** — 5 pasos con scroll automático a cada card; `ceScrollRef` para desplazamiento previo a `measureInWindow`
- **Tour en CreateEvent** — 4 pasos con scroll automático; nuevo `cevScrollRef`
- **Tour en ManageFriends** — 4 pasos con cambio de tab al paso "Crear amigo"
- **Tour en ProfileScreen** — 9 pasos con scroll automático por sección
- **Tour en AddParticipantModal** — 4 pasos con cambio de tab (amigos → nuevo → en masa); `apFriendsRef` cubre SearchBar + lista
- **Tour en SignUpScreen** — 4 pasos con scroll automático: datos personales, contacto, contraseña, botón crear cuenta

### 🔧 Correcciones de Bugs
- **TutorialOverlay — borde inferior invisible**: reemplazado `borderWidth:2` único por 4 Views de 2px posicionadas absolutamente; el borde ya no se recorta al borde de pantalla
- **TutorialOverlay — flash de popup durante transición**: estado `transitioning` renderiza solo overlay oscuro mientras `onBeforeShow` espera; popup solo aparece cuando `measureInWindow` termina
- **CreateExpense — popup fuera de pantalla en pasos 2-5**: `scrollToCard()` con `measureLayout` hace scroll previo al elemento antes de medir; popup siempre visible
- **AddParticipantModal — paso 2 highlight incorrecto**: `apFriendsRef` movido al return principal cubriendo SearchBar + lista (antes estaba solo dentro de `renderFriendsTab`)
- **AddParticipantModal — error `measureInWindow is not a function`** en paso 3: `KeyboardAvoidingView` no expone `measureInWindow`; envuelto en `<View ref={apNewRef}>` wrapper
- **AddParticipantModal — error `Adjacent JSX elements`**: `return (` + `<Modal` faltante tras agregar el wrapper `</View>` al cerrar `renderNewParticipantTab`
- **LanguageContext — doble coma `,,`** en línea PT `tour.addParticipant.friends.desc`: corregida via PowerShell `TrimEnd(',')`

### ✨ Mejoras
- **Paso 1 eliminado** (header) de los tours de: EventDetail, ProfileScreen, ManageFriends — el tour arranca directamente en el contenido útil
- **AddParticipantModal** — eliminado botón X (cerrar) del HeaderBar; la pantalla ya se cierra con el botón de la barra de navegación
- **ForgotPasswordScreen** — eliminado icono `?` (ayuda) del HeaderBar (sin tour implementado)
- **LoginScreen** — eliminado icono `?` (ayuda) del HeaderBar (sin tour implementado)
- **CreateExpense / CreateEvent** — al abrir el tour, scroll automático al tope (`scrollTo({ y: 0, animated: false })`) para garantizar que el paso 1 siempre esté visible
- **Traducciones** — claves tour agregadas en ES, EN y PT para: `tour.eventdetail.*`, `tour.addParticipant.*`, `tour.createExpense.*`, `tour.createEvent.*`, `tour.signUp.*`

### 🔢 Versiones
- **versionCode**: 21 → 22
- **versionName**: "1.8.0" → "1.9.0"

---


## [1.8.0] - 2026-04-15

### 🚀 Nuevas Funcionalidades
- **Cerrar sesión en todos los menús de HeaderBar**: nueva prop `showLogout` en `HeaderBar`. Al activarla aparece la opción "Cerrar sesión" (en rojo, con separador) al final del menú desplegable. La confirmación usa idioma activo (es/en/pt). Se eliminó la lógica de logout dispersa en cada pantalla.
- **Selección múltiple con "Todos"**: en el modo selección de gastos y participantes se puede tildar/destildar todos de un toque. La barra muestra checkbox circular a la izquierda (vacío / parcial / completo) con el texto "Todos" y los botones de acción (🗑 / ✕) como íconos circulares a la derecha.
- **Sistema de 3 estados de eventos** (`Activo → Bloqueado → Cerrado`):
- `Activo` — todo editable (gastos, participantes, pagos)
- `Bloqueado` — solo se pueden registrar/deshacer pagos; gastos y participantes de solo lectura
- `Cerrado` — lectura total, sin ninguna modificación posible
- Migración automática de DB: eventos `completed` → `active + is_locked=1`
- Nueva columna `is_locked INTEGER` en tabla `events`
- Botones en EventDetail: Bloquear / Desbloquear / Cerrar / Reactivar según estado
- Badge de estado con colores: 🟢 Activo (verde) / 🔒 Bloqueado (naranja) / 📁 Cerrado (gris)
- Barra naranja en EventCard para eventos bloqueados
- Métricas y filtros en Home actualizados para los 3 estados
- **Deshacer pagos con selección múltiple**: nueva sección "Liquidaciones Pagadas" con botón de activar modo selección (ícono circular pequeño), checkbox-all, contador de seleccionados y botón rojo de deshacer. Mismo patrón visual que gastos/participantes.
- **Alertas personalizadas en CreateEvent**: todos los `Alert.alert` nativos migrados a `showAlert` (con borde de color por tipo).

### 🔧 Correcciones de Bugs
- **Estado vacío de gastos**: el link "Agregar participantes primero →" fue reemplazado por "Se deben Agregar Participantes" con el mismo estilo de link y navegación a la pestaña de participantes.
- **Deshacer pagos en bulk no funcionaba**: el segundo `showAlert` de confirmación reemplazaba al primero, dejando un pago sin deshacer. Corregido con parámetro `skipConfirmation` en `handleToggleSettlementPaid` para el bulk undo.
- **Bloquear evento seguía permitiendo agregar gastos/participantes**: los botones del UI usaban `event?.status === 'active'` en lugar de `isEditable`. Corregidas 6 ocurrencias en las pestañas de Gastos y Participantes.
- **Badge de estado mostraba clave cruda `metrics.locked`**: clave inexistente; reemplazada por `events.locked` con valor `"Bloqueado"`.
- **Status "Archivado" en badge y share**: `events.archived` ahora devuelve `"Cerrado"` / `"Closed"` / `"Fechado"` en los 3 idiomas.
- **Filtro "Bloqueados" en Home no traía eventos**: el `useMemo` de `eventsWithAmounts` no propagaba el campo `isLocked` del evento original; siempre era `undefined` y el filtro nunca matcheaba.
- **Alertas en Home sin borde de color**: variable local `showAlert` sobreescribía el import; se corrigió migrando los 7 `Alert.alert` nativos.

### ✨ Mejoras
- **UX barra de selección**: diseño rediseñado (gastos y participantes) con patrón checkbox-izquierda + acciones-derecha, acorde a apps modernas. Sin filas de botones de texto saturadas.
- **Texto uniforme**: ambos modos de selección muestran "Todos" cuando no hay nada seleccionado (antes decían "Seleccionar Todos" vs "Todos" de forma inconsistente).
- `HeaderBar`: `useAuth` y `showAlert` importados internamente — las pantallas ya no necesitan manejar logout propio.
- **Ícono de deshacer pagos reducido**: botón de activar modo deshacer pasó de `36×36` con ícono `18px` a `28×28` con ícono `14px` para no competir visualmente con el badge de cuenta.

### 🔢 Versiones
- **versionCode**: 20 → 21
- **versionName**: "1.7.0" → "1.8.0"

---


## [1.7.0] - 2026-04-13

### 🚀 Nuevas Funcionalidades
- **Participantes Secundarios (representados)**: sistema completo de participantes secundarios como entidades reales en la BD. Un participante primario puede tener N representados; cada secundario se crea con el botón `+` y recibe nombre automático `{Primario} - Nro N` (próximo número libre sin colisión). Incluye: renombrar con ícono lápiz, eliminar con confirmación, selección en modo multi-delete, y validación de nombre único a nivel de UI y BD.
- **Lista de secundarios colapsable**: si un primario tiene más de 1 secundario, la lista empieza colapsada con encabezado "Part. Secundarios (N)" expandible. Con 1 secundario siempre visible. El modo selección fuerza expansión de todas las listas.
- **EventDetail — Tab Gastos: lista expandible de pagadores múltiples**: en la card de cada gasto, cuando hay más de un pagador, la segunda fila muestra `"Pagado por: X Personas"` con un chevron ▼/▲ tocable. Al expandir, se listan todos los pagadores con su nombre y monto individual en filas separadas. Gastos de pagador único mantienen el comportamiento anterior.

### 🔧 Correcciones de Bugs
- **Liquidaciones no consolidaban secundarios**: `useCalculations` generaba liquidaciones independientes para cada secundario. Corregido: se consolida el balance de cada secundario en su primario antes de calcular liquidaciones óptimas. Mismo fix aplicado en `database.ts → recalculateSettlementsForEvent`.
- **Balance del primario no reflejaba secundarios**: la card de balance del participante primario ahora suma automáticamente el balance de todos sus secundarios.
- **Nombres duplicados en creación de secundarios**: al eliminar y recrear un secundario, el contador podía generar el mismo nombre. Corregido con bucle de próximo número libre. Validación duplicada también en BD (`addSecondaryParticipant`).

### ✨ Mejoras
- **Diferenciación visual de secundarios en CreateExpense**: en la lista de división del gasto, los participantes secundarios se muestran indentados (`paddingLeft: 28`), con fondo tintado (`surfaceVariant`), color secundario y fuente reducida (`fontSize: 13`).
- **Diferenciación visual de secundarios en detalle del gasto**: en el modal de detalle, la sección "División del Gasto" muestra secundarios con indentación, prefijo `↳`, color secundario y fuente reducida. El contador del título excluye secundarios.
- **Orden de secundarios debajo de su primario**: tanto en `CreateExpense` (lista de división) como en el modal de detalle del gasto, los participantes secundarios aparecen inmediatamente debajo de su primario correspondiente, ordenados alfabéticamente dentro de cada grupo.
- **Mensajes WhatsApp — sección Representados**: `handleShareSummary` y `handleShareEvent` excluyen secundarios del conteo/listado de participantes e incluyen sección `👨‍👦 *Representados*`. Formato compacto en resumen (`_Nombre_ => N`) y lista en compartir completo. Línea de alias cambiada a `💳 Alias => *alias*`.
- **EventDetail — Mensajes de compartir (WhatsApp y portapapeles)**: acortadas las líneas divisoras `━━━━━━━━━━━━━━━━━━` → `━━━━━━━`. Añadido espacio en blanco extra entre grupos de gastos. Corregida posición del separador en el bloque de advertencia del evento activo.
- **NotificationService — Notificación de pago recibido vía WhatsApp**: reorganizado el orden de los campos. Insertadas líneas divisoras entre encabezado, datos y pie.
- **LanguageContext — i18n completo para participantes secundarios**: claves `participants.addSecondary`, `secondary`, `secondaryOf`, `removeSecondary`, `confirmRemoveSecondary`, `secondaryAdded`, `secondaryNamePlaceholder`, `secondaryNameLabel` presentes en ES, EN y PT.
- **LanguageContext — i18n modo selección de participantes en EN y PT**: corregidas 6 claves faltantes (`participants.selectMode`, `cancelSelect`, `selectedCount`, `deleteSelected`, `confirmDeleteSelected`, `deletedSelected`) que mostraban texto en español en inglés y portugués.
- **LanguageContext — Nuevas claves i18n** `expenses.paidByPersons` / `expenses.paidByPerson` en ES, EN y PT.

### 🔢 Versiones
- **versionCode**: 19 → 20
- **versionName**: "1.6.0" → "1.7.0"

---


## [1.6.0] - 2026-04-10

### 🚀 Nuevas Funcionalidades
- **CreateExpense — Calculadora integrada**: nuevo botón 🧮 al lado del campo Monto que abre un modal de calculadora con operaciones `+`, `-`, `×`, `÷`. Display estilo calculadora tradicional: número en edición abajo (grande) y expresión acumulada arriba (pequeño). Botones "Volver" (1/3) y "Usar (resultado)" (2/3) en el footer
- **CreateExpense — Calculadora: comportamiento post-`=`**: al presionar un operador después de `=`, el resultado se convierte en el primer operando de la nueva expresión
- **CreateExpense — Calculadora: confirmación sin `=`**: si el usuario presiona "Usar" con una expresión pendiente (sin haber presionado `=`), se muestra un popup de confirmación que evalúa y muestra el resultado antes de aplicarlo al monto

### 🔧 Correcciones de Bugs
- **ProfileScreen — Modal "Acerca de": claves i18n faltantes**: eliminadas las secciones "Seguridad y Privacidad" y "Desarrollo" del modal que referenciaban claves inexistentes (`profile.about.privacyCommitment`, `privacyItem1-4Title/Desc`, `devTeam`, `devTeamDesc`), lo que causaba que se mostraran los nombres de variable crudos en pantalla en lugar de texto real
- **ProfileScreen — historial de versiones corrompido**: restaurados todos los emojis e íconos del historial v1.0.0–v1.5.0 que aparecían como `?` y `??` tras ejecutar `versiones.ps1`
- **ProfileScreen — caracteres acentuados**: corregidos todos los `\uFFFD` en comentarios JSX, sección "Seguridad y Privacidad", modal de estadísticas e información técnica
- **ProfileScreen — contaminación `${f.name}`**: eliminados prefijos espurios `${f.name}` en bullet points de la sección de privacidad, detalles de error de importación y sección de info técnica de BD que causaban `ReferenceError: Property 'f' doesn't exist` al abrir el perfil
- **ProfileScreen — sintaxis JSX**: corregido cierre `>` faltante en `<ScrollView>` del modal de historial que generaba `SyntaxError: Unexpected token, expected "..."` (línea 1661)
- **versiones.ps1 — corrupción UTF-8**: agregado `-Encoding UTF8` en `Get-Content` y `Set-Content` del archivo `ProfileScreen/index.tsx` para evitar que futuros incrementos de versión corrompan emojis y caracteres acentuados
- **CreateExpense — Calculadora: decimales perdidos**: corregido bug donde valores decimales (ej: `15.75`) llegaban al campo Monto sin la parte decimal debido a un `replace('.', ',')` incorrecto previo al formateo

### ✨ Mejoras
- **versiones.ps1**: lectura y escritura de `ProfileScreen/index.tsx` ahora siempre en UTF-8, previene regresión permanente del problema de encoding

### 🔢 Versiones
- **versionCode**: 18 → 19
- **versionName**: "1.5.0" → "1.6.0"

---


## [1.5.0] - 2026-04-08

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
- ✨ **CreateExpense — Soporte para múltiples pagadores (Opción B — tabla `expense_payers`)**: un gasto ahora puede ser pagado por más de una persona. En la card "¿Quién pagó?" se agregó un switch "Múltiples pagadores". Al activarlo, aparece la lista de todos los participantes del evento con checkboxes (todos desmarcados por defecto). Al marcar un participante, el monto se distribuye automáticamente en partes iguales entre los seleccionados. El monto por pagador es editable manualmente; si la suma no coincide con el total del gasto, se muestra un indicador de alerta en rojo. El modo simple (pagador único) mantiene el comportamiento anterior con buscador y radio buttons. Los datos se persisten en la nueva tabla `expense_payers` en SQLite, retrocompatible con gastos existentes de pagador único. Los cálculos de balances y liquidaciones (`calculations.ts` y `database.ts → calculateBalancesFromData`) se actualizaron para usar los pagadores reales cuando existen. Al editar un gasto multi-pagador existente, el formulario carga correctamente el estado previo. EventDetail (tab Gastos) muestra los nombres de todos los pagadores separados por coma. En el modal de detalle del gasto, cuando hay múltiples pagadores, el campo "Pagado por" muestra cada pagador en su propia fila con nombre y monto en negrita (en lugar de nombres separados por coma).

### 🔧 Correcciones de Bugs
- ✅ **database.ts — `getExpenses()` no hidrataba el campo `payers`**: el método público `getExpenses()` (usado por `DataContext.refreshData`) mapeaba los gastos sin consultar la tabla `expense_payers`. Como resultado, el array `expenses` del estado global llegaba sin `payers` al motor de cálculo (`CalculationService` y `calculateBalancesFromData`), que caía al fallback `payerId` y acreditaba el monto completo del gasto al primer pagador. Corregido: `getExpenses()` ahora hace un JOIN con `expense_payers` e hidrata el campo `payers` del mismo modo que `getExpensesByEvent()`.
- ✅ **EventDetail — Tab Participantes mostraba `totalPaid` incorrecto en gastos multi-pagador**: la sección de participantes calculaba `totalPaid` localmente como `eventExpenses.filter(e => e.payerId === participant.id).reduce(...)`, sumando el monto completo del gasto para el pagador principal aunque hubiera múltiples pagadores. Corregido: el cálculo ahora usa el mismo patrón que `calculations.ts`: si el gasto tiene `payers`, busca el monto específico de ese participante; si no, usa el comportamiento anterior con `payerId`.
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
- **EventDetail — Cards de participantes: montos de pagado/división más grandes**: `fontSize` subido de `11` a `13` con `fontWeight: '500'`. El 💰 (pagado) solo se muestra si el monto es mayor a # Changelog - SplitSmart

## [1.9.0] - 2026-04-19

### 🚀 Nuevas Funcionalidades
- **Tour guiado (TutorialOverlay)** — componente nuevo creado desde cero (`src/components/TutorialOverlay/index.tsx`):
- Overlay oscuro con recorte highlight sobre el elemento destacado
- Borde del highlight con 4 Views independientes (evita clipping en bordes de pantalla)
- Estado `transitioning` que oculta el popup durante la transición entre pasos (sin flash)
- Soporte para `onBeforeShow` (callback antes de mostrar el paso) y `delay` configurable por paso
- Corrección de offset de StatusBar en Android
- Guard contra `currentStep >= steps.length`
- **Tour en Home** — 4 pasos: banner de bienvenida, métricas, lista de eventos, acciones rápidas
- **Tour en EventDetail** — 7 pasos con cambio automático de tab (resumen → participantes → gastos), navegación prev/next correcta
- **Tour en CreateExpense** — 5 pasos con scroll automático a cada card; `ceScrollRef` para desplazamiento previo a `measureInWindow`
- **Tour en CreateEvent** — 4 pasos con scroll automático; nuevo `cevScrollRef`
- **Tour en ManageFriends** — 4 pasos con cambio de tab al paso "Crear amigo"
- **Tour en ProfileScreen** — 9 pasos con scroll automático por sección
- **Tour en AddParticipantModal** — 4 pasos con cambio de tab (amigos → nuevo → en masa); `apFriendsRef` cubre SearchBar + lista
- **Tour en SignUpScreen** — 4 pasos con scroll automático: datos personales, contacto, contraseña, botón crear cuenta

### 🔧 Correcciones de Bugs
- **TutorialOverlay — borde inferior invisible**: reemplazado `borderWidth:2` único por 4 Views de 2px posicionadas absolutamente; el borde ya no se recorta al borde de pantalla
- **TutorialOverlay — flash de popup durante transición**: estado `transitioning` renderiza solo overlay oscuro mientras `onBeforeShow` espera; popup solo aparece cuando `measureInWindow` termina
- **CreateExpense — popup fuera de pantalla en pasos 2-5**: `scrollToCard()` con `measureLayout` hace scroll previo al elemento antes de medir; popup siempre visible
- **AddParticipantModal — paso 2 highlight incorrecto**: `apFriendsRef` movido al return principal cubriendo SearchBar + lista (antes estaba solo dentro de `renderFriendsTab`)
- **AddParticipantModal — error `measureInWindow is not a function`** en paso 3: `KeyboardAvoidingView` no expone `measureInWindow`; envuelto en `<View ref={apNewRef}>` wrapper
- **AddParticipantModal — error `Adjacent JSX elements`**: `return (` + `<Modal` faltante tras agregar el wrapper `</View>` al cerrar `renderNewParticipantTab`
- **LanguageContext — doble coma `,,`** en línea PT `tour.addParticipant.friends.desc`: corregida via PowerShell `TrimEnd(',')`

### ✨ Mejoras
- **Paso 1 eliminado** (header) de los tours de: EventDetail, ProfileScreen, ManageFriends — el tour arranca directamente en el contenido útil
- **AddParticipantModal** — eliminado botón X (cerrar) del HeaderBar; la pantalla ya se cierra con el botón de la barra de navegación
- **ForgotPasswordScreen** — eliminado icono `?` (ayuda) del HeaderBar (sin tour implementado)
- **LoginScreen** — eliminado icono `?` (ayuda) del HeaderBar (sin tour implementado)
- **CreateExpense / CreateEvent** — al abrir el tour, scroll automático al tope (`scrollTo({ y: 0, animated: false })`) para garantizar que el paso 1 siempre esté visible
- **Traducciones** — claves tour agregadas en ES, EN y PT para: `tour.eventdetail.*`, `tour.addParticipant.*`, `tour.createExpense.*`, `tour.createEvent.*`, `tour.signUp.*`

### 🔢 Versiones
- **versionCode**: 21 → 22
- **versionName**: "1.8.0" → "1.9.0"

---


## [1.8.0] - 2026-04-15

### 🚀 Nuevas Funcionalidades
- **Cerrar sesión en todos los menús de HeaderBar**: nueva prop `showLogout` en `HeaderBar`. Al activarla aparece la opción "Cerrar sesión" (en rojo, con separador) al final del menú desplegable. La confirmación usa idioma activo (es/en/pt). Se eliminó la lógica de logout dispersa en cada pantalla.
- **Selección múltiple con "Todos"**: en el modo selección de gastos y participantes se puede tildar/destildar todos de un toque. La barra muestra checkbox circular a la izquierda (vacío / parcial / completo) con el texto "Todos" y los botones de acción (🗑 / ✕) como íconos circulares a la derecha.
- **Sistema de 3 estados de eventos** (`Activo → Bloqueado → Cerrado`):
- `Activo` — todo editable (gastos, participantes, pagos)
- `Bloqueado` — solo se pueden registrar/deshacer pagos; gastos y participantes de solo lectura
- `Cerrado` — lectura total, sin ninguna modificación posible
- Migración automática de DB: eventos `completed` → `active + is_locked=1`
- Nueva columna `is_locked INTEGER` en tabla `events`
- Botones en EventDetail: Bloquear / Desbloquear / Cerrar / Reactivar según estado
- Badge de estado con colores: 🟢 Activo (verde) / 🔒 Bloqueado (naranja) / 📁 Cerrado (gris)
- Barra naranja en EventCard para eventos bloqueados
- Métricas y filtros en Home actualizados para los 3 estados
- **Deshacer pagos con selección múltiple**: nueva sección "Liquidaciones Pagadas" con botón de activar modo selección (ícono circular pequeño), checkbox-all, contador de seleccionados y botón rojo de deshacer. Mismo patrón visual que gastos/participantes.
- **Alertas personalizadas en CreateEvent**: todos los `Alert.alert` nativos migrados a `showAlert` (con borde de color por tipo).

### 🔧 Correcciones de Bugs
- **Estado vacío de gastos**: el link "Agregar participantes primero →" fue reemplazado por "Se deben Agregar Participantes" con el mismo estilo de link y navegación a la pestaña de participantes.
- **Deshacer pagos en bulk no funcionaba**: el segundo `showAlert` de confirmación reemplazaba al primero, dejando un pago sin deshacer. Corregido con parámetro `skipConfirmation` en `handleToggleSettlementPaid` para el bulk undo.
- **Bloquear evento seguía permitiendo agregar gastos/participantes**: los botones del UI usaban `event?.status === 'active'` en lugar de `isEditable`. Corregidas 6 ocurrencias en las pestañas de Gastos y Participantes.
- **Badge de estado mostraba clave cruda `metrics.locked`**: clave inexistente; reemplazada por `events.locked` con valor `"Bloqueado"`.
- **Status "Archivado" en badge y share**: `events.archived` ahora devuelve `"Cerrado"` / `"Closed"` / `"Fechado"` en los 3 idiomas.
- **Filtro "Bloqueados" en Home no traía eventos**: el `useMemo` de `eventsWithAmounts` no propagaba el campo `isLocked` del evento original; siempre era `undefined` y el filtro nunca matcheaba.
- **Alertas en Home sin borde de color**: variable local `showAlert` sobreescribía el import; se corrigió migrando los 7 `Alert.alert` nativos.

### ✨ Mejoras
- **UX barra de selección**: diseño rediseñado (gastos y participantes) con patrón checkbox-izquierda + acciones-derecha, acorde a apps modernas. Sin filas de botones de texto saturadas.
- **Texto uniforme**: ambos modos de selección muestran "Todos" cuando no hay nada seleccionado (antes decían "Seleccionar Todos" vs "Todos" de forma inconsistente).
- `HeaderBar`: `useAuth` y `showAlert` importados internamente — las pantallas ya no necesitan manejar logout propio.
- **Ícono de deshacer pagos reducido**: botón de activar modo deshacer pasó de `36×36` con ícono `18px` a `28×28` con ícono `14px` para no competir visualmente con el badge de cuenta.

### 🔢 Versiones
- **versionCode**: 20 → 21
- **versionName**: "1.7.0" → "1.8.0"

---


## [1.7.0] - 2026-04-13

### 🚀 Nuevas Funcionalidades
- **Participantes Secundarios (representados)**: sistema completo de participantes secundarios como entidades reales en la BD. Un participante primario puede tener N representados; cada secundario se crea con el botón `+` y recibe nombre automático `{Primario} - Nro N` (próximo número libre sin colisión). Incluye: renombrar con ícono lápiz, eliminar con confirmación, selección en modo multi-delete, y validación de nombre único a nivel de UI y BD.
- **Lista de secundarios colapsable**: si un primario tiene más de 1 secundario, la lista empieza colapsada con encabezado "Part. Secundarios (N)" expandible. Con 1 secundario siempre visible. El modo selección fuerza expansión de todas las listas.
- **EventDetail — Tab Gastos: lista expandible de pagadores múltiples**: en la card de cada gasto, cuando hay más de un pagador, la segunda fila muestra `"Pagado por: X Personas"` con un chevron ▼/▲ tocable. Al expandir, se listan todos los pagadores con su nombre y monto individual en filas separadas. Gastos de pagador único mantienen el comportamiento anterior.

### 🔧 Correcciones de Bugs
- **Liquidaciones no consolidaban secundarios**: `useCalculations` generaba liquidaciones independientes para cada secundario. Corregido: se consolida el balance de cada secundario en su primario antes de calcular liquidaciones óptimas. Mismo fix aplicado en `database.ts → recalculateSettlementsForEvent`.
- **Balance del primario no reflejaba secundarios**: la card de balance del participante primario ahora suma automáticamente el balance de todos sus secundarios.
- **Nombres duplicados en creación de secundarios**: al eliminar y recrear un secundario, el contador podía generar el mismo nombre. Corregido con bucle de próximo número libre. Validación duplicada también en BD (`addSecondaryParticipant`).

### ✨ Mejoras
- **Diferenciación visual de secundarios en CreateExpense**: en la lista de división del gasto, los participantes secundarios se muestran indentados (`paddingLeft: 28`), con fondo tintado (`surfaceVariant`), color secundario y fuente reducida (`fontSize: 13`).
- **Diferenciación visual de secundarios en detalle del gasto**: en el modal de detalle, la sección "División del Gasto" muestra secundarios con indentación, prefijo `↳`, color secundario y fuente reducida. El contador del título excluye secundarios.
- **Orden de secundarios debajo de su primario**: tanto en `CreateExpense` (lista de división) como en el modal de detalle del gasto, los participantes secundarios aparecen inmediatamente debajo de su primario correspondiente, ordenados alfabéticamente dentro de cada grupo.
- **Mensajes WhatsApp — sección Representados**: `handleShareSummary` y `handleShareEvent` excluyen secundarios del conteo/listado de participantes e incluyen sección `👨‍👦 *Representados*`. Formato compacto en resumen (`_Nombre_ => N`) y lista en compartir completo. Línea de alias cambiada a `💳 Alias => *alias*`.
- **EventDetail — Mensajes de compartir (WhatsApp y portapapeles)**: acortadas las líneas divisoras `━━━━━━━━━━━━━━━━━━` → `━━━━━━━`. Añadido espacio en blanco extra entre grupos de gastos. Corregida posición del separador en el bloque de advertencia del evento activo.
- **NotificationService — Notificación de pago recibido vía WhatsApp**: reorganizado el orden de los campos. Insertadas líneas divisoras entre encabezado, datos y pie.
- **LanguageContext — i18n completo para participantes secundarios**: claves `participants.addSecondary`, `secondary`, `secondaryOf`, `removeSecondary`, `confirmRemoveSecondary`, `secondaryAdded`, `secondaryNamePlaceholder`, `secondaryNameLabel` presentes en ES, EN y PT.
- **LanguageContext — i18n modo selección de participantes en EN y PT**: corregidas 6 claves faltantes (`participants.selectMode`, `cancelSelect`, `selectedCount`, `deleteSelected`, `confirmDeleteSelected`, `deletedSelected`) que mostraban texto en español en inglés y portugués.
- **LanguageContext — Nuevas claves i18n** `expenses.paidByPersons` / `expenses.paidByPerson` en ES, EN y PT.

### 🔢 Versiones
- **versionCode**: 19 → 20
- **versionName**: "1.6.0" → "1.7.0"

---


## [1.6.0] - 2026-04-10

### 🚀 Nuevas Funcionalidades
- **CreateExpense — Calculadora integrada**: nuevo botón 🧮 al lado del campo Monto que abre un modal de calculadora con operaciones `+`, `-`, `×`, `÷`. Display estilo calculadora tradicional: número en edición abajo (grande) y expresión acumulada arriba (pequeño). Botones "Volver" (1/3) y "Usar (resultado)" (2/3) en el footer
- **CreateExpense — Calculadora: comportamiento post-`=`**: al presionar un operador después de `=`, el resultado se convierte en el primer operando de la nueva expresión
- **CreateExpense — Calculadora: confirmación sin `=`**: si el usuario presiona "Usar" con una expresión pendiente (sin haber presionado `=`), se muestra un popup de confirmación que evalúa y muestra el resultado antes de aplicarlo al monto

### 🔧 Correcciones de Bugs
- **ProfileScreen — Modal "Acerca de": claves i18n faltantes**: eliminadas las secciones "Seguridad y Privacidad" y "Desarrollo" del modal que referenciaban claves inexistentes (`profile.about.privacyCommitment`, `privacyItem1-4Title/Desc`, `devTeam`, `devTeamDesc`), lo que causaba que se mostraran los nombres de variable crudos en pantalla en lugar de texto real
- **ProfileScreen — historial de versiones corrompido**: restaurados todos los emojis e íconos del historial v1.0.0–v1.5.0 que aparecían como `?` y `??` tras ejecutar `versiones.ps1`
- **ProfileScreen — caracteres acentuados**: corregidos todos los `\uFFFD` en comentarios JSX, sección "Seguridad y Privacidad", modal de estadísticas e información técnica
- **ProfileScreen — contaminación `${f.name}`**: eliminados prefijos espurios `${f.name}` en bullet points de la sección de privacidad, detalles de error de importación y sección de info técnica de BD que causaban `ReferenceError: Property 'f' doesn't exist` al abrir el perfil
- **ProfileScreen — sintaxis JSX**: corregido cierre `>` faltante en `<ScrollView>` del modal de historial que generaba `SyntaxError: Unexpected token, expected "..."` (línea 1661)
- **versiones.ps1 — corrupción UTF-8**: agregado `-Encoding UTF8` en `Get-Content` y `Set-Content` del archivo `ProfileScreen/index.tsx` para evitar que futuros incrementos de versión corrompan emojis y caracteres acentuados
- **CreateExpense — Calculadora: decimales perdidos**: corregido bug donde valores decimales (ej: `15.75`) llegaban al campo Monto sin la parte decimal debido a un `replace('.', ',')` incorrecto previo al formateo

### ✨ Mejoras
- **versiones.ps1**: lectura y escritura de `ProfileScreen/index.tsx` ahora siempre en UTF-8, previene regresión permanente del problema de encoding

### 🔢 Versiones
- **versionCode**: 18 → 19
- **versionName**: "1.5.0" → "1.6.0"

---

.
- **LanguageContext — Nuevas claves para liquidaciones pagadas** (`summary.paidSettlements`, `summary.paidSettlementsEmpty`, `summary.paidOn`) en ES, EN y PT.
- **EventDetail — Tab Resumen: card "Liquidaciones Pagadas" oculta en eventos completados**: si el evento tiene `status === 'completed'`, la card no se renderiza ya que no es necesaria en ese estado.
- **LanguageContext — Nuevas claves para eliminación múltiple de gastos** (`expenses.selectMode`, `expenses.cancelSelect`, `expenses.selectedCount`, `expenses.deleteSelected`, `expenses.confirmDeleteSelected`, `expenses.deletedSelected`) en ES (sección adicional y principal), EN y PT.
- **EventDetail — Tab Gastos: modo selección se resetea al cambiar de tab**: al navegar a otro tab y volver, los gastos siempre se muestran en modo normal (sin selección activa).

### 🔢 Versiones
- **versionCode**: 17 → 18
- **versionName**: "1.4.10" → "1.5.0"

---


## [1.4.10] - 2026-04-06

### 🚀 Nuevas Funcionalidades
_(ninguna)_

### 🔧 Correcciones de Bugs
- ✅ **LanguageSelector — Modal no aparecía al abrirlo desde el overflow del HeaderBar**: Android no soporta Modals anidados. El modal de selección de idioma estaba siendo renderizado dentro del modal del overflow. Solucionado extrayendo el `LanguageSelector` al nivel del `HeaderBar` con control externo via props `visible`/`onClose`, renderizándolo fuera del modal de overflow.
- ✅ **ProfileScreen — Labels `profile.dataStats` y `profile.changelogTitle` se mostraban como clave sin traducir**: las claves existían en `es.json` pero no estaban definidas en `LanguageContext.tsx`. Agregadas en los 3 idiomas (ES/EN/PT).
- ✅ **ProfileScreen — Bloque v1.4.9 ausente en el historial modal**: el script `versiones.ps1` no insertaba el bloque porque buscaba el marcador con `.IndexOf()` exacto pero el comentario tenía texto adicional. Corregido usando `[regex]::Match()` tolerante a texto extra. El bloque v1.4.9 fue insertado manualmente.

### ✨ Mejoras
- **`versiones.ps1` — Búsqueda del marcador de versión con regex**: reemplazado `.IndexOf("{/* Versión $curVer")` por `[regex]::Match()` para tolerar cualquier texto después del número de versión en el comentario JSX.

### 🔢 Versiones
- **versionCode**: 15 → 16
- **versionName**: "1.4.9" → "1.4.10"

---

.00), en lugar del monto total original que confundía al usuario.
- **EventDetail — Sección "Condonadas automáticamente" en liquidaciones**: se agregó un bloque debajo de las liquidaciones activas que lista cada deuda condonada por consolidación (tachada, con label explicativo), visible solo en vista consolidada. Permite al usuario confirmar qué deudas fueron resueltas sin acción real.
- **EventDetail — Debug log de balance por participante**: cuando hay consolidaciones activas, se emite un `console.log` con todos los valores intermedios del cálculo de balance por participante, facilitando el diagnóstico de errores en producción.
- **`versiones.ps1` — Nuevo flujo Copilot**: la Parte 1 del script ahora muestra el git log y archivos modificados, pausa para que Copilot actualice `PENDING_CHANGES.md` directamente, y solo requiere intervención manual del usuario para decidir si incrementar la versión.

### 🔢 Versiones
- **versionCode**: 14 → 15
- **versionName**: "1.4.8" → "1.4.9"

---


## [1.4.8] - 2026-04-06

### 🚀 Nuevas Funcionalidades
_(ninguna)_

### 🔧 Correcciones de Bugs
- ✅ **Home — Contador de liquidaciones ignoraba condonaciones** (`src/screens/Home/index.tsx`): el `total` en la card del evento incluía liquidaciones condonadas por consolidación, que nunca se marcan `isPaid`. Se carga el mapa de asignaciones de consolidación y se descuentan los auto-pagos del total. Corrige que la card nunca llegara al 100% cuando existían condonaciones.
- ✅ **EventDetail — Balance de participante ignoraba liquidaciones confirmadas** (`src/screens/EventDetail/index.tsx`): la card calculaba el balance con valores brutos (`totalPaid - totalOwed`) que no variaban al confirmar liquidaciones. Ahora usa `participantBalance.balance` del hook `useCalculations`, que descuenta los `paidSettlements` reactivamente en cada `loadEventData()`.
- ✅ **EventDetail — Balance de participante ignoraba condonaciones** (`src/screens/EventDetail/index.tsx`): participantes cuya deuda fue condonada seguían en rojo. Se agrega `forgivenAmount` por participante (settlements donde el pagador real post-asignación coincide con el acreedor) y se suma al balance neto.

### ✨ Mejoras
- **EventDetail — Desglose en cards de participantes**: cada card muestra 💰 lo que pagó en gastos (verde) y 💵 lo que le corresponde aportar (rojo), permitiendo entender el balance a simple vista.
- **EventDetail — Etiqueta de estado removida**: se eliminó el texto "Se le debe / Debe pagar / Equilibrado"; el color del monto es indicador suficiente.
- **EventDetail — Badge de consolidación/condonación**: bajo el nombre del participante aparece una leyenda naranja ("Pagado por otro" o "Deuda condonada") cuando su deuda fue afectada por la consolidación.

### 🔢 Versiones
- **versionCode**: 13 → 14
- **versionName**: "1.4.7" → "1.4.8"

---

## [1.4.7] - 2026-04-02

### 🚀 Nuevas Funcionalidades
_(ninguna)_

### 🔧 Correcciones de Bugs
- ✅ Validación de nombres duplicados (case-insensitive) en `ManageFriends` y `AddParticipantModal` — error inline sin Alert
- ✅ Sección "Seguridad" oculta correctamente en modo edición del perfil
- ✅ Modal cambio de contraseña reconstruido: campo contraseña actual con validación DB, indicador de fortaleza en tiempo real (6 niveles), botones ojo en los 3 campos, botón Confirmar deshabilitado si no coinciden
- ✅ Validación y filtrado de teléfono en tiempo real en los 5 campos de la app (SignUp, Perfil, AddParticipantModal, ManageFriends, EventDetail)
- ✅ Validación y filtrado de email en tiempo real en los 5 campos de la app; mensajes de error descriptivos con formato esperado
- ✅ Mensaje de email inválido en SignUp más descriptivo (indica formato `usuario@dominio.com`)

### ✨ Mejoras
- **Secciones colapsables en Perfil**: Seguridad, Preferencias, Notificaciones, Privacidad, Datos y Respaldo, Información de la App inician contraídas y se despliegan al tocar el header

### 🔢 Versiones
- **versionCode**: 12 → 13
- **versionName**: "1.4.6" → "1.4.7"

---

## [1.4.6] - 2026-03-31

### 🚀 Nuevas Funcionalidades
- **Icono SplitSmart en HeaderBar**: Logo de la app visible a la izquierda del título en todas las pantallas (excepto Login)
- **Patrón de validación visual unificado** (`submittedOnce`): campos obligatorios muestran `*` rojo y label en rojo al intentar guardar con campo vacío — implementado en 9 pantallas y modales: `SignUpScreen`, `LoginScreen`, `ForgotPasswordScreen`, `CreateEvent`, `CreateExpense`, `ManageFriends`, `ProfileScreen`, `EditParticipantModal` y `AddParticipantModal`
- **Prop `isModal` en HeaderBar**: nuevo prop que elimina el `paddingTop: 30` cuando el componente se usa dentro de modales `pageSheet`

### 🔧 Correcciones de Bugs
- ✅ Bug en `SignUpScreen`: campo username duplicaba caracteres al tener `.toLowerCase()` en `onChangeText` — corregido aplicando la transformación solo al validar/enviar
- ✅ Doble asterisco en campos obligatorios: eliminado `*` hardcodeado de textos de traducción (ES/EN/PT) en `CreateEvent/language.ts`, `CreateExpense/language.ts`, `LanguageContext.tsx` (`eventDetail.labelName`, `addParticipant.fullNameLabel`)
- ✅ Safe Area top en modales `ConsolidationModal`, `ExpenseDetailModal` y `ParticipantInfoModal`: corregido `edges` de `['top','bottom','left','right']` a `['bottom','left','right']`
- ✅ Botón "Aplicar" en `ConsolidationModal` quedaba oculto con muchos ítems: movido fuera del `ScrollView`
- ✅ Overflow menu desalineado: ajustado `top: 88` (era `110`)
- ✅ Traducción `consolidationModal.applyButton` no existía: agregada en ES y EN en `LanguageContext.tsx`

### ✨ Mejoras
- **Botón "Crear cuenta" fijo al pie** en `SignUpScreen`: movido fuera del `ScrollView` para que siempre sea visible con el teclado abierto
- **Unificación estética de 3 modales**: `ConsolidationModal`, `ExpenseDetailModal` y `ParticipantInfoModal` comparten estructura `Modal presentationStyle="pageSheet"` + `SafeAreaView` + `HeaderBar` estándar con `showLogo={true}`, `isModal={true}`, `useDynamicColors={true}`
- **`build-apk.ps1`**: directorio de copia backup cambiado a `C:\Users\cbalu\Dropbox\VsCode\SplitSmart APK`

### 🔢 Versiones
- **versionCode**: 11 → 12
- **versionName**: "1.4.5" → "1.4.6"

---

## [1.4.5] - 2026-03-24

### 🔧 Correcciones de Bugs
- ✅ Ruta del ícono de la app corregida en `app.json` (`splash-icon-app_google.png` estaba fuera de la subcarpeta `splitsmart/`)

### ✨ Mejoras
- ✅ Mensajes de WhatsApp (Compartir Resumen y Compartir Evento): agregadas líneas divisoras `━━━` para mejorar la legibilidad
- ✅ Nombres de destinatarios de liquidación con formato cursiva `_nombre_` y CBU en negrita `*cbu*`
- ✅ Saltos de línea corregidos en ambos mensajes (sin líneas en blanco duplicadas ni divisoras dobles)
- ✅ Bloque de consolidación con divisora de cierre en ambos mensajes
- ✅ Leyenda final `*Realizado con SplitSmart.*` agregada a todos los envíos por WhatsApp

### 🔢 Versiones
- **versionCode**: 10 → 11
- **versionName**: "1.4.4" → "1.4.5"

---

## [1.4.4] - 2026-03-18

### 🔧 Correcciones de Bugs
- ✅ Teclado virtual pisaba el contenido al desplegarse en todas las pantallas — corregido con `KeyboardAvoidingView` en `LoginScreen`, `SignUpScreen`, `ForgotPasswordScreen`, `CreateEvent`, `CreateExpense`, `ProfileScreen` y `ManageFriends`
- ✅ En `ManageFriends`, el formulario de nuevo amigo ahora es desplazable (`ScrollView`) para evitar que el teclado tape los campos inferiores
- ✅ Android 15+: deshabilitado el forzado edge-to-edge (`PROPERTY_EDGE_TO_EDGE_ENFORCED=false`) que impedía que `adjustResize` funcionara correctamente en el `AndroidManifest.xml`
- ✅ Agregado `keyboardShouldPersistTaps="handled"` en los `ScrollView` de formularios para evitar que el teclado se cierre al tocar fuera de un input

### 🔢 Versiones
- **versionCode**: 9 → 10
- **versionName**: "1.4.3" → "1.4.4"

---

## [1.4.3] - 2026-03-09

### 🔧 Correcciones de Bugs
- ✅ Corregido bug crítico en importación: columna `settlement_type` inexistente en tabla `settlements` rompía toda la importación
- ✅ `getAllSettlements()` exportaba campos con nombres incorrectos (`from_id`, `isPaid`, `paidAt`) que no coincidían con el esquema real
- ✅ Eliminados `setTimeout` frágiles en `performImport` y `handleClearData`, reemplazados por flujo secuencial con `await`
- ✅ Texto `profile.privacySection` y `common.archive` mostraban el key crudo en lugar de la traducción
- ✅ Botón "Archivar" del popup mostraba `common.archive` sin traducir (faltaba en LanguageContext)
- ✅ Script `build-apk.ps1`: `Rename-Item` reemplazado por `Copy-Item` — ya no borra versiones anteriores del APK
- ✅ Ambos scripts de build copian el artefacto generado a `app_aab_apk/apk` y `app_aab_apk/aab`

### 🔢 Versiones
- **versionCode**: 8 → 9
- **versionName**: "1.4.2" → "1.4.3"

---

## [1.4.2] - 2026-03-08

### 🔧 Correcciones de Bugs
- ✅ Eliminados permisos obsoletos de Android: `READ_MEDIA_IMAGES`, `WRITE_EXTERNAL_STORAGE` y `READ_EXTERNAL_STORAGE` (reemplazados por Android Photo Picker nativo vía expo-image-picker)

### 🔢 Versiones
- **versionCode**: 7 → 8
- **versionName**: "1.4.1" → "1.4.2"

---

## [1.4.1] - 2026-03-08

### 🔧 Correcciones de Bugs
- ✅ Crash al editar participante temporal en EventDetail: `t is not defined` en `EditParticipantModalContent` (faltaba hook `useLanguage()`)
- ✅ Campos vacíos al abrir modal de edición: faltaba `useEffect` para sincronizar inputs con los datos reales del participante

### 🔢 Versiones
- **versionCode**: 6 → 7
- **versionName**: "1.4.0" → "1.4.1"

---

## [1.4.0] - 2026-03-04

### 🌍 Internacionalización — Auditoría y Migración Completa

#### Eliminación de Dead Code
- **EventDetail/language.ts eliminado**: 294 líneas de código nunca importado, migrado íntegramente a `LanguageContext.tsx`

#### EventDetail — 30+ strings hardcodeados reemplazados
- Todos los `Alert.alert()` de handlers ahora usan `t()`: `deleteExpense`, `editParticipant`, `removeParticipant`, `toggleSettlementPaid`, `unmarkPayment`, `clearConsolidations`, `createPaymentsFromSettlements`, `deleteEvent`, `showEventOptions`
- JSX del tab de pagos completamente traducido: título, estados Pendiente/Pagado, lista, estado vacío, Ver/Agregar comprobante
- Modal de edición de participante traducido: `convertToFriendTitle`, `convertToFriendSubtitle`, botones Cancelar/Guardar
- Estado de error `eventNotFound` + botón `back` traducidos

#### Home — Logout traducido
- `Home/language.ts`: nueva sección `logout` (ES/EN/PT) con `title`, `message`, `button`
- `Home/index.tsx`: `handleLogout` ahora usa `t.logout.*` y `t.actions.cancel`

#### ManageFriends — Errores traducidos
- `ManageFriends/language.ts`: nuevas claves `deleteFailed` y `saveFailed` en `alerts.error` (ES/EN/PT) + interface TypeScript actualizado
- `ManageFriends/index.tsx`: 2 strings hardcodeados en bloques `catch` reemplazados

#### LanguageContext.tsx — 38 nuevas claves × 3 idiomas
- Namespace `message.*`: 27 claves nuevas (confirmaciones, errores, advertencias de EventDetail)
- Namespace `eventDetail.*`: 11 claves nuevas (UI del tab de pagos y modal de edición)
- Clave `common.back` agregada en ES/EN/PT

### 📄 Documentación Legal — Google Play Ready

#### Política de Privacidad (ES + EN)
- Cumplimiento explícito de **Ley N° 25.326** (Habeas Data Argentina)
- Sección "Sus Derechos" con los 4 derechos reales del Habeas Data
- Descripción honesta de datos procesados (solo los que realmente toca la app)
- Eliminado: "enviamos notificaciones" y "datos técnicos del dispositivo" (falsos)
- Aclaración sobre recopilación independiente de Google Play Store
- Descripción real del permiso de cámara (solo comprobantes, con permiso expreso)

#### Términos de Servicio (ES + EN)
- **Disclaimer financiero explícito**: la app NO constituye asesoramiento financiero ni legal
- **Edad mínima**: 13 años (requerido por Google Play)
- **Limitación de responsabilidad** ampliada: 4 supuestos cubiertos (pérdida de datos, errores de cálculo, disputas entre usuarios, daños indirectos)
- **Jurisdicción**: Tribunales Ordinarios de Córdoba, Argentina — Ley argentina
- Eliminado email hardcodeado (`cbalucas@gmail.com`) — reemplazado por referencia a la sección Soporte
- Lenguaje actualizado de "empresa" a "desarrollador independiente"

#### Acerca de (ES + EN)
- Versión eliminada del texto descriptivo (ya no caduca con cada release)
- Feature `feature6`: reemplazado "100% privado sin servidores" por declaración verificable
- Copyright actualizado a 2026
- `madeWith`: refleja desarrollo independiente en Córdoba, Argentina

#### Contactar Soporte (ES + EN)
- Tiempo de respuesta: "24-48h" → "72 horas hábiles" con aclaración de disponibilidad variable (protección Ley 24.240)
- "Nuestro equipo" → "El desarrollador" (representación honesta para freelancer)

### 🔢 Versiones
- **versionCode**: 5 → 6
- **versionName**: "1.3.0" → "1.4.0"

---

## [1.3.0] - 2026-03-04

### 🚀 Nuevas Funcionalidades

#### EventCard — Botón de Eliminación
- **Eliminar evento desde la card**: Nuevo botón 🗑️ en la card del evento (entre editar y privacidad)
- **Protección de datos**: Solo visible cuando el evento no tiene participantes ni gastos
- **Confirmación**: Alert de confirmación antes de eliminar

#### EventCard — Contador de Liquidaciones
- **Indicador visual**: Fila `⚖️ (pagadas/total) liquidaciones` en cada card
- **Color indicativo**: Ícono en verde cuando todas están pagadas, naranja si hay pendientes
- **Se oculta**: No se muestra si el evento no tiene liquidaciones

#### Home — Filtro por Estado
- **MetricsCard interactiva**: Click en cada tarjeta (Activos / Completados / Archivados) filtra la lista
- **Toggle**: Click nuevamente en la misma tarjeta para quitar el filtro (mostrar todos)
- **Resaltado visual**: Tarjeta seleccionada con borde y valor de color destacado

#### Home — Ordenamiento de Eventos
- **Orden por estado**: Activos → Completados → Archivados
- **Suborden**: Por fecha de inicio, luego por nombre alfabético
- **Automático**: No requiere acción del usuario

### 🔧 Correcciones de Bugs

- ✅ **Editar evento**: Navegar a Home al guardar (antes iba a EventDetail)
- ✅ **Crear evento**: Reemplaza el stack de navegación hacia EventDetail (back va a Home)
- ✅ **Actualización al volver**: Cards del Home se recargan al volver desde EventDetail (useFocusEffect)
- ✅ **Conteo de liquidaciones pagadas**: Corrección del campo `isPaid` (camelCase booleano)

### 🔢 Versiones
- **versionCode**: 4 → 5
- **versionName**: "1.2.0" → "1.3.0"

---

## [1.2.0] - 2025-12-23

### 🚀 Funcionalidades Principales Nuevas

#### Sistema de Auto-Login Inteligente
- **Auto-login robusto**: Sistema inteligente basado en último usuario que inició sesión
- **Seguimiento de sesiones**: Campo `last_login` para tracking preciso de actividad
- **Lógica de fallback**: Fallback automático al usuario DEMO cuando corresponde
- **Configuración independiente**: Skip-password y auto-login configurables por separado
- **Persistencia de configuración**: Las preferencias se mantienen entre reinicios de app
- **Validación en inicialización**: Verificación de configuraciones al arranque

#### Datos de Ejemplo Completos para DEMO
- **3 eventos realistas**: Asado Fin de Año, Viaje Bariloche, Cumpleaños María
- **Estados diversos**: Activo, completado, archivado con datos coherentes
- **4 participantes variados**: Amigos permanentes y participantes temporales
- **10 gastos contextualizados**: Montos realistas en pesos argentinos
- **5 liquidaciones diversas**: Estados pagada, pendiente, consolidada
- **Opción de regeneración**: Función para recrear datos de ejemplo desde perfil

### 💎 Mejoras de Base de Datos

#### Sistema Robusto de Migraciones
- **Migraciones automáticas**: Sistema de actualización de esquema sin intervención
- **Campo last_login**: Nuevo campo para tracking de sesiones de usuario
- **Validaciones de integridad**: Verificación de foreign keys y consistencia
- **Diagnósticos avanzados**: Estadísticas detalladas de tablas y registros
- **Verificación de esquema**: Comprobación automática en inicialización
- **Manejo mejorado de errores**: Logging detallado para debugging de BD

### 🎨 Mejoras de Interfaz y UX

#### Modal de Estadísticas de BD
- **Información técnica**: Conteo de registros por tabla
- **Estado de migraciones**: Visualización del estado del esquema
- **Herramientas de diagnóstico**: Verificación de integridad de datos

#### Historial de Versiones Expandible  
- **Changelog completo**: Historial detallado con categorías organizadas
- **Información expandible**: Secciones colapsables por versión
- **Navegación mejorada**: Interfaz más intuitiva para explorar cambios

### 🔧 Mejoras Técnicas y Estabilidad

#### Corrección Completa de TypeScript
- **Errores eliminados**: Corrección de todos los errores de compilación TS
- **Tipos mejorados**: Definiciones más precisas para todas las funciones
- **Validaciones robustas**: Manejo mejorado de tipos nullable y opcionales

#### Sistema de Build Optimizado
- **EAS Build mejorado**: Configuración optimizada con `appVersionSource: local`
- **Project ID actualizado**: Vinculación correcta con servicios de Expo
- **Build local robusto**: Scripts PowerShell y Gradle funcionando correctamente

#### Arquitectura Mejorada
- **Código más limpio**: Refactoring para mejor mantenibilidad
- **Performance optimizada**: Consultas de BD más eficientes
- **Manejo de errores**: Sistema robusto de captura y logging de errores

### 🌐 Localización Completa

#### Traducciones Auto-Login
- **Español**: Traducciones completas para todas las opciones de auto-login
- **Inglés**: Términos técnicos y opciones de configuración
- **Portugués**: Localización completa para mercado brasileño

### 🛠️ Herramientas de Desarrollo

#### Versionado Automático
- **Scripts actualizados**: Herramientas para incremento automático de versión  
- **Sincronización de archivos**: app.json, package.json, build.gradle coordinados
- **APK generation**: Múltiples métodos de generación (EAS, Gradle, scripts)

### 📊 Experiencia del Usuario DEMO

#### Onboarding Mejorado
- **Datos realistas**: Ejemplos que muestran el verdadero potencial de la app
- **Casos de uso diversos**: Desde gastos simples hasta viajes complejos
- **Estados de liquidación**: Ejemplos de todos los flujos posibles

## [1.1.0] - 2025-12-15

### 🚀 Mejoras Principales

#### Sistema de Liquidaciones
- **Corrección crítica**: Sistema de liquidaciones ahora recalcula automáticamente cuando se agregan nuevos gastos
- **Logging mejorado**: Agregado debugging detallado para rastrear cálculos de balances y settlements
- **Sincronización automática**: Las liquidaciones se actualizan instantáneamente al modificar gastos o participantes
- **Fix de parámetros**: Corregido problema donde eventStatus llegaba como array en lugar de string

#### Interfaz de Usuario - Home
- **Avatar rediseñado**: Movido el avatar del HeaderBar a un FAB más grande y prominente
- **Botón de cerrar sesión**: Agregado botón de logout con confirmación de seguridad
- **FAB dual**: Sistema de dos botones flotantes (crear evento + perfil/logout)
- **Colores dinámicos**: Mejorado contraste de iconos en HeaderBar con colores dinámicos

#### Mejoras Técnicas
- **Cálculos optimizados**: Servicio de cálculos moderno con mejor manejo de settlements
- **Dependencias corregidas**: useEffect mejorado para reaccionar correctamente a cambios
- **Compatibilidad**: Mantenida compatibilidad con sistema legacy de payments

### 🔧 Correcciones de Bugs
- ✅ Liquidaciones no se mostraban en la primera carga de gastos
- ✅ Settlements no se actualizaban al agregar gastos de diferentes participantes
- ✅ Avatar del header era muy pequeño y poco visible
- ✅ Faltaba opción accesible para cerrar sesión
- ✅ Iconos del header tenían problemas de contraste en temas dinámicos

### 🎨 Mejoras de UX/UI
- **Experiencia mejorada**: Liquidaciones más responsivas y precisas
- **Navegación intuitiva**: FAB más accesible para acciones principales
- **Feedback visual**: Confirmaciones de logout para evitar cierres accidentales
- **Consistencia visual**: Mejor integración de colores y temas

## [1.3.0] - 2025-11-26

### ✨ Nuevas Funcionalidades

#### Mejoras de Login
- **Visualización de contraseña**: Botón de ojo para mostrar/ocultar contraseña al escribir
- **Login case-insensitive**: Usuario y email ahora se validan sin distinguir mayúsculas/minúsculas

#### Perfil de Usuario
- **Edición de contraseña**: Nueva opción en modo edición para cambiar la contraseña actual
- Sección "Seguridad" con validación mínima de 6 caracteres

### 🔧 Mejoras

#### Gestión de Amigos
- **Corrección de UI**: El mensaje de "No tienes amigos" ya no se desplaza cuando se abre el modal de agregar
- Mejor experiencia visual al abrir formularios

### ⚠️ FUNCIONALIDADES REMOVIDAS (Para re-implementación futura)

#### Sistema de Multiplicador de Personas (peopleCount)
**NOTA**: Esta funcionalidad se removió temporalmente para correcciones. Se re-implementará en versión futura.

**Concepto eliminado**:
- Participantes representando múltiples personas (×1-20)
- Badge `👥×N` en UI
- Override excepcional por gasto
- Cálculo proporcional según peopleCount
- Integración en mensajes WhatsApp con "Nombre (×3)"
- Tab "Masivo" en modal de participantes
- Creación bulk con nombres personalizados/genéricos

**Archivos afectados en esta remoción**:
- `src/types/index.ts`: Eliminado peopleCount y peopleCountOverride
- `src/services/database.ts`: Eliminadas columnas people_count y people_count_override
- `src/services/calculations.ts`: Vuelto a división simple (sin multiplicadores)
- `src/context/DataContext.tsx`: Eliminado parámetro peopleCount de funciones
- `src/components/AddParticipantModal/index.tsx`: Eliminado tab masivo, stepper, estados bulk
- `src/screens/EventDetail/index.tsx`: Eliminados badges peopleCount y referencias en WhatsApp
- `src/screens/CreateExpense/index.tsx`: Eliminado override UI y lógica de recálculo con peopleCount

**Preservado**:
- ✅ Participantes Amigos vs Temporales (participantType)
- ✅ Filtrado de lista de amigos
- ✅ Badges ⭐ (amigo) y ⏱️ (temporal)
- ✅ SafeAreaView en todas las pantallas

### 🔢 Versiones
- **versionCode**: 3 → 4
- **versionName**: "1.2.0" → "1.3.0"

---

## [1.2.0] - 2025-11-26 [REVERTIDO]

### ✨ Nuevas Funcionalidades

#### Sistema de Multiplicador de Personas
- **Participantes múltiples**: Ahora un participante puede representar a varias personas (ej: traer familia a un evento)
- **Configuración por evento**: Al agregar un participante al evento, se puede especificar cuántas personas representa (1-20)
- **Override excepcional**: En gastos específicos, se puede modificar el número de personas que representa cada participante
- **Cálculo proporcional**: Los gastos se dividen proporcionalmente según el número de personas que representa cada participante
  - Ejemplo: Si Pedro representa 3 personas y Juan 1 persona, Pedro paga 3× más que Juan
- **Indicadores visuales**:
  - Badge `👥×N` en listas de participantes cuando representa más de 1 persona
  - Badge en rojo `👥×N*` cuando hay un override activo en un gasto específico
  - Botón de edición para modificar el multiplicador en gastos
- **Integración WhatsApp**: Los mensajes de liquidación muestran "Nombre (×3)" para clarificar los montos

#### Gestión de Participantes Amigos y Temporales
- **Participantes Amigos**: Guardados permanentemente para reutilizar en múltiples eventos
- **Participantes Temporales**: Solo existen en el evento específico
- **Toggle en modal**: Opción "Guardar como amigo permanente" al crear nuevo participante
- **Indicadores visuales**:
  - ⭐ Badge dorado para amigos permanentes
  - ⏱️ Badge gris para participantes temporales
- **Filtrado automático**: La lista de participantes muestra solo amigos y temporales activos del evento
- **Lista inteligente**: Al agregar participantes, solo se muestran aquellos que no están ya en el evento

#### Creación Masiva de Participantes
- **Nuevo tab "Masivo"**: Tercera opción en el modal de agregar participantes
- **Dos modos de creación**:
  - **Nombres Personalizados**: Input multilínea para escribir nombres (uno por línea)
    - Ejemplo: "Juan Pérez", "María González", "Carlos López"
    - Contador dinámico de nombres ingresados
    - Toggle opcional: "Guardar todos como amigos"
  - **Nombres Genéricos**: Selector numérico (1-50 participantes)
    - Genera: "Participante - 1", "Participante - 2", etc.
    - Preview de los primeros 3 nombres
    - Siempre se crean como temporales (sin opción de guardar como amigos)
- **Configuración común**:
  - peopleCount aplicable a todos los participantes creados
  - Validación de límites (1-50 genéricos, sin límite en personalizados)
  - ScrollView para acceso completo al formulario
- **Feedback claro**: Alert de confirmación con cantidad de participantes creados
- **Filtrado inteligente**: Lista "Mis Amigos" muestra solo participantes tipo 'friend'

### 🔧 Mejoras

#### Cálculos de División con peopleCount
- **Recálculo automático**: Al editar un gasto, los montos se recalculan considerando el peopleCount actual de cada participante
- **Participantes nuevos**: Al agregar un participante después de crear gastos, sus divisiones futuras consideran su peopleCount
- **División igual inteligente**: El modo "igual" distribuye proporcionalmente según el número de personas que representa cada participante
- **Sincronización**: Los cambios en el monto del gasto recalculan automáticamente las divisiones con peopleCount

#### Correcciones de SafeArea
- Solucionado problema de overlap con iconos del sistema Android
- Todas las pantallas ahora usan SafeAreaView con los 4 bordes (top, bottom, left, right)
- Soporte completo para modo edge-to-edge de Android

### 🗄️ Base de Datos

#### Migraciones Automáticas
- `event_participants.people_count`: Nueva columna para almacenar cuántas personas representa cada participante (DEFAULT 1)
- `splits.people_count_override`: Nueva columna para override excepcional por gasto específico (NULL = usar valor por defecto)
- Las migraciones se ejecutan automáticamente al iniciar la app

### 📝 Archivos Modificados

#### SafeArea (12 archivos)
- `App.tsx`: SplashScreen con SafeAreaView
- `src/screens/Auth/LoginScreen.tsx`
- `src/screens/CreateEvent/index.tsx`
- `src/screens/CreateExpense/index.tsx`
- `src/screens/EventDetail/index.tsx`
- `src/screens/Home/index.tsx`
- `src/screens/ManageFriends/index.tsx`
- `src/screens/ProfileScreen/index.tsx`
- `src/screens/SummaryScreen/index.tsx` (3 instancias)
- `src/components/AddParticipantModal/index.tsx`

#### Gestión de Participantes (2 archivos)
- `src/screens/EventDetail/index.tsx`: Filtrado de participantes visibles y badges visuales
- `src/components/AddParticipantModal/index.tsx`: 
  - Tabs: 'friends', 'new', 'bulk'
  - Creación masiva con nombres personalizados o genéricos
  - Estados: bulkNameType, bulkCustomNames, bulkGenericCount, bulkPeopleCount, bulkSaveAsFriend
  - Función handleCreateBulkParticipants()
  - Componente renderBulkTab()
  - Estilos: bulkTypeSelector, bulkTypeButton, textArea, inputHint

#### Sistema de Multiplicador (10 archivos)
- `src/types/index.ts`: Interfaces EventParticipant y Split actualizadas
- `src/services/database.ts`: Migraciones y operaciones CRUD
- `src/services/calculations.ts`: Algoritmo de división con pesos
- `src/context/DataContext.tsx`: Funciones actualizadas con parámetro peopleCount
- `src/components/AddParticipantModal/index.tsx`: UI con stepper +/- (1-20)
- `src/screens/EventDetail/index.tsx`: Badge visual y mensajes WhatsApp
- `src/screens/CreateExpense/index.tsx`: Override excepcional con Alert.prompt

### 🔢 Versiones
- **versionCode**: 2 → 3
- **versionName**: "1.1.0" → "1.2.0"
- Archivos actualizados: `package.json`, `app.json`, `android/app/build.gradle`

---

## [1.1.0] - 2025-11-XX

### Funcionalidades iniciales
- Gestión de eventos y gastos compartidos
- División de gastos: igual, porcentaje, personalizada
- Cálculo automático de liquidaciones
- Gestión de amigos/participantes
- Compartir por WhatsApp
- Exportar/importar eventos
- Múltiples monedas
- Soporte multiidioma (ES/EN)
- Temas claro/oscuro
- Autenticación biométrica

---

## [1.0.0] - 2025-11-XX

### Lanzamiento Inicial
- Versión base de la aplicación
