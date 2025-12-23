# 💸 SplitSmart v1.2.0

**La solución definitiva para gestionar gastos compartidos de manera inteligente y segura.**

<p align="center">
  <img src="./assets/splitsmart/icon.png" width="128" height="128" alt="SplitSmart Logo">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.2.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/React%20Native-0.75-green.svg" alt="React Native">
  <img src="https://img.shields.io/badge/Expo-52-000020.svg" alt="Expo">
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue.svg" alt="TypeScript">
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20iOS-lightgrey.svg" alt="Platform">
</p>

## 🚀 Características Principales

### ✨ **v1.2.0 - Auto-Login Inteligente**
- 🔑 **Sistema de Auto-Login Avanzado**: Login automático inteligente basado en último usuario
- 👤 **Gestión de Usuarios Robusta**: Identificación única, seguimiento de sesiones
- 🎭 **Usuario DEMO Completo**: Datos de ejemplo realistas para aprender la app
- 🔄 **Configuraciones Persistentes**: Las preferencias se mantienen entre sesiones

### 💰 **Gestión de Gastos**
- 📊 **División Automática**: Cálculos precisos y transparentes
- 👥 **Participantes Flexibles**: Amigos permanentes y participantes temporales
- 🎯 **Múltiples Estados**: Eventos activos, completados y archivados
- 🧾 **Liquidaciones Inteligentes**: Estados: pendiente, pagada, consolidada

### 🎨 **Experiencia de Usuario**
- 🌓 **Temas Adaptativos**: Modo claro/oscuro automático
- 🌍 **Multiidioma**: Español, Inglés, Portugués
- 💱 **Múltiples Monedas**: ARS, USD, EUR, BRL
- 📱 **100% Móvil**: Optimizado para dispositivos móviles

### 🔒 **Privacidad y Seguridad**
- 🏠 **100% Offline**: Tus datos nunca salen de tu dispositivo
- 🛡️ **SQLite Local**: Base de datos segura y privada
- 🔐 **Configuración de Acceso**: Skip-password, auto-logout configurable
- 📤 **Exportación Completa**: Controla tus propios datos

## 🛠️ Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Android Studio (para desarrollo Android)
- Expo CLI

### Instalación Rápida

```bash
# Clonar el repositorio
git clone https://github.com/cbalucas/SplitSmart-APP.git
cd SplitSmart-APP

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start
```

### Scripts Disponibles

```bash
# Desarrollo
npm start                    # Inicia Expo Dev Server
npm run android             # Ejecuta en Android
npm run ios                 # Ejecuta en iOS

# Builds de Producción
npm run build:apk:dev       # APK desarrollo (EAS)
npm run build:apk:prod      # APK producción (EAS)
.\build-apk.ps1            # APK local (Gradle)

# Utilidades
npm run lint               # ESLint
npm test                   # Jest tests
```

## 🎭 Usuario DEMO

SplitSmart incluye un usuario DEMO completo con datos de ejemplo realistas:

### Credenciales de Acceso
- **👤 Username:** `demo`
- **📧 Email:** `demo@splitsmart.com`
- **🔑 Password:** No requerida (skip-password habilitado)

### Datos de Ejemplo Incluidos
- **🎪 3 Eventos Completos:**
  - 🥩 **Asado de Fin de Año** (Activo) - $45,500 total
  - 🏔️ **Viaje a Bariloche** (Completado) - $122,000 total
  - 🎂 **Cumpleaños de María** (Archivado) - $30,000 total

- **👥 4 Participantes:**
  - María García (Amiga permanente) - Con CBU
  - Carlos López (Amigo permanente) - Con CBU
  - Ana Martín (Amiga permanente) - Sin CBU
  - Juan Rodríguez (Temporal) - Para el viaje

- **💸 10 Gastos Realistas:** Desde compras básicas hasta gastos grandes de viaje
- **🧾 5 Liquidaciones:** En diferentes estados (pagadas, pendientes, consolidadas)

## 📱 Uso de la Aplicación

### 🏠 Pantalla Principal
- **Resumen de eventos activos**
- **Acceso rápido a crear nuevo evento**
- **Navegación intuitiva por pestañas**

### 🎪 Gestión de Eventos
1. **Crear Evento**: Nombre, descripción, participantes iniciales
2. **Agregar Gastos**: Descripción, monto, división automática o personalizada
3. **Gestionar Participantes**: Agregar/quitar, amigos permanentes vs temporales
4. **Ver Liquidaciones**: Quién debe a quién, estados de pago

### 👥 Participantes y Amigos
- **Amigos Permanentes**: Se guardan para futuros eventos
- **Participantes Temporales**: Solo para el evento actual
- **Información Completa**: Nombre, email, teléfono, CBU/Alias

### 💰 Sistema de Liquidaciones
- **Cálculo Automático**: Algoritmo optimizado para minimizar transacciones
- **Estados Flexibles**:
  - ⏳ **Pendiente**: Aún no pagada
  - ✅ **Pagada**: Confirmada por el pagador
  - 🔄 **Consolidada**: Cancelada entre amigos

