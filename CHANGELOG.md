# Historial de versiones — SplitSmart

---

## [1.9.1] — 27 de abril de 2026

### ✨ Novedades
- **Modo ayuda mejorado en Evento Express**: después de leer la respuesta a tu pregunta, aparecen botones para ver más opciones, volver al menú principal o salir. Ya no hace falta adivinar qué hacer después de consultar la ayuda.

### ✨ Mejoras
- El botón "Salir" en Evento Express cambió a color naranja para que sea más fácil de distinguir del resto de las opciones.
- Al agregar un amigo o participante con un nombre muy corto (menos de 2 letras), la app ahora bloquea el guardado y te lo avisa en el momento.

---

## [1.9.0] — 19 de abril de 2026

### ✨ Novedades
- **Tours guiados en toda la app**: agregamos recorridos interactivos paso a paso en las principales pantallas. La primera vez que entrás a una sección, podés activar el tour tocando el ícono `?` y te explicamos qué hace cada parte de la pantalla. Disponible en Inicio, Detalle de Evento, Cargar Gasto, Crear Evento, Amigos, Perfil, Agregar Participantes y Registro de cuenta.

### 🔧 Problemas resueltos
- El resaltado del tour a veces se cortaba en el borde de la pantalla. Ahora se ve completo.
- En algunos pasos del tour el globo de texto aparecía y desaparecía bruscamente. Se corrigió para que la transición sea suave.
- En la pantalla de Cargar Gasto, el globo del tour quedaba fuera de la pantalla al avanzar entre pasos. Ahora siempre se muestra en el lugar correcto.

---

## [1.8.0] — 15 de abril de 2026

### ✨ Novedades
- **Cerrar sesión desde cualquier pantalla**: ahora el menú del engranaje (⋮) en la esquina superior de todas las pantallas incluye la opción "Cerrar sesión".
- **Seleccionar todo de un toque**: en los modos de selección de gastos y participantes, aparece un casillero "Todos" para marcar o desmarcar todo con un solo tap.
- **Sistema de estados para eventos** — los eventos ahora tienen 3 estados:
  - 🟢 **Activo**: podés editar todo (gastos, participantes, pagos).
  - 🔒 **Bloqueado**: solo podés registrar o deshacer pagos. Los gastos y participantes quedan fijos.
  - 📁 **Cerrado**: el evento queda en solo lectura, sin posibilidad de modificar nada.
  - Podés cambiar el estado desde el detalle del evento.
- **Deshacer pagos múltiples**: desde la sección de "Liquidaciones Pagadas" podés seleccionar varios pagos a la vez y deshacerlos juntos.

### 🔧 Problemas resueltos
- Al seleccionar todos los pagos para deshacer, a veces uno quedaba sin procesar. Corregido.
- Al bloquear un evento, los botones de agregar gastos y participantes seguían activos. Ahora se deshabilitan correctamente.
- El filtro "Bloqueados" en el Inicio no mostraba los eventos correspondientes. Solucionado.
- Algunos textos del menú de inicio aparecían sin color o sin formato. Corregido.

---

## [1.7.0] — 13 de abril de 2026

### ✨ Novedades
- **Participantes representados**: podés indicar que un participante lleva a otras personas con él (por ejemplo, su familia). Los balances y liquidaciones se calculan correctamente considerando a todos los representados.
  - Cada representado aparece debajo del participante principal en la lista, con su nombre y balance propio.
  - Si un participante tiene varios representados, la lista inicia colapsada y se puede expandir.
- **Ver quién puso cada parte en gastos con varios pagadores**: cuando un gasto fue pagado entre varias personas, podés tocar "Pagado por: X personas" en el detalle para ver el nombre y el monto de cada uno.

### 🔧 Problemas resueltos
- Los representados no se tenían en cuenta al calcular las liquidaciones del evento. Ahora el balance del participante principal incluye a todos sus representados.
- Al crear dos veces un representado con el mismo nombre, se generaba un conflicto. Ahora se evita automáticamente.

### ✨ Mejoras
- Los representados se muestran visualmente diferenciados (indentados y con color distinto) tanto al cargar un gasto como en el detalle.
- Al compartir el resumen del evento por WhatsApp, los representados aparecen en una sección separada para mayor claridad.

---

## [1.6.0] — 10 de abril de 2026

### ✨ Novedades
- **Calculadora integrada al cargar gastos**: al lado del campo de monto aparece un botón 🧮 que abre una calculadora. Podés sumar, restar, multiplicar y dividir antes de confirmar el importe. Muy útil para calcular tu parte de una factura o dividir un total rápidamente.

### 🔧 Problemas resueltos
- Al usar la calculadora con números decimales (como $15,75), el monto llegaba sin los centavos. Corregido.
- Algunas secciones de la pantalla de Perfil mostraban texto interno en lugar del contenido real. Solucionado.

---

