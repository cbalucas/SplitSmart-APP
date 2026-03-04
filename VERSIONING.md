# 📋 Guía de Versionado de SplitSmart

## 📊 Sistema de Versiones

### Versión Actual: **v1.4.0** (versionCode: 6)

---

## 🔢 Formato de Versión

La app usa **Versionado Semántico**: `MAJOR.MINOR.PATCH`

```
v1.1.0
 │ │ │
 │ │ └── PATCH: Bug fixes (1.1.0 → 1.1.1)
 │ └──── MINOR: Nuevas funcionalidades (1.1.0 → 1.2.0)
 └────── MAJOR: Cambios incompatibles (1.1.0 → 2.0.0)
```

### Cuándo incrementar cada parte:

- **🔴 MAJOR**: Cambios que rompen compatibilidad
  - Rediseño completo de la app
  - Cambios en estructura de base de datos que requieren migración compleja
  - Eliminación de funcionalidades importantes

- **🟡 MINOR**: Nuevas funcionalidades (compatibles)
  - Agregar sistema de participantes permanentes
  - Agregar integración con WhatsApp
  - Nuevas pantallas o módulos

- **🟢 PATCH**: Correcciones de bugs
  - Arreglar cálculos incorrectos
  - Corregir crashes
  - Mejorar rendimiento

---

## 🚀 Scripts Disponibles

### 1. Incrementar Versión

```powershell
# Incrementar PATCH (1.1.0 → 1.1.1)
.\increment-version.ps1 patch

# Incrementar MINOR (1.1.0 → 1.2.0)
.\increment-version.ps1 minor

# Incrementar MAJOR (1.1.0 → 2.0.0)
.\increment-version.ps1 major
```

### 2. Generar APK

```powershell
# Genera el APK con la versión actual
.\build-apk.ps1
```

El APK se generará con el nombre: `SplitSmart-v1.1.0-release.apk`

---

## 📦 Ubicación de Archivos de Versión

- **app.json**: Versión principal de la app
  ```json
  "version": "1.1.0",
  "android": {
    "versionCode": 2
  }
  ```

- **android/app/build.gradle**: Configuración de build Android
  ```gradle
  versionCode 2
  versionName "1.1.0"
  ```

---

## 📝 Historial de Versiones

### v1.4.0 (versionCode: 6) - 04/03/2026
**🌍 Internacionalización — Auditoría Completa:**
- ✅ EventDetail/language.ts eliminado (dead code, 294 líneas)
- ✅ 30+ strings hardcodeados reemplazados en EventDetail con t()
- ✅ Logout traducido en Home (ES/EN/PT)
- ✅ Errores traducidos en ManageFriends (ES/EN/PT)
- ✅ 38 nuevas claves × 3 idiomas en LanguageContext.tsx

**📄 Documentación Legal — Google Play Ready:**
- ✅ Cumplimiento Ley N° 25.326 (Habeas Data Argentina)
- ✅ Disclaimer financiero explícito en Términos
- ✅ Edad mínima 13 años declarada
- ✅ Limitación de responsabilidad ampliada (4 supuestos)
- ✅ Jurisdicción: Córdoba, Argentina
- ✅ Tiempo de respuesta soporte protegido (Ley 24.240)
- ✅ Representación honesta como desarrollador independiente
- ✅ Actualizado ES + EN

### v1.3.0 (versionCode: 5) - 04/03/2026
**🚀 Nuevas Funcionalidades:**
- ✅ EventCard: botón eliminar evento (sin participantes ni gastos)
- ✅ EventCard: contador de liquidaciones con color indicativo
- ✅ Home: MetricsCard interactiva con filtro por estado (Activos/Completados/Archivados)
- ✅ Home: ordenamiento automático de eventos (estado → fecha → nombre)

**🔧 Correcciones:**
- ✅ Editar evento navega a Home al guardar
- ✅ Crear evento reemplaza el stack hacia EventDetail
- ✅ Cards del Home se recargan al volver (useFocusEffect)
- ✅ Conteo correcto de liquidaciones pagadas (campo isPaid)

### v1.2.0 (versionCode: 4) - 23/12/2025
**🚀 Funcionalidades Principales Nuevas:**
- ✅ Sistema de Auto-Login Inteligente y Robusto
- ✅ Identificación por ID único para usuarios
- ✅ Seguimiento de último login por usuario (campo last_login)
- ✅ Lógica de fallback al usuario DEMO
- ✅ Configuración independiente skip-password y auto-login
- ✅ Preservación de configuraciones entre sesiones
- ✅ Validaciones de configuración en inicialización
- ✅ Sistema completo de datos de ejemplo para DEMO
- ✅ Opción de regenerar datos de ejemplo desde perfil
- ✅ Protección de datos DEMO en resets de BD