### ⚙️ Configuración y Perfil
- **Información Personal**: Avatar, nombre, contactos
- **Preferencias**: Tema, idioma, moneda, auto-logout
- **Privacidad**: Configuración de compartir información
- **Datos**: Estadísticas, exportación, importación

## 🏗️ Arquitectura Técnica

### Stack Tecnológico
- **⚛️ React Native 0.75**: Framework móvil multiplataforma
- **🔷 TypeScript**: Tipado estático y desarrollo robusto
- **📱 Expo 52**: Plataforma de desarrollo y distribución
- **🗄️ SQLite**: Base de datos local embebida
- **🎨 React Navigation**: Navegación nativa optimizada

### Arquitectura de Datos
```
📱 App Layer (React Native + TypeScript)
    ↓
🔄 Context Layer (Auth, Data, Language, Theme)
    ↓  
🛠️ Service Layer (Database, Calculations, Notifications)
    ↓
🗄️ SQLite Database (Local, Private, Secure)
```

### Base de Datos
- **📊 Esquema Relacional**: 8 tablas principales
- **🔄 Migraciones**: Sistema automático de actualizaciones
- **✅ Integridad**: Foreign keys y validaciones
- **📈 Performance**: Índices optimizados

## 🔧 Desarrollo y Contribución

### Estructura del Proyecto
```
SplitSmart-APP/
├── 📱 src/
│   ├── 🎨 components/       # Componentes reutilizables
│   ├── 📱 screens/         # Pantallas principales
│   ├── 🔄 context/         # React Context (Estado global)
│   ├── 🛠️ services/        # Lógica de negocio
│   ├── 🎯 types/           # Definiciones TypeScript
│   ├── 🌍 localization/    # Traducciones (ES, EN, PT)
│   └── 📐 constants/       # Constantes y configuración
├── 🤖 android/            # Configuración Android nativa
├── 📄 assets/             # Imágenes, íconos, splash
└── 📚 docs/               # Documentación adicional
```

### Scripts de Desarrollo
- **🔧 Build Local**: `.\build-apk.ps1`
- **📊 Versioning**: `.\increment-version.ps1 [major|minor|patch]`
- **🧪 Testing**: `npm test`
- **📝 Linting**: `npm run lint`

## 📊 Información de Versiones

### v1.2.0 (Actual) - 23 Dic 2025
- 🚀 Sistema de Auto-Login Inteligente
- 🎭 Datos completos de usuario DEMO
- 💎 Mejoras de base de datos y migraciones
- 🎨 Interfaz optimizada y logging mejorado
- 🔧 Corrección completa de errores TypeScript

### v1.1.0 - 11 Dic 2025
- ✨ Gestión avanzada de eventos y participantes
- 📤 Sistema de exportación/importación JSON
- 🎨 Temas claro/oscuro dinámicos
- 💱 Soporte múltiples monedas
- 🔔 Integración WhatsApp

### v1.0.0 - 1 Oct 2025
- 🎉 Lanzamiento inicial
- 📱 Funcionalidades core completas

## 🎯 Características Destacadas

### 🔑 Auto-Login Inteligente (v1.2.0)
```typescript
// El sistema identifica automáticamente al último usuario
// y mantiene las configuraciones personalizadas
if (lastUser && lastUser.autoLogin && lastUser.skipPassword) {
  await autoLogin(lastUser);
} else {
  showLoginScreen();
}
```

### 💰 Algoritmo de Liquidación Optimizado
- **Minimiza transacciones**: Reduce el número de pagos necesarios
- **Precisión decimal**: Cálculos exactos sin errores de redondeo
- **Estados flexibles**: Adapta a diferentes dinámicas de grupo

### 🛡️ Privacidad por Diseño
- **Sin servidores remotos**: 100% local
- **Sin analytics**: No se envían datos a terceros
- **Exportación completa**: Control total de tus datos
- **Eliminación limpia**: Reset completo cuando lo necesites

## 📞 Soporte y Contacto

### 🆘 Obtener Ayuda
1. **📋 Datos DEMO**: Usa el usuario demo para aprender
2. **📊 Estadísticas BD**: Revisa el estado de tus datos
3. **📤 Exportar Datos**: Respaldo antes de reportar problemas
4. **🔄 Reset Limpio**: Última opción para resolver conflictos

### 📧 Información de Contacto
- **📧 Email**: support@splitsmart.app
- **💬 WhatsApp**: +54 351 123-4567 (solo mensajes)
- **⏰ Horarios**: Lun-Vie 9:00-18:00 (GMT-3)

### 🐛 Reportar Bugs
Incluye en tu reporte:
- Versión de la app (v1.2.0)
- Dispositivo y versión Android/iOS
- Pasos para reproducir el error
- Screenshots si es posible

## 📄 Licencia

Este proyecto está bajo licencia MIT. Ver archivo [LICENSE](LICENSE) para más detalles.

---

<p align="center">
  <strong>💖 Hecho con amor para simplificar tus gastos compartidos</strong>
</p>

<p align="center">
  <sub>© 2025 SplitSmart. Todos los derechos reservados.</sub>
</p>