## [1.5.0] — 8 de abril de 2026

### ✨ Novedades
- **Validación de nombre en tiempo real al agregar amigos o participantes**: mientras escribís el nombre, la app te avisa al instante si ya existe uno igual. El campo muestra un ✅ verde si está disponible o un ❌ rojo con el mensaje correspondiente.
- **Detectar amigos duplicados al convertir un participante temporal**: si intentás convertir un participante en amigo y ya existe uno con el mismo nombre, la app te lo indica y te da la opción de reemplazarlo por el amigo existente, sin perder el historial del evento.
- **Eliminar varios participantes o gastos a la vez**: en las pestañas correspondientes, tocando el ícono de basurero podés seleccionar múltiples elementos y eliminarlos con una sola confirmación.
- **Sección de liquidaciones pagadas en el resumen del evento**: el resumen ahora muestra una lista separada con todos los pagos ya confirmados, incluyendo la fecha y el comprobante si fue adjuntado.
- **Encabezados fijos en el detalle del evento**: los botones de acción y la barra de título quedan visibles aunque hagas scroll hacia abajo.
- **Gastos pagados entre varias personas**: al cargar un gasto, podés indicar que fue pagado entre varios participantes. Cada uno ingresa su monto y la app verifica que sumen correctamente.

### 🔧 Problemas resueltos
- Al quitar un amigo de un evento donde era el único, la app lo borraba también de la lista global de amigos. Corregido: los amigos solo se eliminan del evento, no de la app.
- El total pagado por cada participante no se calculaba bien cuando el gasto tenía varios pagadores. Ahora es exacto.

---

## [1.4.10] — 6 de abril de 2026

### 🔧 Problemas resueltos
- Al tocar el selector de idioma desde el menú de opciones, el panel no se abría. Solucionado.
- Algunos textos de la pantalla de Perfil aparecían como código interno en lugar de texto legible. Corregido.

---

## [1.4.9] — 6 de abril de 2026

### 🔧 Problemas resueltos
- Al confirmar una liquidación, el monto real pendiente no se mostraba correctamente cuando había deudas condonadas. Ahora se muestra el monto tachado y el importe efectivo a pagar.
- Cuando una deuda fue resuelta por consolidación, aparece una sección separada en el resumen indicando cuáles deudas se cerraron automáticamente, sin necesidad de pago.

---

## [1.4.8] — 6 de abril de 2026

### 🔧 Problemas resueltos
- El contador de liquidaciones en la pantalla de inicio nunca llegaba al 100% cuando había condonaciones activas. Corregido.
- El balance de cada participante no se actualizaba al confirmar pagos. Ahora se refleja en tiempo real.
- Participantes cuya deuda fue condonada seguían apareciendo en rojo. Ahora el balance es correcto.

### ✨ Mejoras
- En la card de cada participante se muestra por separado cuánto pagó en gastos (💰) y cuánto le corresponde aportar (💵), para entender el balance de un vistazo.
- Si la deuda de un participante fue pagada por otro o condonada, aparece un indicador naranja debajo de su nombre explicando la situación.

---

## [1.4.7] — 2 de abril de 2026

### 🔧 Problemas resueltos
- El modal de cambio de contraseña fue mejorado: ahora pide la contraseña actual, muestra en tiempo real qué tan segura es la nueva y requiere que las dos versiones nuevas coincidan antes de habilitar el botón de confirmar.
- La validación de teléfono y email ahora funciona en tiempo real en todos los formularios: si el formato no es correcto, lo indica inmediatamente.

### ✨ Mejoras
- Las secciones de la pantalla de Perfil (Seguridad, Preferencias, Privacidad, etc.) inician colapsadas y se pueden expandir individualmente.

---

## [1.4.6] — 31 de marzo de 2026

### ✨ Novedades
- **Logo de SplitSmart en la barra superior** de todas las pantallas (excepto el login).
- **Indicación visual de campos obligatorios**: al intentar guardar sin completar un campo requerido, el campo se resalta con un `*` rojo para que sea fácil de identificar. Implementado en todos los formularios.

### 🔧 Problemas resueltos
- El botón "Crear cuenta" en el registro quedaba tapado por el teclado. Ahora permanece visible siempre.
- El menú de opciones estaba desplazado visualmente. Reposicionado correctamente.

---

## [1.4.5] — 24 de marzo de 2026

### ✨ Mejoras
- Los mensajes de WhatsApp (Compartir Resumen y Compartir Evento) se ven más prolijos: con separadores visuales, nombres en cursiva y totales en negrita.
- Todos los mensajes compartidos incluyen al pie: *Realizado con SplitSmart.*

---

## [1.4.4] — 18 de marzo de 2026

### 🔧 Problemas resueltos
- El teclado tapaba los campos de formulario en varias pantallas (Login, Registro, Crear Evento, Cargar Gasto, Perfil, Amigos). Ahora el contenido se desplaza automáticamente para que todo sea accesible con el teclado abierto.