**💎 Mejoras de Base de Datos:**
- ✅ Migraciones automáticas de esquema
- ✅ Campo last_login para tracking de sesiones
- ✅ Validaciones de integridad referencial
- ✅ Verificación de esquema en inicialización
- ✅ Sistema robusto de creación de tablas
- ✅ Manejo mejorado de errores de BD
- ✅ Diagnósticos de tablas implementados
- ✅ Estadísticas detalladas de datos

**🎨 Mejoras de Interfaz y UX:**
- ✅ Modal de estadísticas de base de datos
- ✅ Información técnica expandible
- ✅ Historial de versiones más detallado
- ✅ Validaciones mejoradas en formularios
- ✅ Feedback visual de configuraciones
- ✅ Logging detallado para debugging
- ✅ Mensajes de confirmación mejorados
- ✅ Interfaz de configuración más intuitiva
- ✅ Traducciones completas para autoLogin (ES, EN, PT)

**🔧 Mejoras Técnicas y Estabilidad:**
- ✅ Corrección completa de errores de TypeScript
- ✅ Tipos mejorados para todas las funciones
- ✅ Sistema de build optimizado con EAS Build
- ✅ Configuración EAS Build mejorada (appVersionSource: local)
- ✅ Manejo robusto de errores de red
- ✅ Validaciones de entrada mejoradas
- ✅ Arquitectura más limpia y modular
- ✅ Performance optimizada en consultas BD

**📊 Datos de Ejemplo Completos:**
- ✅ 3 eventos de ejemplo (Asado Fin de Año, Viaje Bariloche, Cumpleaños)
- ✅ Estados: activo, completado, archivado
- ✅ 4 participantes diversos (amigos permanentes + temporal)
- ✅ 10 gastos realistas con diferentes divisiones
- ✅5 liquidaciones en estados variados (pagadas, pendientes, consolidadas)
- ✅ Datos coherentes con fechas realistas (Oct-Dic 2025)
- ✅ Montos en pesos argentinos contextualizados
- ✅ Relaciones completas entre todas las tablas
- ✅ IDs únicos con sistema de prefijos demo_

**🚀 Build y Distribución:**
- ✅ Configuración EAS Build optimizada
- ✅ Project ID actualizado y funcional
- ✅ Versionado automático mejorado
- ✅ Scripts PowerShell actualizados
- ✅ APK generado exitosamente con Gradle

### v1.1.0 (versionCode: 3) - 25/11/2025
**Nuevas Funcionalidades:**
- ✅ Sistema de tipos de participantes (friend/temporary)
- ✅ Carga masiva de amigos
- ✅ Mejoras en mensajes de WhatsApp (agrupación por pagador/destinatario)
- ✅ Toggle "Guardar como amigo permanente"
- ✅ Selección múltiple de amigos
- ✅ ManageFriends filtra solo amigos permanentes

**Bug Fixes:**
- ✅ Corregido: Splits no se cargaban en SummaryScreen
- ✅ Corregido: Participantes se reseteaban al editar gasto
- ✅ Implementado: Delete/Archive de eventos
- ✅ Eliminado: DatabaseService.ts obsoleto

### v1.0.0 (versionCode: 1) - 20/11/2025
- 🎉 Lanzamiento inicial
- ✅ Gestión de eventos
- ✅ Gestión de participantes
- ✅ Gestión de gastos
- ✅ Cálculo de liquidaciones
- ✅ Tema claro/oscuro
- ✅ Base de datos SQLite

---

## 🎯 Workflow Recomendado

1. **Haz cambios en el código**
2. **Decide el tipo de versión** (major/minor/patch)
3. **Incrementa la versión**: `.\increment-version.ps1 [tipo]`
4. **Genera el APK**: `.\build-apk.ps1`
5. **Prueba el APK** en dispositivo
6. **Actualiza este README** con los cambios en el historial

---

## 📲 APK Generados

Ubicación: `android/app/build/outputs/apk/release/`

Formato de nombre: `SplitSmart-v[VERSION]-release.apk`

Ejemplo: `SplitSmart-v1.1.0-release.apk`

---

## ⚠️ Importante

- **SIEMPRE** incrementa `versionCode` en cada build (automático con script)
- **NUNCA** uses el mismo `versionCode` para builds diferentes
- Google Play rechazará APKs con `versionCode` menor o igual al actual
- Mantén sincronizadas las versiones en `app.json` y `build.gradle` (automático con script)
