# Changelog - SplitSmart

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
- Eliminado email hardcodeado (`soporte@splitsmart.com`) — reemplazado por referencia a la sección Soporte
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