---

## [1.4.3] — 9 de marzo de 2026

### 🔧 Problemas resueltos
- La importación de datos fallaba completamente por un error interno. Solucionado.
- El botón "Archivar" en el popup de opciones del evento mostraba un código interno en lugar del texto correcto. Corregido.

---

## [1.4.2] — 8 de marzo de 2026

### 🔧 Problemas resueltos
- La app pedía permisos de almacenamiento innecesarios en Android. Eliminados; ahora usa el selector de fotos nativo del sistema.

---

## [1.4.1] — 8 de marzo de 2026

### 🔧 Problemas resueltos
- La app se cerraba abruptamente al intentar editar un participante temporal dentro de un evento. Corregido.
- Al abrir el modal de edición de un participante, los campos aparecían vacíos en lugar de mostrar los datos actuales. Solucionado.

---

## [1.4.0] — 4 de marzo de 2026

### ✨ Novedades
- **Toda la app disponible en español, inglés y portugués**: se completó la traducción de todos los textos, alertas y mensajes de error. Podés cambiar el idioma desde el Perfil en cualquier momento.

### 📄 Actualizaciones legales
- Política de Privacidad y Términos de Servicio actualizados y publicados en cumplimiento con los requisitos de Google Play.
- Textos de "Acerca de" y "Contactar Soporte" revisados con información precisa.

---

## [1.3.0] — 4 de marzo de 2026

### ✨ Novedades
- **Eliminar evento desde la pantalla de inicio**: si un evento no tiene participantes ni gastos, aparece un botón 🗑️ para eliminarlo directamente desde la card, sin entrar al detalle.
- **Contador de liquidaciones en cada evento**: las cards del inicio muestran cuántas liquidaciones fueron pagadas del total (ej: `⚖️ 2/5 liquidaciones`). El ícono es verde cuando todas están pagas y naranja si quedan pendientes.
- **Filtrar eventos por estado**: tocando las tarjetas de métricas (Activos / Completados / Archivados) en la pantalla de inicio se filtra la lista automáticamente. Tocá de nuevo para quitar el filtro.
- **Orden automático de eventos**: Activos primero, luego Completados y finalmente Archivados. Dentro de cada grupo, ordenados por fecha.

### 🔧 Problemas resueltos
- Al guardar los cambios de un evento, la app redirigía al inicio en lugar de volver al detalle. Corregido.
- La lista de eventos del inicio no se actualizaba al volver desde el detalle. Ahora se refresca automáticamente.

---

## [1.2.0] — 23 de diciembre de 2025

### ✨ Novedades
- **Inicio de sesión automático**: la app recuerda el último usuario que inició sesión. Al abrir la app, entrás directamente sin tener que escribir usuario y contraseña cada vez (configurable desde el Perfil).
- **Datos de ejemplo para la cuenta DEMO**: al usar la cuenta de demostración, la app carga eventos, gastos, participantes y liquidaciones de ejemplo para que puedas explorar todas las funciones sin cargar datos reales.
- **Historial de versiones en el Perfil**: desde la pantalla de Perfil podés ver el detalle de todos los cambios de cada versión de la app.

---

## [1.1.0] — 15 de diciembre de 2025

### ✨ Novedades
- **Liquidaciones en tiempo real**: al agregar o modificar un gasto, las liquidaciones se recalculan automáticamente sin necesidad de salir y volver a entrar al evento.
- **Nuevo botón de perfil en el inicio**: el avatar del usuario pasó a ser un botón grande y visible en la esquina inferior de la pantalla de inicio, desde donde podés acceder al perfil y cerrar sesión.
- **Visualización de contraseña al escribir**: en la pantalla de login aparece un ícono de ojo para mostrar u ocultar la contraseña mientras la escribís.
- **Login sin distinguir mayúsculas**: podés escribir tu usuario o email con cualquier combinación de mayúsculas y minúsculas; la app lo reconoce igual.

### 🔧 Problemas resueltos
- Las liquidaciones no se mostraban correctamente la primera vez que se cargaban gastos en un evento.
- Los íconos de la barra superior tenían problemas de contraste en algunos temas. Solucionado.

---

## [1.0.0] — 26 de noviembre de 2025

### 🎉 Lanzamiento inicial
- Creación y gestión de eventos compartidos (asados, viajes, salidas, etc.)
- Carga de gastos con división automática entre participantes
- Cálculo automático de liquidaciones (quién le debe a quién y cuánto)
- Lista de amigos reutilizables en distintos eventos
- Participantes permanentes (amigos guardados) y temporales por evento
- Registro de pagos con comprobante fotográfico opcional
- Compartir el resumen del evento por WhatsApp
- Pantalla de Perfil con configuración de moneda, idioma y acceso
- Soporte completo para español, inglés y portugués
