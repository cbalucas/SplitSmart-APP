# 🎯 **PROMPT COMPLETO PARA REGENERAR SPLITSMART**

## 📋 **RESUMEN EJECUTIVO**

Genera completamente la aplicación **SplitSmart**, una app móvil React Native/Expo para gestión inteligente de gastos compartidos con **funcionamiento 100% offline**, backup manual por el usuario, funcionalidades avanzadas de cálculo matemático, autenticación biométrica y experiencia de usuario superior. **La aplicación debe estar optimizada para generar APK para Android** con todas las funcionalidades trabajando sin conexión a internet.

---

## 📚 **ÍNDICE DE CONTENIDOS**

### **📋 FASE 1: PLANIFICACIÓN Y CONFIGURACIÓN**
1. [🏗️ **ARQUITECTURA TÉCNICA**](#🏗️-arquitectura-técnica)
   - Stack Tecnológico Principal
   - Estructura de Carpetas Completa
   - Configuración de Base de Datos Local (SQLite)
   
2. [⚙️ **CONFIGURACIÓN INICIAL DEL PROYECTO**](#⚙️-configuración-inicial-del-proyecto)
   - Variables de Entorno
   - Configuración Expo (app.json)
   - Dependencias Principales
   - Scripts de Build para APK

### **📋 FASE 2: MODELOS Y ESTRUCTURA DE DATOS**
3. [🗂️ **MODELOS DE DATOS Y TIPOS TYPESCRIPT**](#🗂️-modelos-de-datos-y-tipos-typescript)
   - Interfaces de Entidades Principales
   - Tipos Auxiliares y Enums
   - Esquemas de Base de Datos SQLite
   
4. [🧮 **ALGORITMOS DE CÁLCULO MATEMÁTICO**](#🧮-algoritmos-de-cálculo-matemático)
   - Cálculo de Balances Principal
   - Algoritmo de Liquidación Óptima
   - Tipos de División de Gastos
   - Sistema de Validaciones

### **📋 FASE 3: SERVICIOS Y LÓGICA DE NEGOCIO**
5. [🔐 **SISTEMA DE AUTENTICACIÓN Y SEGURIDAD**](#🔐-sistema-de-autenticación-y-seguridad)
   - Autenticación Biométrica Avanzada
   - Gestión de Sesiones Offline
   - Servicios de Almacenamiento Seguro
   - Timeout y Validaciones

6. [💾 **SERVICIOS DE DATOS Y BACKUP**](#💾-servicios-de-datos-y-backup)
   - Servicio de Base de Datos SQLite
   - Sistema de Backup Manual
   - Gestión de Almacenamiento Local
   - Servicios Mock para Testing

### **📋 FASE 4: COMPONENTES Y UI/UX**
7. [🧩 **COMPONENTES REUTILIZABLES**](#🧩-componentes-reutilizables)
   - HeaderBar Component
   - Alert Component  
   - Input Component
   - Card, Avatar, Chip, ListItem, Button, ProgressBar, Badge

8. [🎨 **SISTEMA DE DISEÑO Y TEMAS**](#🎨-sistema-de-diseño-y-temas)
   - Configuración de Temas Dinámicos
   - Paleta de Colores y Tipografía
   - Iconografía y Assets
   - Sistema de Animaciones

### **📋 FASE 5: PANTALLAS Y NAVEGACIÓN**
9. [📱 **PANTALLAS DETALLADAS (UI/UX COMPLETO)**](#📱-pantallas-detalladas-uiux-completo)
   - **Autenticación**: SplashScreen, LoginScreen, SignUpScreen, BiometricScreen
   - **Principal**: HomeScreen, EventDetailsScreen, ProfileScreen, SettingsScreen
   - **Gestión**: CreateEventScreen, CreateExpenseScreen, EditEventScreen, EditExpenseScreen
   - **Avanzadas**: SummaryScreen, StatisticsScreen, ManageFriendsScreen, NotificationSettingsScreen

10. [🔲 **MODALES Y COMPONENTES EMERGENTES**](#🔲-modales-y-componentes-emergentes)
    - AddParticipantModal, FilterModal, SettlementConfirmationModal
    - DeleteConfirmationModal, ShareModal, ParticipantDetailsModal
    - ExpenseSplitDetailsModal, BackupOptionsModal

11. [🧭 **NAVEGACIÓN Y FLUJOS**](#🧭-navegación-y-flujos)
    - Configuración React Navigation v7
    - Stack y Tab Navigation
    - Flujos de Usuario Principales

### **📋 FASE 6: INTERNACIONALIZACIÓN Y TESTING**
12. [🌐 **SISTEMA DE INTERNACIONALIZACIÓN**](#🌐-sistema-de-internacionalización)
    - Configuración i18next Offline
    - Archivos de Traducción (ES/EN/PT)
    - Formateo de Fechas y Monedas

13. [🧪 **CONFIGURACIÓN DE TESTING**](#🧪-configuración-de-testing)
    - Jest y Testing Library Setup
    - Tests Unitarios y de Integración
    - Tests de Cálculos Matemáticos
    - Tests de Navegación y UI

### **📋 FASE 7: BUILD Y DISTRIBUCIÓN**
14. [📦 **COMANDOS PARA GENERAR APK**](#📦-comandos-para-generar-apk)
    - Configuración EAS CLI
    - Build Local con Gradle
    - Scripts NPM para APK
    - Preparación para Google Play Store

15. [🚀 **INSTRUCCIONES DE IMPLEMENTACIÓN PASO A PASO**](#🚀-instrucciones-de-implementación-paso-a-paso)
    - Guía de Desarrollo Ordenada
    - Checklist de Completitud
    - Roadmap de Funcionalidades

### **📋 FASE 8: OPTIMIZACIÓN Y CALIDAD**
16. [📈 **MÉTRICAS Y PERFORMANCE**](#📈-métricas-y-performance)
    - Métricas de Usuario y Calidad
    - Optimizaciones para APK
    - Analytics Offline

17. [✅ **RESULTADO ESPERADO Y CONCLUSIÓN**](#✅-resultado-esperado-y-conclusión)
    - Checklist Final
    - Características Implementadas
    - Calidad Empresarial

---

# 📋 **FASE 1: PLANIFICACIÓN Y CONFIGURACIÓN**

## 🏗️ **ARQUITECTURA TÉCNICA**

### **Stack Tecnológico Principal**
- **Frontend**: React Native 0.81.4 + Expo SDK 54 (Configured for APK generation)
- **Base de Datos Local**: SQLite integrado + AsyncStorage para configuraciones
- **Navegación**: React Navigation v7 (Stack + Tabs)
- **Estado**: React Context API + Persistencia local completa
- **Internacionalización**: i18next + react-i18next (archivos locales)
- **Testing**: Jest + Testing Library + 90%+ cobertura
- **UI/UX**: Temas dinámicos (Light/Dark) + Material Design
- **Seguridad**: Expo SecureStore + Autenticación Biométrica Avanzada
- **Backup**: Sistema de exportación manual a archivos locales
- **APK Ready**: Configuración optimizada para Android standalone

### **Estructura de Carpetas Completa**
```
SplitSmart/
├── 📱 Frontend/                    # App React Native
│   ├── src/
│   │   ├── assets/                 # Imágenes, iconos, splash
│   │   ├── components/             # Componentes reutilizables
│   │   │   ├── Alert/              # Sistema de alertas
│   │   │   ├── Button/             # Botones estandarizados
│   │   │   ├── Card/               # Tarjetas UI
│   │   │   ├── HeaderBar/          # Barra superior
│   │   │   ├── Input/              # Inputs validados
│   │   │   └── TabView/            # Pestañas personalizadas
│   │   ├── screens/                # 25+ pantallas principales
│   │   │   ├── Auth/               # Login, SignUp, ForgotPassword
│   │   │   ├── Home/               # Lista de eventos
│   │   │   ├── EventDetails/       # Detalles, gastos, participantes
│   │   │   ├── CreateEvent/        # Crear eventos
│   │   │   ├── CreateExpense/      # Crear gastos
│   │   │   ├── Summary/            # Resumen y balances
│   │   │   ├── Profile/            # Perfil de usuario
│   │   │   └── Settings/           # Configuraciones
│   │   ├── navigation/             # Configuración navegación
│   │   ├── context/                # Contextos React
│   │   │   ├── AuthContext.tsx     # Autenticación
│   │   │   ├── DataContext.tsx     # Datos globales
│   │   │   ├── ThemeContext.tsx    # Temas
│   │   │   └── LanguageContext.tsx # Idiomas
│   │   ├── services/               # Lógica de negocio
│   │   │   ├── AuthenticationService.ts
│   │   │   ├── BiometricAuthService.ts
│   │   │   ├── BackendService.ts
│   │   │   └── CalculationService.ts
│   │   ├── models/                 # Tipos TypeScript
│   │   ├── utils/                  # Utilidades
│   │   ├── localization/           # Traducciones ES/EN/PT
│   │   ├── constants/              # Temas y constantes
│   │   └── mocks/                  # Datos de desarrollo
│   ├── tests/                      # Testing completo
│   ├── app.json                    # Configuración Expo
│   ├── package.json               # Dependencias
│   └── tsconfig.json              # TypeScript config
│
└── � Local Storage/               # Almacenamiento local integrado
    ├── database/                   # SQLite embebido
    ├── exports/                    # Carpeta para backups manuales
    ├── assets/                     # Recursos offline
    └── cache/                      # Cache de datos temporales
```

---

## 📱 **ARQUITECTURA OFFLINE-FIRST**

### **Funcionamiento 100% Sin Conexión**
La aplicación **SplitSmart** está diseñada como una **aplicación completamente offline** que no requiere conexión a internet para ninguna de sus funcionalidades principales:

#### **🔧 Base de Datos Local Integrada**
```typescript
// Configuración SQLite embebido
import SQLite from 'react-native-sqlite-storage';

class LocalDatabaseService {
  private db: SQLite.SQLiteDatabase;
  
  async initialize(): Promise<void> {
    this.db = await SQLite.openDatabase({
      name: 'SplitSmart.db',
      location: 'default',
      createFromLocation: '~SplitSmart.db'
    });
    
    await this.createTables();
    await this.insertInitialData();
  }
  
  // Todas las operaciones CRUD son locales
  async getAllEvents(): Promise<Event[]>
  async createEvent(event: Event): Promise<string>
  async updateEvent(id: string, updates: Partial<Event>): Promise<void>
  // ... más métodos locales
}
```

#### **💾 Sistema de Backup Manual**
```typescript
class BackupService {
  // Exportar datos completos a archivo JSON
  async createManualBackup(): Promise<string> {
    const allData = {
      events: await this.getAllEvents(),
      participants: await this.getAllParticipants(),
      expenses: await this.getAllExpenses(),
      payments: await this.getAllPayments(),
      settings: await this.getUserSettings(),
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
    
    const fileName = `SplitSmart_Backup_${formatDate(new Date())}.json`;
    const filePath = await this.writeToLocalFile(fileName, allData);
    
    return filePath;
  }
  
  // Restaurar desde backup
  async restoreFromBackup(filePath: string): Promise<void>
  
  // Exportar a diferentes formatos
  async exportToCSV(): Promise<string>
  async exportToPDF(): Promise<string>
}
```

#### **🔄 Persistencia Total de Estado**
```typescript
class OfflineStateManager {
  // Guardar estado completo en AsyncStorage
  async saveAppState(state: AppState): Promise<void> {
    await AsyncStorage.setItem('app_state', JSON.stringify(state));
  }
  
  // Restaurar estado al iniciar app
  async restoreAppState(): Promise<AppState | null> {
    const savedState = await AsyncStorage.getItem('app_state');
    return savedState ? JSON.parse(savedState) : null;
  }
  
  // Sincronización de configuraciones offline
  async syncUserPreferences(): Promise<void>
}
```

#### **📊 Cálculos Locales Optimizados**
Todos los cálculos matemáticos se realizan **completamente en el dispositivo**:
- Balances de participantes
- Liquidaciones óptimas
- Estadísticas y reportes
- Conversiones de moneda (tasas guardadas localmente)

---

## 📦 **CONFIGURACIÓN PARA APK ANDROID**

### **Configuración Expo para Standalone APK**
```json
// app.json - Configuración específica para APK
{
  "expo": {
    "name": "SplitSmart",
    "slug": "splitsmart-offline",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    
    "android": {
      "package": "com.cbalucas.splitsmart",
      "versionCode": 1,
      "compileSdkVersion": 34,
      "targetSdkVersion": 34,
      "minSdkVersion": 23,
      "buildToolsVersion": "34.0.0",
      "permissions": [
        "USE_FINGERPRINT",
        "USE_BIOMETRIC",
        "WRITE_EXTERNAL_STORAGE",
        "READ_EXTERNAL_STORAGE",
        "CAMERA"
      ],
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#4B89DC"
      },
      "allowBackup": true,
      "fullBackupContent": true
    },
    
    "plugins": [
      "expo-secure-store",
      "expo-local-authentication",
      "expo-sqlite",
      "expo-file-system",
      "expo-document-picker",
      "expo-sharing"
    ],
    
    "updates": {
      "enabled": false
    },
    
    "assetBundlePatterns": [
      "**/*"
    ]
  }
}
```

### **Build Configuration para APK**
```json
// eas.json - Para EAS Build
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production_apk": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    },
    "production_aab": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### **Scripts de Build para APK**
```json
// package.json - Scripts para generar APK
{
  "scripts": {
    "android": "expo start --android",
    "build:apk": "eas build --platform android --profile production_apk",
    "build:aab": "eas build --platform android --profile production_aab",
    "build:preview": "eas build --platform android --profile preview",
    "prebuild": "expo prebuild --clean",
    "android:release": "cd android && ./gradlew assembleRelease",
    "android:bundle": "cd android && ./gradlew bundleRelease"
  }
}
```

### **Dependencias Optimizadas para APK**
```json
{
  "dependencies": {
    "@react-native-async-storage/async-storage": "^1.19.0",
    "expo-sqlite": "~11.3.0",
    "expo-file-system": "~15.4.0",
    "expo-document-picker": "~11.5.0",
    "expo-sharing": "~11.5.0",
    "react-native-sqlite-storage": "^6.0.1",
    "react-native-fs": "^2.20.0",
    "react-native-zip-archive": "^6.0.7",
    
    // Componentes UI sin dependencias de red
    "react-native-vector-icons": "^10.0.0",
    "react-native-svg": "^13.4.0",
    "react-native-chart-kit": "^6.12.0",
    
    // Sin dependencias de backend
    // No incluir: axios, fetch, websockets, etc.
  }
}
```

---

## 🎨 **SISTEMA DE DISEÑO Y TEMAS**

### **Temas Dinámicos (Light/Dark)**
Implementar sistema completo de temas con estas especificaciones exactas:

**Theme Light:**
```typescript
{
  mode: 'light',
  background: '#FFFFFF',
  text: '#000000',
  primary: '#4B89DC',
  secondary: '#8E44AD',
  accent: '#F39C12',
  border: '#D0D0D0',
  card: '#F8F8F8',
  cardHighlight: '#ECF0F7',
  error: '#E74C3C',
  success: '#2ECC71',
  warning: '#F39C12',
  info: '#3498DB',
  headerBackground: '#4B89DC',
  headerText: '#FFFFFF',
  tabBarBackground: '#FFFFFF',
  tabBarActive: '#4B89DC',
  tabBarInactive: '#8C9BAB',
  inputBackground: '#F5F5F5',
  placeholderText: '#999999',
  // ... más colores específicos
}
```

**Theme Dark:**
```typescript
{
  mode: 'dark',
  background: '#121212',
  text: '#FFFFFF',
  primary: '#6C9FFF',
  secondary: '#B380E0',
  accent: '#FFB74D',
  // ... palette completa para modo oscuro
}
```

### **Componentes UI Core**

**1. HeaderBar** - Barra superior reutilizable:
- Título dinámico
- Selector de idioma con banderas
- Toggle tema claro/oscuro
- Botones de acción contextuales
- Gradiente personalizable

**2. Sistema de Alertas** - AlertContext:
- 4 tipos: success, error, warning, info
- Posicionamiento top/bottom
- Duración configurable
- Animaciones suaves
- Modales de confirmación

**3. Input Components**:
- Validación en tiempo real
- Estados de error/éxito
- Placeholder dinámico
- Soporte para monedas
- Teclado contextual

**4. Cards Interactivas**:
- Swipe actions (editar, eliminar, activar)
- Estados visuales (activo, archivado, completado)
- Animaciones de transición
- Indicadores de progreso

### **Iconografía**
- **Librería**: react-native-vector-icons (Ionicons)
- **Tamaños**: 16px, 20px, 24px, 32px
- **Estados**: Normal, Active, Disabled
- **Consistencia**: Misma familia para toda la app

---

# 📋 **FASE 3: SERVICIOS Y LÓGICA DE NEGOCIO**

## 🔐 **SISTEMA DE AUTENTICACIÓN Y SEGURIDAD**

### **Autenticación Multi-Modal**
Implementar **4 métodos de autenticación**:

1. **Login Tradicional** (usuario/email + contraseña)
2. **Login Biométrico** (huella digital / Face ID)
3. **Login Passwordless** (código por email)
4. **Recuperación de Contraseña** (link por email)

### **Credenciales de Usuario DEMO**
```typescript
// Configuración especial para usuario DEMO
const DEMO_CREDENTIALS = {
  // Opción 1: Login con username
  username: "Demo",
  password: "demo123456",
  
  // Opción 2: Login con email  
  email: "demo@splitsmart.com",
  password: "demo123456",
  
  // Configuración de seguridad
  requiresPassword: true, // Siempre pedir contraseña (no biométrico por defecto)
  maxLoginAttempts: 5, // Máximo intentos antes de bloqueo temporal
  
  // Configuración de desarrollo
  isDemoUser: true, // Flag especial para identificar usuario demo
  autoLoadSampleData: true, // Cargar datos de ejemplo automáticamente
  skipOnboarding: false, // Mostrar tutorial la primera vez
  
  // Permisos especiales
  permissions: [
    'canCreateEvents',
    'canInviteParticipants', 
    'canExportData',
    'canUseAllFeatures'
  ]
};

// Servicio de autenticación para usuario DEMO
class DemoAuthService {
  static async authenticateDemo(credential: string, password: string): Promise<AuthResult> {
    // Validar credential (puede ser username o email)
    const isValidCredential = credential === "Demo" || 
                             credential === "demo" || 
                             credential === "demo@splitsmart.com";
    
    const isValidPassword = password === "demo123456";
    
    if (isValidCredential && isValidPassword) {
      return {
        success: true,
        user: MockDataService.getDemoUserData(),
        token: "demo-token-" + Date.now(),
        requiresBiometricSetup: false,
        firstLogin: false
      };
    }
    
    return {
      success: false,
      error: "Credenciales incorrectas",
      attemptsRemaining: 4
    };
  }
  
  // Inicializar datos del usuario DEMO
  static async initializeDemoData(): Promise<void> {
    await DatabaseService.createUser(MockDataService.getDemoUserData());
    await MockDataService.seedDemoEvents();
    await MockDataService.seedDemoParticipants();
    await MockDataService.seedDemoExpenses();
  }
}
```

### **Autenticación Biométrica Empresarial**
```typescript
class BiometricAuthService {
  // Validación de seguridad del dispositivo
  static async checkDeviceIntegrity(level: SecurityLevel): Promise<SecurityCheck>
  
  // Autenticación con múltiples niveles de seguridad
  static async authenticate(message: string, level: SecurityLevel): Promise<AuthResult>
  
  // Gestión de sesiones con timeouts inteligentes
  static async startSecureSession(): Promise<void>
  
  // Detección de amenazas (root, jailbreak, debuggers)
  static async detectThreats(): Promise<ThreatReport>
}
```

**Características de Seguridad:**
- **Timeout automático**: 15 minutos configurable
- **Detección inactividad**: Logout automático
- **Validación dispositivo**: Anti-root/jailbreak básico
- **Encriptación**: AES-256 para datos sensibles
- **Secure Storage**: Expo SecureStore para credenciales
- **Logging seguro**: Sanitización de datos sensibles

### **Gestión de Sesiones**
```typescript
class SessionTimeoutService {
  static initialize(onExpired: () => void): void
  static registerUserActivity(): void
  static resetActivityTimer(): void
  static stopService(): void
}
```

## 💾 **SERVICIOS DE DATOS Y BACKUP**

### **Servicio de Base de Datos SQLite**
```typescript
class DatabaseService {
  private db: SQLite.Database;
  
  // Inicialización y migración
  static async initialize(): Promise<void>
  static async runMigrations(): Promise<void>
  
  // CRUD Operations para todas las entidades
  async createEvent(event: Omit<Event, 'id'>): Promise<Event>
  async getEvents(filters?: EventFilters): Promise<Event[]>
  async updateEvent(id: string, updates: Partial<Event>): Promise<Event>
  async deleteEvent(id: string): Promise<boolean>
  
  async createExpense(expense: Omit<Expense, 'id'>): Promise<Expense>
  async getExpensesByEvent(eventId: string): Promise<Expense[]>
  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense>
  async deleteExpense(id: string): Promise<boolean>
  
  async createParticipant(participant: Omit<EventParticipant, 'id'>): Promise<EventParticipant>
  async getParticipantsByEvent(eventId: string): Promise<EventParticipant[]>
  async updateParticipant(id: string, updates: Partial<EventParticipant>): Promise<EventParticipant>
  async deleteParticipant(id: string): Promise<boolean>
  
  // Operaciones de backup y restauración
  async exportDatabase(): Promise<string> // JSON completo
  async importDatabase(data: string): Promise<boolean>
  async getDatabaseStats(): Promise<DatabaseStats>
}
```

### **Sistema de Backup Manual**
```typescript
class BackupService {
  // Crear backup manual por el usuario
  static async createManualBackup(options: BackupOptions): Promise<BackupResult>
  
  // Opciones de backup
  interface BackupOptions {
    includeEvents: boolean;
    includeParticipants: boolean;  
    includePaymentHistory: boolean;
    includeImages: boolean;
    includeSettings: boolean;
    format: 'json' | 'csv' | 'zip';
    encrypted: boolean;
    destination: string; // ruta del archivo
  }
  
  // Restaurar desde backup
  static async restoreFromBackup(filePath: string): Promise<RestoreResult>
  
  // Gestión de archivos locales
  static async listBackupFiles(): Promise<BackupFile[]>
  static async deleteBackupFile(filePath: string): Promise<boolean>
  static async getBackupSize(filePath: string): Promise<number>
}
```

### **Gestión de Almacenamiento Local**
```typescript
class StorageService {
  // Gestión de espacio y limpieza
  static async getStorageInfo(): Promise<StorageInfo>
  static async clearCache(): Promise<void>
  static async optimizeDatabase(): Promise<void>
  
  // Configuraciones persistentes
  static async saveUserSettings(settings: UserSettings): Promise<void>
  static async getUserSettings(): Promise<UserSettings>
  
  // Gestión de archivos de imágenes
  static async saveImage(uri: string, category: 'receipts' | 'avatars'): Promise<string>
  static async deleteImage(path: string): Promise<boolean>
  static async getImageSize(path: string): Promise<number>
}
```

### **Servicios Mock para Testing**
```typescript
class MockDataService {
  // Generar datos de prueba
  static async generateMockEvents(count: number): Promise<Event[]>
  static async generateMockExpenses(eventId: string, count: number): Promise<Expense[]>
  static async generateMockParticipants(count: number): Promise<EventParticipant[]>
  
  // Reset y limpieza para testing
  static async resetAllData(): Promise<void>
  static async seedInitialData(): Promise<void>
  
  // Simulación de operaciones lentas para testing de UI
  static async simulateDelay(ms: number): Promise<void>
  
  // Datos específicos del usuario DEMO
  static getDemoUserData(): User {
    return {
      id: "user-demo-001",
      name: "Demo",
      username: "Demo",
      email: "demo@splitsmart.com",
      avatar: "./assets/images/demo-avatar.png",
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z")
    };
  }
  
  // Eventos de ejemplo para usuario DEMO
  static getDemoEvents(): Event[] {
    return [
      {
        id: "event-demo-001",
        name: "Cena de Amigos",
        description: "Cena de viernes en el restaurante",
        startDate: new Date("2024-11-01T20:00:00.000Z"),
        endDate: new Date("2024-11-01T23:00:00.000Z"),
        location: "Restaurante Italiano",
        currency: "ARS",
        totalAmount: 15000,
        status: "active",
        type: "private",
        category: "cena",
        ownerId: "user-demo-001",
        createdAt: new Date("2024-11-01T18:00:00.000Z"),
        updatedAt: new Date("2024-11-06T10:00:00.000Z")
      },
      {
        id: "event-demo-002", 
        name: "Fin de Semana en Bariloche",
        description: "Viaje de fin de semana con amigos",
        startDate: new Date("2024-12-15T09:00:00.000Z"),
        endDate: new Date("2024-12-17T18:00:00.000Z"),
        location: "Bariloche, Argentina",
        currency: "ARS",
        totalAmount: 85000,
        status: "active",
        type: "private", 
        category: "viaje",
        ownerId: "user-demo-001",
        createdAt: new Date("2024-11-05T14:00:00.000Z"),
        updatedAt: new Date("2024-11-06T09:00:00.000Z")
      },
      {
        id: "event-demo-003",
        name: "Gastos de Casa - Noviembre",
        description: "Gastos compartidos del departamento",
        startDate: new Date("2024-11-01T00:00:00.000Z"),
        endDate: new Date("2024-11-30T23:59:59.000Z"),
        location: "Departamento Palermo",
        currency: "ARS",
        totalAmount: 45000,
        status: "completed",
        type: "private",
        category: "casa",
        ownerId: "user-demo-001",
        createdAt: new Date("2024-11-01T00:00:00.000Z"),
        updatedAt: new Date("2024-11-30T23:59:59.000Z")
      }
    ];
  }
  
  // Participantes de ejemplo
  static getDemoParticipants(): EventParticipant[] {
    return [
      {
        id: "participant-demo-001",
        eventId: "event-demo-001",
        userId: "user-demo-001", 
        name: "Demo",
        email: "demo@splitsmart.com",
        role: "owner",
        status: "active",
        joinedAt: new Date("2024-11-01T18:00:00.000Z")
      },
      {
        id: "participant-demo-002",
        eventId: "event-demo-001",
        userId: "user-friend-001",
        name: "Ana García",
        email: "ana.garcia@email.com", 
        role: "member",
        status: "active",
        joinedAt: new Date("2024-11-01T18:15:00.000Z")
      },
      {
        id: "participant-demo-003",
        eventId: "event-demo-001",
        userId: "user-friend-002",
        name: "Carlos Rodríguez",
        email: "carlos.rodriguez@email.com",
        role: "member", 
        status: "active",
        joinedAt: new Date("2024-11-01T18:20:00.000Z")
      },
      {
        id: "participant-demo-004",
        eventId: "event-demo-002",
        userId: "user-demo-001",
        name: "Demo",
        email: "demo@splitsmart.com",
        role: "owner",
        status: "active", 
        joinedAt: new Date("2024-11-05T14:00:00.000Z")
      },
      {
        id: "participant-demo-005",
        eventId: "event-demo-002",
        userId: "user-friend-003",
        name: "María López",
        email: "maria.lopez@email.com",
        role: "member",
        status: "active",
        joinedAt: new Date("2024-11-05T14:10:00.000Z")
      }
    ];
  }
  
  // Gastos de ejemplo  
  static getDemoExpenses(): Expense[] {
    return [
      {
        id: "expense-demo-001",
        eventId: "event-demo-001",
        description: "Cena principal",
        amount: 12000,
        currency: "ARS",
        date: new Date("2024-11-01T21:00:00.000Z"),
        category: "cena",
        payerId: "user-demo-001",
        receiptPhoto: "./assets/images/receipt-001.jpg",
        isActive: true,
        createdAt: new Date("2024-11-01T21:30:00.000Z"),
        updatedAt: new Date("2024-11-01T21:30:00.000Z")
      },
      {
        id: "expense-demo-002", 
        eventId: "event-demo-001",
        description: "Propinas",
        amount: 3000,
        currency: "ARS",
        date: new Date("2024-11-01T22:30:00.000Z"),
        category: "otro",
        payerId: "user-friend-001",
        isActive: true,
        createdAt: new Date("2024-11-01T22:45:00.000Z"),
        updatedAt: new Date("2024-11-01T22:45:00.000Z")
      },
      {
        id: "expense-demo-003",
        eventId: "event-demo-002",
        description: "Hotel - 2 noches", 
        amount: 45000,
        currency: "ARS",
        date: new Date("2024-12-15T15:00:00.000Z"),
        category: "viaje",
        payerId: "user-demo-001",
        receiptPhoto: "./assets/images/receipt-002.jpg",
        isActive: true,
        createdAt: new Date("2024-11-05T16:00:00.000Z"),
        updatedAt: new Date("2024-11-05T16:00:00.000Z")
      },
      {
        id: "expense-demo-004",
        eventId: "event-demo-002",
        description: "Combustible ida y vuelta",
        amount: 25000,
        currency: "ARS", 
        date: new Date("2024-12-15T08:00:00.000Z"),
        category: "transporte",
        payerId: "user-friend-003",
        isActive: true,
        createdAt: new Date("2024-11-05T17:00:00.000Z"),
        updatedAt: new Date("2024-11-05T17:00:00.000Z")
      },
      {
        id: "expense-demo-005",
        eventId: "event-demo-003",
        description: "Expensas del mes",
        amount: 35000,
        currency: "ARS",
        date: new Date("2024-11-10T10:00:00.000Z"),
        category: "casa",
        payerId: "user-demo-001", 
        isActive: true,
        createdAt: new Date("2024-11-10T10:30:00.000Z"),
        updatedAt: new Date("2024-11-10T10:30:00.000Z")
      }
    ];
  }
}
```

---

## ⚙️ **CONFIGURACIÓN INICIAL DEL PROYECTO**

### **Variables de Entorno**
```typescript
// .env.development (para testing local)
EXPO_PUBLIC_ENVIRONMENT=development
EXPO_PUBLIC_ENABLE_LOGGING=true
EXPO_PUBLIC_MOCK_DATA=true
EXPO_PUBLIC_AUTO_BACKUP=false

// .env.production (para APK final)
EXPO_PUBLIC_ENVIRONMENT=production  
EXPO_PUBLIC_ENABLE_LOGGING=false
EXPO_PUBLIC_MOCK_DATA=false
EXPO_PUBLIC_AUTO_BACKUP=true
```

### **Usuario DEMO para Testing**
```typescript
// Datos del usuario DEMO pre-configurado
const DEMO_USER = {
  id: "user-demo-001",
  name: "Demo",
  username: "Demo", 
  email: "demo@splitsmart.com",
  password: "demo123456", // Solo para testing - se hashea en producción
  requiresPassword: true,
  avatar: "./assets/images/demo-avatar.png",
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  preferences: {
    theme: "light",
    language: "es",
    currency: "ARS",
    biometricEnabled: false,
    notificationsEnabled: true
  }
};

// Configuración de login automático (solo development)
const DEMO_CONFIG = {
  autoLogin: false, // Cambiar a true para login automático en dev
  skipBiometric: true, // Saltar setup biométrico
  loadSampleData: true, // Cargar datos de ejemplo
  bypassAuth: false // Solo para testing extremo
};
```

### **Configuración Expo para APK (app.json)**
```json
{
  "expo": {
    "name": "SplitSmart",
    "slug": "splitsmart",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.cbalucas.splitsmart"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.cbalucas.splitsmart",
      "versionCode": 1,
      "permissions": [
        "USE_FINGERPRINT",
        "USE_BIOMETRIC",
        "WRITE_EXTERNAL_STORAGE",
        "READ_EXTERNAL_STORAGE"
      ]
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-secure-store",
      "expo-local-authentication",
      "expo-sqlite"
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

### **Dependencias Principales (package.json)**
```json
{
  "name": "splitsmart",
  "version": "1.0.0",
  "main": "expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "build:apk:dev": "eas build --platform android --profile preview",
    "build:apk:prod": "eas build --platform android --profile production",
    "prebuild": "expo prebuild --clean",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "lint": "eslint . --ext .ts,.tsx"
  },
  "dependencies": {
    "@react-native-async-storage/async-storage": "1.23.1",
    "@react-navigation/native": "^6.1.17",
    "@react-navigation/stack": "^6.3.29",
    "@react-navigation/bottom-tabs": "^6.5.20",
    "@react-navigation/drawer": "^6.6.15",
    "expo": "~51.0.28",
    "expo-local-authentication": "~14.0.1", 
    "expo-secure-store": "~13.0.2",
    "expo-sqlite": "~14.0.6",
    "expo-status-bar": "~1.12.1",
    "i18next": "^23.11.5",
    "react": "18.2.0",
    "react-native": "0.74.5",
    "react-native-vector-icons": "^10.1.0",
    "react-i18next": "^14.1.2",
    "react-native-screens": "3.31.1",
    "react-native-safe-area-context": "4.10.5",
    "react-native-gesture-handler": "~2.16.1",
    "react-native-reanimated": "~3.10.1",
    "uuid": "^10.0.0",
    "date-fns": "^3.6.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@types/react": "~18.2.45",
    "@types/uuid": "^10.0.0",
    "@typescript-eslint/eslint-plugin": "^7.7.0",
    "@typescript-eslint/parser": "^7.7.0",
    "eslint": "^8.57.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "jest": "^29.2.1",
    "jest-expo": "~51.0.3",
    "typescript": "~5.3.3"
  }
}
```

### **Configuración EAS Build (eas.json)**
```json
{
  "cli": {
    "version": ">= 8.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    },
    "production_apk": {
      "extends": "production",
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### **Scripts de Build Automatizados**
```bash
# Crear estos archivos en la raíz del proyecto:

# build-apk.sh (Linux/Mac)
#!/bin/bash
echo "🏗️ Construyendo APK de producción..."
npx eas build --platform android --profile production_apk --non-interactive

# build-apk.ps1 (Windows PowerShell)
Write-Host "🏗️ Construyendo APK de producción..." -ForegroundColor Green
npx eas build --platform android --profile production_apk --non-interactive

# test-build.sh (Testing build local)
#!/bin/bash
echo "🧪 Construyendo APK de prueba..."
expo prebuild --clean
cd android && ./gradlew assembleDebug
```

---

# 📋 **FASE 2: MODELOS Y ESTRUCTURA DE DATOS**

## 🗂️ **MODELOS DE DATOS Y TIPOS TYPESCRIPT**

### **Interfaces de Entidades Principales**
```typescript
// Usuario
interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Evento
interface Event {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
  currency: string;
  totalAmount: number;
  amount?: number; // Para compatibilidad
  status: 'active' | 'completed' | 'archived';
  type: 'public' | 'private';
  category: string;
  tags: string[];
  creatorId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Participante
interface Participant {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  alias_cbu?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Relación Evento-Participante
interface EventParticipant {
  id: string;
  eventId: string;
  participantId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  balance: number;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Gasto
interface Expense {
  id: string;
  eventId: string;
  description: string;
  amount: number;
  currency: string;
  date: Date;
  category: string;
  payerId: string; // quien pagó
  isActive: boolean;
  tags: string[];
  notes?: string;
  receiptImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// División de Gasto
interface Split {
  id: string;
  expenseId: string;
  participantId: string;
  amount: number;
  percentage?: number;
  type: 'equal' | 'fixed' | 'percentage';
  createdAt: Date;
  updatedAt: Date;
}

// Exclusiones (participantes excluidos de gastos específicos)
interface Exclusion {
  id: string;
  expenseId: string;
  participantId: string;
  reason?: string;
  createdAt: Date;
}

// Pagos entre participantes
interface Payment {
  id: string;
  eventId: string;
  fromParticipantId: string;
  toParticipantId: string;
  amount: number;
  date: Date;
  notes?: string;
  isConfirmed: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### **Relaciones y Integridad**
- Un **Evento** tiene múltiples **EventParticipants**
- Un **EventParticipant** referencia a un **Participant**
- Un **Expense** pertenece a un **Event** y es pagado por un **Participant**
- Un **Split** define cómo se divide un **Expense** entre **Participants**
- Una **Exclusion** excluye un **Participant** de un **Expense** específico
- Un **Payment** registra transferencias entre **Participants**

---

## 🔲 **MODALES Y COMPONENTES EMERGENTES**

### **📋 MODALES PRINCIPALES**

#### **👤 ADD PARTICIPANT MODAL**
```typescript
// Componente: AddParticipantModal
// Tipo: Bottom Sheet Modal (70% altura)
```

**📱 Modal Header:**
- **📝 Título**: "Agregar Participante"
- **❌ Cerrar**: Icono `close-outline` (top-right)
- **💾 Guardar**: Texto "Agregar" (top-right, habilitado si válido)

**📋 Form Content:**
- **👤 Información Personal (Card)**:
  - **📝 Nombre Completo**:
    - Input con icono `person-outline`
    - Placeholder: "Nombre del participante"
    - Validación: Required, min 2 caracteres
  
  - **📧 Email** (Opcional):
    - Input con icono `mail-outline`
    - Placeholder: "correo@ejemplo.com"
    - Validación: Formato email válido
  
  - **📱 Teléfono** (Opcional):
    - Input con icono `call-outline`
    - Placeholder: "+54 9 11 1234-5678"
    - Keyboard: phone-pad
  
  - **🏦 CBU/Alias** (Opcional):
    - Input con icono `card-outline`
    - Placeholder: "Alias o CBU para pagos"

- **👥 Buscar en Amigos (Card)**:
  - **🔍 SearchBar**: "Buscar en mis amigos..."
  - **📋 Lista de Amigos**:
    - FriendItem: Avatar + Nombre + Checkbox
    - onPress: auto-completar form con datos del amigo
    - Max height: 200px, scrollable

- **⚙️ Configuración del Participante (Card)**:
  - **🏷️ Rol en el Evento**:
    - Radio buttons: Admin, Member, Viewer
    - Default: Member
  - **✅ Incluir en Gastos por Defecto**:
    - Toggle switch: true por defecto
    - Explicación: "Se incluirá automáticamente en nuevos gastos"

**🔘 Action Buttons (Bottom):**
- **❌ Cancelar**: Outline button, cierra modal
- **✅ Agregar Participante**: Primary button
  - onPress: agregar a evento → actualizar lista → cerrar modal

---

#### **🎛️ FILTER MODAL**
```typescript
// Componente: FilterModal
// Tipo: Full Screen Modal con animación slide-up
```

**📱 Modal Header:**
- **❌ Cerrar**: "Cancelar" (top-left)
- **📝 Título**: "Filtros de Búsqueda"
- **🔄 Reset**: "Limpiar" (top-right) → resetear todos los filtros

**📋 Filter Sections (ScrollView):**

**📊 Estado del Evento (Card 1):**
- **📝 Label**: "Estado"
- **☑️ Checkboxes**:
  - ✅ Activos (default: checked)
  - ✅ Completados (default: checked)  
  - ✅ Archivados (default: unchecked)

**🏷️ Categorías (Card 2):**
- **📝 Label**: "Categorías"
- **🎯 Chip Selector** (Wrap layout):
  - 🧳 Viaje
  - 🏠 Casa
  - 🍽️ Cena
  - 💼 Trabajo
  - 🎉 Evento
  - 🔧 Otro
- **Multiselect**: múltiples categorías permitidas

**📅 Rango de Fechas (Card 3):**
- **📝 Label**: "Rango de Fechas"
- **📅 Fecha Desde**:
  - TouchableOpacity → DatePicker
  - Display: "DD/MM/YYYY" o "Sin límite"
- **📅 Fecha Hasta**:
  - Similar a fecha desde
  - Validación: posterior a fecha desde

**💰 Rango de Montos (Card 4):**
- **📝 Label**: "Monto Total"
- **💰 Monto Mínimo**:
  - NumberInput con símbolo de moneda
  - Placeholder: "0.00"
- **💰 Monto Máximo**:
  - Similar a monto mínimo
  - Validación: mayor a monto mínimo

**👥 Participantes (Card 5):**
- **📝 Label**: "Eventos con Participantes"
- **🔍 SearchBar**: "Buscar participante..."
- **👤 Lista de Participantes Disponibles**:
  - ParticipantCheckItem: Avatar + Nombre + Checkbox
  - Max height: 150px, scrollable
  - Multiselect permitido

**📍 Ubicación (Card 6):**
- **📝 Label**: "Ubicación"
- **🔍 SearchInput**: "Filtrar por ubicación..."
- **📍 Sugerencias**: Lista de ubicaciones usadas previamente

**🔘 Action Buttons (Sticky Bottom):**
- **❌ Cancelar**: cerrar modal sin aplicar
- **🔍 Aplicar Filtros**: 
  - Mostrar count de filtros activos
  - onPress: aplicar filtros → actualizar lista → cerrar modal

---

#### **⚖️ SETTLEMENT CONFIRMATION MODAL**
```typescript
// Componente: SettlementConfirmModal
// Tipo: Center Modal con backdrop
```

**💳 Payment Info Card:**
- **👤 From/To Display**:
  - Avatar del pagador (left) → Avatar del receptor (right)
  - Flecha grande en el medio: `arrow-forward-circle`
  - Nombres debajo de avatares
- **💰 Amount Display**:
  - Monto grande y centrado: "$500.00"
  - Moneda del evento

**📝 Payment Details:**
- **📅 Fecha**: DatePicker, default: hoy
- **📄 Notas** (Opcional):
  - TextInput multiline
  - Placeholder: "Notas sobre este pago..."
  - MaxLength: 200 caracteres
- **📷 Comprobante** (Opcional):
  - "Agregar foto del comprobante"
  - Image picker: camera/gallery
  - Preview si hay imagen

**❓ Confirmation Message:**
- **📝 Texto**: "¿Confirmar que se realizó este pago?"
- **ℹ️ Info**: "Se marcará como pagado en el resumen del evento"

**🔘 Action Buttons:**
- **❌ Cancelar**: cerrar modal sin acción
- **✅ Confirmar Pago**: 
  - onPress: crear payment record → actualizar balances → cerrar modal
  - Success toast: "Pago confirmado correctamente"

---

#### **🗑️ DELETE CONFIRMATION MODAL**
```typescript
// Componente: DeleteConfirmModal
// Tipo: Alert-style Modal (centrado, pequeño)
```

**⚠️ Warning Header:**
- **🛑 Icono**: `warning-outline` (48px, color: `#E74C3C`)
- **📝 Título**: Dinámico según contexto:
  - "¿Eliminar Evento?"
  - "¿Eliminar Gasto?"
  - "¿Eliminar Participante?"

**📝 Description:**
- **Texto contextual**:
  - Evento: "Se eliminará permanentemente el evento '[Nombre]' y todos sus gastos asociados."
  - Gasto: "Se eliminará el gasto '[Descripción]' por $[Monto]."
  - Participante: "Se eliminará a '[Nombre]' del evento y de todos los gastos asociados."
- **⚠️ Warning**: "Esta acción no se puede deshacer."

**🔘 Action Buttons (Row):**
- **❌ Cancelar**: 
  - Outline button, color: `#666`
  - onPress: cerrar modal
- **🗑️ Eliminar**: 
  - Filled button, background: `#E74C3C`
  - onPress: ejecutar eliminación → success toast → navegar back

---

#### **📤 SHARE MODAL**
```typescript
// Componente: ShareModal  
// Tipo: Bottom Sheet Modal (50% altura)
```

**📝 Header**: "Compartir Evento"

**📤 Share Options Grid (2x2):**
- **📱 Compartir Enlace**:
  - Icono: `link-outline` (32px, color: `#4B89DC`)
  - Texto: "Enlace del Evento"
  - onPress: copiar link al clipboard + toast

- **📊 Compartir Resumen**:
  - Icono: `stats-chart-outline` (32px, color: `#2ECC71`)
  - Texto: "Resumen como Imagen"
  - onPress: generar imagen → native share

- **📧 Enviar por Email**:
  - Icono: `mail-outline` (32px, color: `#F39C12`)
  - Texto: "Enviar por Email"
  - onPress: abrir email composer con datos

- **💬 Compartir en WhatsApp**:
  - Icono: WhatsApp icon (32px, color: `#25D366`)
  - Texto: "Enviar por WhatsApp"
  - onPress: abrir WhatsApp con mensaje formateado

**📋 Share Content Preview:**
- **Card con preview del contenido a compartir**:
  - Título del evento
  - Información básica
  - Resumen de gastos
- **✏️ Editar Mensaje**: 
  - TextArea para personalizar mensaje
  - Placeholder con mensaje por defecto

---

#### **🔍 PARTICIPANT DETAILS MODAL**
```typescript
// Componente: ParticipantDetailsModal
// Tipo: Bottom Sheet Modal (80% altura)
```

**👤 Participant Header:**
- **🖼️ Avatar**: 80x80px (grande)
- **📝 Nombre**: fontSize: 24, fontWeight: 'bold'
- **📧 Email**: fontSize: 16, color: `#666`
- **📱 Teléfono**: fontSize: 16, color: `#666`
- **🏦 CBU/Alias**: fontSize: 16, color: `#666`

**📊 Balance Summary Card:**
- **💰 Balance Total**: 
  - Monto grande, colored
  - "Debe pagar $500" / "Le deben $300" / "Equilibrado"
- **📈 Breakdown**:
  - Total pagado por esta persona: $X
  - Total que debe: $Y
  - Diferencia: $Z

**💸 Gastos Relacionados:**
- **📝 Header**: "Gastos de este Participante"
- **📋 Lista de ExpenseItems**:
  - Solo gastos donde este participante está involucrado
  - ExpenseItem simplificado:
    - Descripción + Monto
    - "Pagó" / "Debe $X" / "Ya pagado"
    - Fecha
  - Max height: 200px, scrollable

**💳 Historial de Pagos:**
- **📝 Header**: "Historial de Pagos"
- **📋 Lista de PaymentItems**:
  - PaymentItem:
    - "Pagó $X a [Nombre]" / "Recibió $X de [Nombre]"
    - Fecha
    - Estado: Confirmado/Pendiente
  - Empty state: "No hay pagos registrados"

**⚙️ Quick Actions:**
- **💳 Registrar Pago**:
  - Botón: "Registrar Pago desde/hacia esta persona"
  - onPress: abrir SettlementConfirmModal con este participante
- **✏️ Editar Participante**:
  - onPress: navegar a EditParticipantScreen
- **🗑️ Eliminar Participante**:
  - onPress: DeleteConfirmModal

---

#### **📊 EXPENSE SPLIT DETAILS MODAL**
```typescript
// Componente: ExpenseSplitModal
// Tipo: Bottom Sheet Modal (70% altura)
```

**💸 Expense Header:**
- **📝 Descripción**: fontSize: 20, fontWeight: 'bold'
- **💰 Monto Total**: fontSize: 18, color: amount color
- **👤 Pagado por**: "Pagado por [Nombre]"
- **📅 Fecha**: Fecha formateada

**🧮 Split Breakdown:**
- **📝 Tipo de División**: 
  - Chip: "División Igual" / "Por Porcentajes" / "Montos Fijos"
- **📊 División Details**:
  
**Para División Igual:**
- **👥 Participantes Incluidos**: X personas
- **💰 Monto por Persona**: $Y cada uno

**Para División por %:**
- **📋 Lista de Splits**:
  - SplitItem por participante:
    - Avatar + Nombre
    - Porcentaje: XX%
    - Monto resultante: $Y

**Para Montos Fijos:**
- **📋 Lista de Montos**:
  - SplitItem por participante:
    - Avatar + Nombre  
    - Monto fijo: $X

**❌ Exclusiones:**
- **📝 Header**: "No Incluidos" (si hay exclusiones)
- **👥 Lista de Excluidos**:
  - Participante + razón de exclusión

**💳 Payment Status:**
- **📋 Estado por Participante**:
  - StatusItem:
    - Avatar + Nombre
    - Estado: ✅ Pagado / ❌ Pendiente / ⏳ Parcial
    - Botón "Marcar como Pagado" (si pendiente)

**🔘 Actions:**
- **✏️ Editar División**: navegar a EditExpenseScreen
- **💳 Registrar Pagos**: quick access a marcar pagados

---

#### **💾 BACKUP OPTIONS MODAL**
```typescript
// Componente: BackupOptionsModal
// Tipo: Full Screen Modal
```

**📱 Header:**
- **❌ Cerrar**: "Cancelar"
- **📝 Título**: "Crear Backup Manual"

**⚙️ Backup Configuration:**

**📂 Qué Incluir (Card 1):**
- **☑️ Checkboxes**:
  - ✅ Todos los Eventos (default: checked)
  - ✅ Todos los Participantes (default: checked)
  - ✅ Historial de Pagos (default: checked)
  - ☑️ Imágenes de Comprobantes (default: unchecked)
  - ☑️ Configuración Personal (default: checked)

**📋 Selección de Eventos (Card 2):**
- **🔘 Radio Options**:
  - ○ Todos los Eventos
  - ○ Solo Eventos Activos
  - ○ Seleccionar Eventos Específicos
- **📋 Event Selector** (si "específicos" seleccionado):
  - Lista con checkboxes de eventos
  - Search bar para filtrar

**💾 Formato de Backup (Card 3):**
- **🔘 Radio Options**:
  - ○ JSON (Completo, legible)
  - ○ ZIP Comprimido (Menos espacio)
  - ○ CSV (Solo datos tabulares)

**🔐 Seguridad (Card 4):**
- **☑️ Opciones**:
  - ☑️ Encriptar Backup (password protected)
  - ☑️ Incluir Metadata (timestamps, versiones)

**📁 Destino (Card 5):**
- **📂 Ubicación**: Display carpeta actual
- **🔄 Cambiar**: Botón para seleccionar carpeta
- **💽 Espacio Disponible**: "XX MB disponibles"

**📊 Preview:**
- **📈 Resumen del Backup**:
  - Eventos a incluir: X
  - Participantes únicos: Y  
  - Gastos totales: Z
  - Tamaño estimado: XX MB

**🔘 Action Buttons:**
- **❌ Cancelar**: cerrar modal
- **💾 Crear Backup**: 
  - onPress: generar backup → progress modal → success toast
  - Show progress bar durante creación

---

## � **COMPONENTES REUTILIZABLES**

### **📱 HEADER BAR COMPONENT**
```typescript
// Componente: HeaderBar
// Props: title, showBack, rightAction, theme
```

**📏 Dimensions:**
- Height: 56px (Android), 44px + SafeArea (iOS)
- Background: `theme.colors.surface`
- Elevation: 2 (Android), shadow (iOS)

**🏗️ Layout Structure:**
- **⬅️ Left Section (48px)**:
  - Si `showBack=true`: 
    - BackButton: icono `arrow-back-outline` (24px)
    - TouchableOpacity: 48x48px hit area
    - onPress: navigation.goBack()
  - Si no: espacio vacío de 16px

- **📝 Center Section (flex: 1)**:
  - Title: fontSize: 18, fontWeight: '600'
  - Color: `theme.colors.onSurface`
  - TextAlign: center
  - numberOfLines: 1, ellipsizeMode: 'tail'

- **⚙️ Right Section (48px)**:
  - Si `rightAction` existe:
    - ActionButton: TouchableOpacity 48x48px
    - Icono o texto personalizable
  - Si no: espacio vacío

**🎨 Theme Variations:**
- Light: background `#FFFFFF`, text `#000000`
- Dark: background `#1A1A1A`, text `#FFFFFF`

---

### **🚨 ALERT COMPONENT**
```typescript
// Componente: Alert
// Props: type, title, message, actions, visible
```

**📦 Container:**
- Position: absolute, centered
- Background: `theme.colors.surface`
- BorderRadius: 12px
- Padding: 24px
- MaxWidth: 320px
- Elevation: 8, shadowRadius: 16

**🎯 Alert Types:**

**ℹ️ INFO:**
- Icon: `information-circle-outline` (48px, color: `#4B89DC`)
- Title: fontSize: 18, fontWeight: 'bold'
- Message: fontSize: 16, color: `theme.colors.onSurface`

**⚠️ WARNING:**
- Icon: `warning-outline` (48px, color: `#F39C12`)
- Title: color: `#F39C12`

**❌ ERROR:**
- Icon: `close-circle-outline` (48px, color: `#E74C3C`)
- Title: color: `#E74C3C`

**✅ SUCCESS:**
- Icon: `checkmark-circle-outline` (48px, color: `#2ECC71`)
- Title: color: `#2ECC71`

**🔘 Action Buttons:**
- Layout: Row, justifyContent: 'flex-end'
- Button spacing: 12px
- Cada botón: padding 12x16px, borderRadius 8px
- Primary: background `theme.colors.primary`
- Secondary: background transparent, border 1px

---

### **📝 INPUT COMPONENT**
```typescript
// Componente: Input
// Props: label, value, onChangeText, error, icon, type
```

**🏷️ Label (si existe):**
- FontSize: 14, fontWeight: '500'
- Color: `theme.colors.onSurface`
- MarginBottom: 8px

**📦 Input Container:**
- Background: `theme.colors.surface`
- Border: 1px solid `theme.colors.outline`
- BorderRadius: 8px
- Height: 48px
- FlexDirection: 'row', alignItems: 'center'

**🎯 Icon (si existe):**
- Position: absolute left 12px
- Size: 20px
- Color: `theme.colors.onSurfaceVariant`

**📝 TextInput:**
- Flex: 1
- PaddingHorizontal: icon ? 44px : 16px
- FontSize: 16
- Color: `theme.colors.onSurface`

**📱 Input Types:**
- **text**: default keyboard
- **email**: emailAddress keyboard
- **phone**: phone-pad keyboard  
- **number**: numeric keyboard
- **password**: secureTextEntry: true

**❌ Error State:**
- Border color: `#E74C3C`
- Error text: fontSize 12, color `#E74C3C`
- MarginTop: 4px

**✅ Valid State:**
- Border color: `#2ECC71` (si touched)

---

### **🃏 CARD COMPONENT**
```typescript
// Componente: Card
// Props: children, padding, elevation, onPress
```

**📦 Container:**
- Background: `theme.colors.surface`
- BorderRadius: 12px
- Elevation: props.elevation || 2
- Shadow iOS: offset {0, 2}, radius: 4, opacity: 0.1
- Margin: 8px (default)

**📏 Padding Options:**
- 'none': 0px
- 'small': 12px
- 'medium': 16px (default)
- 'large': 24px

**👆 Touchable (si onPress):**
- TouchableOpacity con activeOpacity: 0.7
- Ripple effect (Android)

**🎨 Variants:**
- **default**: elevation 2
- **elevated**: elevation 4
- **outlined**: elevation 0, border 1px

---

### **🛡️ AVATAR COMPONENT**
```typescript
// Componente: Avatar
// Props: name, image, size, badge
```

**📏 Size Options:**
- 'small': 32x32px
- 'medium': 48x48px (default) 
- 'large': 64x64px
- 'xlarge': 80x80px

**🖼️ Image Display:**
- Si `image` existe: Image component, borderRadius: size/2
- Si no imagen: iniciales del nombre
  - Background: generado desde hash del nombre
  - Colors array: 8 colores diferentes
  - Iniciales: máximo 2 caracteres, uppercase

**🔴 Badge (si existe):**
- Position: absolute, top: -2px, right: -2px
- Size: 16x16px, borderRadius: 8px
- Background: `#E74C3C`
- Border: 2px solid background color
- Content: número o dot

---

### **🏷️ CHIP COMPONENT**
```typescript
// Componente: Chip
// Props: label, selected, onPress, variant, icon
```

**📦 Container:**
- Height: 32px
- BorderRadius: 16px
- PaddingHorizontal: 12px
- FlexDirection: 'row', alignItems: 'center'

**🎨 Variants:**

**Default (unselected):**
- Background: transparent
- Border: 1px solid `theme.colors.outline`
- Text color: `theme.colors.onSurface`

**Selected:**
- Background: `theme.colors.primary`
- Border: none
- Text color: `theme.colors.onPrimary`

**Filter:**
- Background: `theme.colors.secondaryContainer`
- Text color: `theme.colors.onSecondaryContainer`

**🎯 Icon (si existe):**
- Size: 16px
- MarginRight: 4px
- Color: text color

**📝 Label:**
- FontSize: 14
- FontWeight: '500'

---

### **📋 LIST ITEM COMPONENT**
```typescript
// Componente: ListItem
// Props: title, subtitle, leftElement, rightElement, onPress
```

**📦 Container:**
- Height: mínimo 56px (1 línea), 72px (2 líneas)
- PaddingHorizontal: 16px
- FlexDirection: 'row', alignItems: 'center'
- Background: `theme.colors.surface`

**⬅️ Left Element (56px):**
- Width: 56px, justifyContent: 'center'
- Puede ser: Avatar, Icon, Checkbox, Radio

**📝 Content (flex: 1):**
- **Title**: 
  - FontSize: 16, fontWeight: '500'
  - Color: `theme.colors.onSurface`
  - NumberOfLines: 1
  
- **Subtitle** (si existe):
  - FontSize: 14
  - Color: `theme.colors.onSurfaceVariant`
  - NumberOfLines: 1
  - MarginTop: 2px

**➡️ Right Element (auto width):**
- AlignItems: 'flex-end'
- Puede ser: Icon, Switch, Badge, Text

**👆 Touchable (si onPress):**
- TouchableOpacity, activeOpacity: 0.7
- Ripple effect (Android)

---

### **🔘 BUTTON COMPONENT**
```typescript
// Componente: Button
// Props: title, onPress, variant, size, icon, disabled, loading
```

**📏 Size Options:**
- 'small': height 36px, fontSize 14, padding 8x16px
- 'medium': height 44px, fontSize 16, padding 12x20px (default)
- 'large': height 52px, fontSize 18, padding 16x24px

**🎨 Variants:**

**Primary:**
- Background: `theme.colors.primary`
- Text: `theme.colors.onPrimary`
- Border: none

**Secondary:**
- Background: `theme.colors.secondary`
- Text: `theme.colors.onSecondary`
- Border: none

**Outline:**
- Background: transparent
- Text: `theme.colors.primary`
- Border: 1px solid `theme.colors.primary`

**Ghost:**
- Background: transparent
- Text: `theme.colors.primary`
- Border: none

**🎯 Icon (si existe):**
- Size: 20px (small: 16px, large: 24px)
- Position: left del texto
- MarginRight: 8px

**⏳ Loading State:**
- ActivityIndicator reemplaza icon/text
- Disabled: true
- Same colors as variant

**❌ Disabled State:**
- Opacity: 0.5
- TouchableOpacity disabled: true

---

### **📊 PROGRESS BAR COMPONENT**
```typescript
// Componente: ProgressBar
// Props: progress, color, height, animated
```

**📦 Container:**
- Height: props.height || 8px
- Background: `theme.colors.outline` (opacity: 0.3)
- BorderRadius: height/2
- Overflow: 'hidden'

**🎯 Progress Fill:**
- Height: 100%
- Width: `${progress}%` (0-100)
- Background: props.color || `theme.colors.primary`
- BorderRadius: height/2

**🎬 Animation (si animated=true):**
- useSharedValue para width
- withTiming duration: 300ms
- Reanimated2 compatibility

---

### **🏷️ BADGE COMPONENT**
```typescript
// Componente: Badge
// Props: count, color, size, position
```

**📏 Size Options:**
- 'small': 16x16px, fontSize: 10
- 'medium': 20x20px, fontSize: 12 (default)
- 'large': 24x24px, fontSize: 14

**📦 Container:**
- BorderRadius: size/2
- Background: props.color || `#E74C3C`
- MinWidth: size
- Height: size
- Padding: 0-4px (según content)

**📝 Content:**
- Color: white
- FontWeight: 'bold'
- TextAlign: 'center'
- NumberOfLines: 1

**📍 Position (si se usa como overlay):**
- Position: 'absolute'
- Top: -size/4
- Right: -size/4

**🎯 Count Display:**
- Si count <= 99: mostrar número
- Si count > 99: mostrar "99+"
- Si count = 0: no renderizar

---

## �🧮 **ALGORITMOS DE CÁLCULO MATEMÁTICO**

### **Cálculo de Balances - Algoritmo Principal**
```typescript
function calculateParticipantBalances(
  eventId: string,
  expenses: Expense[],
  splits: Split[],
  payments: Payment[]
): ParticipantBalance[] {
  
  const balances: { [participantId: string]: ParticipantBalance } = {};
  
  // PASO 1: Calcular lo que cada uno pagó (créditos)
  expenses.forEach(expense => {
    if (!balances[expense.payerId]) {
      balances[expense.payerId] = { 
        participantId: expense.payerId, 
        totalPaid: 0, 
        totalOwed: 0, 
        balance: 0 
      };
    }
    balances[expense.payerId].totalPaid += expense.amount;
  });
  
  // PASO 2: Calcular lo que cada uno debe (débitos)
  splits.forEach(split => {
    if (!balances[split.participantId]) {
      balances[split.participantId] = { 
        participantId: split.participantId, 
        totalPaid: 0, 
        totalOwed: 0, 
        balance: 0 
      };
    }
    balances[split.participantId].totalOwed += split.amount;
  });
  
  // PASO 3: Calcular balance neto (pagado - debe)
  Object.values(balances).forEach(balance => {
    balance.balance = balance.totalPaid - balance.totalOwed;
  });
  
  // PASO 4: Aplicar pagos confirmados
  payments.filter(p => p.isConfirmed).forEach(payment => {
    if (balances[payment.fromParticipantId]) {
      balances[payment.fromParticipantId].balance -= payment.amount;
    }
    if (balances[payment.toParticipantId]) {
      balances[payment.toParticipantId].balance += payment.amount;
    }
  });
  
  return Object.values(balances);
}
```

### **Algoritmo de Liquidación Óptima**
```typescript
function calculateOptimalSettlement(balances: ParticipantBalance[]): Settlement[] {
  const TOLERANCE = 0.01; // Margen de tolerancia para redondeo
  
  // Separar deudores y acreedores
  const debtors = balances
    .filter(b => b.balance < -TOLERANCE)
    .map(b => ({ id: b.participantId, amount: Math.abs(b.balance) }))
    .sort((a, b) => b.amount - a.amount); // Mayor deudor primero
  
  const creditors = balances
    .filter(b => b.balance > TOLERANCE)
    .map(b => ({ id: b.participantId, amount: b.balance }))
    .sort((a, b) => b.amount - a.amount); // Mayor acreedor primero
    
  const settlements: Settlement[] = [];
  
  // Algoritmo de emparejamiento óptimo
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    
    const transferAmount = Math.min(debtor.amount, creditor.amount);
    
    if (transferAmount > TOLERANCE) {
      settlements.push({
        fromParticipantId: debtor.id,
        toParticipantId: creditor.id,
        amount: Math.round(transferAmount * 100) / 100 // Redondear a 2 decimales
      });
    }
    
    debtor.amount -= transferAmount;
    creditor.amount -= transferAmount;
    
    if (debtor.amount < TOLERANCE) i++;
    if (creditor.amount < TOLERANCE) j++;
  }
  
  return settlements;
}
```

### **Tipos de División de Gastos**
1. **División Igual**: Monto total ÷ número de participantes
2. **División por Porcentajes**: Cada participante paga un % específico
3. **División por Montos Fijos**: Montos específicos por participante
4. **División Personalizada**: Combinación de los anteriores

---

# 📋 **FASE 6: INTERNACIONALIZACIÓN Y TESTING**

## 🌐 **SISTEMA DE INTERNACIONALIZACIÓN**

### **Idiomas Soportados**
- **Español (ES)** - Idioma principal
- **Inglés (EN)** - Idioma secundario
- **Portugués (PT)** - Idioma adicional

### **Estructura de Traducciones**
```typescript
// es.json
{
  "common": {
    "appName": "SplitSmart",
    "cancel": "Cancelar",
    "save": "Guardar",
    "delete": "Eliminar",
    "edit": "Editar",
    "loading": "Cargando...",
    // ... +50 términos comunes
  },
  "auth": {
    "login": "Iniciar Sesión",
    "signup": "Registrarse",
    "forgotPassword": "¿Olvidaste tu contraseña?",
    "biometric": {
      "useFingerprint": "Usar huella digital",
      "fingerprintPrompt": "Coloca tu dedo en el sensor",
      "notAvailable": "Biometría no disponible"
    }
    // ... +100 términos de autenticación
  },
  "events": {
    "createEvent": "Crear Evento",
    "eventDetails": "Detalles del Evento",
    "addExpense": "Agregar Gasto",
    "addParticipant": "Agregar Participante",
    // ... +200 términos de eventos
  },
  "expenses": {
    "description": "Descripción",
    "amount": "Monto",
    "category": "Categoría",
    "paidBy": "Pagado por",
    "splitType": "Tipo de División",
    "splitTypes": {
      "equal": "División Igual",
      "percentage": "Por Porcentajes",
      "fixed": "Montos Fijos",
      "custom": "Personalizada"
    }
    // ... +150 términos de gastos
  },
  // ... más secciones
}
```

### **Configuración i18next**
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: require('./es.json') },
      en: { translation: require('./en.json') },
      pt: { translation: require('./pt.json') }
    },
    lng: 'es', // Idioma por defecto
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false
    }
  });
```

---

## 🎯 **FUNCIONALIDADES PRINCIPALES**

### **1. Gestión de Eventos**
- **Crear Eventos**: Formulario completo (nombre, descripción, fechas, ubicación, tipo)
- **Listar Eventos**: Filtrado, búsqueda, ordenamiento
- **Estados**: Activo, Completado, Archivado
- **Tipos**: Público, Privado
- **Swipe Actions**: Editar, eliminar, activar/desactivar
- **Pull-to-refresh**: Actualización manual

### **2. Gestión de Participantes**
- **Agregar Participantes**: Manual o desde contactos
- **Roles**: Owner, Admin, Member, Viewer
- **Información**: Nombre, email, teléfono, CBU/Alias
- **Participantes Recurrentes**: Lista de amigos frecuentes
- **Exclusiones**: Excluir de gastos específicos

### **3. Gestión de Gastos**
- **Crear Gastos**: Descripción, monto, categoría, fecha
- **Tipos de División**: 4 métodos diferentes
- **Selección de Pagador**: Quien realizó el pago
- **Comprobantes**: Foto del recibo (opcional)
- **Categorías**: Comida, Transporte, Alojamiento, etc.
- **Edición Completa**: Modificar todos los campos

### **4. Sistema de Pagos**
- **Cálculo Automático**: Balances en tiempo real
- **Liquidación Óptima**: Minimizar número de transacciones
- **Registro de Pagos**: Marcar pagos como realizados
- **Estados**: Pendiente, Confirmado
- **Historial**: Registro completo de transacciones

### **5. Resumen y Estadísticas Offline**
- **Dashboard por Evento**: Métricas calculadas localmente
- **Balances Individuales**: Por participante (cálculo offline)
- **Gastos por Categoría**: Análisis de distribución local
- **Gráficos**: Visualización con datos del dispositivo
- **Exportación Local**: PDF, CSV, JSON a carpeta del dispositivo

### **6. Sistema de Backup Manual**
- **Backup Completo**: Exportar todos los datos a JSON/ZIP
- **Backup Selectivo**: Exportar eventos específicos
- **Restauración**: Importar desde archivo de backup
- **Exportación Programada**: Recordatorios para backup
- **Ubicación Configurable**: Elegir carpeta de destino
- **Formatos**: JSON, CSV, PDF, ZIP comprimido

### **7. Perfil y Configuración Offline**
- **Perfil de Usuario**: Almacenado localmente
- **Preferencias**: Idioma, tema, moneda (sin conexión)
- **Seguridad**: Configurar biometría, timeouts locales
- **Gestión de Amigos**: Lista persistente local
- **Configuración de Backup**: Frecuencia y ubicación

---

# 📋 **FASE 5: PANTALLAS Y NAVEGACIÓN**

## 📱 **PANTALLAS DETALLADAS (UI/UX COMPLETO)**

### **📋 ESPECIFICACIONES MINUCIOSAS DE CADA PANTALLA**

#### **🌟 1. SPLASH SCREEN** 
```typescript
// Ubicación: src/screens/Splash/index.tsx
// Duración: 2.5 segundos
```

**Layout Vertical (Centro de pantalla):**
- **🎨 Fondo**: Color sólido `#4B89DC` (azul principal)
- **📱 Logo**: Centrado, 120x120px, imagen `./assets/splitsmart/logo-white.png`
- **📝 Tagline**: Debajo del logo, 16px margin-top
  - Texto: "Divide gastos de forma inteligente con amigos y familiares"
  - Color: `#FFFFFF`, fontSize: 16, textAlign: 'center'
  - Padding horizontal: 40px
- **⏱️ Timer**: Invisible, 2500ms → navegar a LoginScreen
- **📱 StatusBar**: Oculta durante splash

**Animaciones:**
- Logo: FadeIn 800ms + ScaleIn desde 0.8 a 1.0
- Tagline: FadeIn 1200ms con delay 400ms

---

#### **🔐 2. LOGIN SCREEN** 
```typescript
// Ubicación: src/screens/Auth/Login/index.tsx
// HeaderBar: NO visible
```

**Estructura Vertical:**

**📱 Header Section (Top 30%):**
- **🎨 Fondo**: Gradiente de `#4B89DC` a `#6C9FFF`
- **📱 Logo**: 80x80px, centrado
- **📝 Título**: "Bienvenido a SplitSmart"
  - Color: `#FFFFFF`, fontSize: 24, fontWeight: 'bold'
- **📝 Subtítulo**: "Inicia sesión para continuar"
  - Color: `#E8F4FD`, fontSize: 16, margin-top: 8px

**📋 Form Section (Middle 50%):**
- **🎨 Container**: Card blanca con borderRadius: 20, margin: 20px
- **📝 Input Usuario/Email**:
  - Placeholder: "Usuario o Email"
  - Icono: `person-outline` (Ionicons, 20px, color: `#4B89DC`)
  - Posición icono: Left, 15px padding
  - Border: 1px solid `#D0D0D0`, borderRadius: 12px
  - Height: 50px, margin-bottom: 16px
- **📝 Input Contraseña**:
  - Placeholder: "Contraseña"
  - Icono: `lock-closed-outline` (Left) + `eye-outline`/`eye-off-outline` (Right)
  - Toggle visibilidad contraseña al tocar icono derecho
  - Mismo styling que input anterior

**🔄 Métodos de Login (Vertical Stack):**
1. **🔵 Botón Login Principal**:
   - Texto: "Iniciar Sesión"
   - Width: 100%, height: 50px
   - Background: `#4B89DC`, borderRadius: 12px
   - Color texto: `#FFFFFF`, fontSize: 16, fontWeight: '600'
   - onPress: `handleLogin()` → validar y navegar a HomeScreen

2. **👆 Botón Biométrico** (si disponible):
   - Icono: `finger-print` (Ionicons, 24px)
   - Texto: "Usar huella digital"
   - Background: `#F8F8F8`, border: 1px solid `#D0D0D0`
   - onPress: `handleBiometricLogin()` → prompt biométrico

3. **📧 Link Passwordless**:
   - Texto: "Ingresar sin contraseña"
   - Color: `#4B89DC`, fontSize: 14, textAlign: 'center'
   - onPress: navegar a PasswordlessScreen

**📋 Footer Section (Bottom 20%):**
- **📝 Link Olvidé Contraseña**:
  - Texto: "¿Olvidaste tu contraseña?"
  - Color: `#8E44AD`, fontSize: 14, textAlign: 'center'
  - onPress: navegar a ForgotPasswordScreen
- **📝 Divisor**: "O" con líneas horizontales
- **🔗 Link Registro**:
  - Texto: "¿No tienes cuenta? Crear cuenta"
  - Color: `#4B89DC`, fontSize: 16, fontWeight: '600'
  - onPress: navegar a SignUpScreen

**⚠️ Validaciones:**
- Email: Formato válido, required
- Contraseña: Mínimo 6 caracteres, required
- Error display: Alert toast rojo en top

---

#### **📝 3. SIGNUP SCREEN**
```typescript
// Ubicación: src/screens/Auth/SignUp/index.tsx
// HeaderBar: SÍ visible con botón back
```

**📱 HeaderBar:**
- **⬅️ Botón Back**: `arrow-back-outline`, onPress: navegar a LoginScreen
- **📝 Título**: "Crear Cuenta"
- **🎨 Background**: `#4B89DC`

**📋 Form Scrollable (Padding 20px):**
- **🎨 Container**: Card blanca, borderRadius: 16px, padding: 24px

**👤 Información Personal:**
1. **📝 Input Nombre Completo**:
   - Label: "Nombre Completo" (fontSize: 14, color: `#666`, margin-bottom: 6px)
   - Placeholder: "Ingresa tu nombre completo"
   - Icono: `person-outline` (left)
   - Validación: Required, mínimo 2 caracteres

2. **📧 Input Email**:
   - Label: "Correo Electrónico"
   - Placeholder: "ejemplo@correo.com"
   - Icono: `mail-outline` (left)
   - Validación: Email válido, required, único

3. **📱 Input Teléfono** (Opcional):
   - Label: "Teléfono (Opcional)"
   - Placeholder: "+54 9 11 1234-5678"
   - Icono: `call-outline` (left)

4. **🔒 Input Contraseña**:
   - Label: "Contraseña"
   - Placeholder: "Mínimo 8 caracteres"
   - Iconos: `lock-closed-outline` (left) + toggle visibility (right)
   - Validación: Mínimo 8 caracteres, mayúscula, minúscula, número

5. **🔒 Confirmar Contraseña**:
   - Label: "Confirmar Contraseña"
   - Placeholder: "Repite tu contraseña"
   - Validación: Debe coincidir con contraseña

**⚙️ Configuraciones Iniciales:**
- **🌐 Selector Idioma**:
  - Label: "Idioma Preferido"
  - Dropdown con banderas: 🇦🇷 Español | 🇺🇸 English | 🇧🇷 Português
  - Default: Español

- **🎨 Selector Tema**:
  - Label: "Tema de Aplicación"
  - Toggle Switch: "Tema Oscuro"
  - Default: false (tema claro)

**✅ Términos y Condiciones:**
- **☑️ Checkbox**: "Acepto los términos y condiciones"
- **🔗 Link**: "Ver términos" → Modal con términos

**🔵 Botones (Footer Sticky):**
1. **Botón Crear Cuenta**:
   - Texto: "Crear Cuenta"
   - Full width, height: 50px
   - Background: `#4B89DC`, disabled si form inválido
   - onPress: `handleSignUp()` → crear cuenta y navegar a HomeScreen

2. **Link Ya Tengo Cuenta**:
   - Texto: "¿Ya tienes una cuenta? Iniciar sesión"
   - onPress: navegar a LoginScreen

---

#### **🏠 4. HOME SCREEN (Pantalla Principal)**
```typescript
// Ubicación: src/screens/Home/index.tsx
// HeaderBar: SÍ visible con opciones completas
```

**📱 HeaderBar Personalizada:**
- **🎨 Background**: Gradiente `#4B89DC` → `#6C9FFF`
- **📝 Título**: "Mis Eventos" (Left aligned)
- **👤 Avatar Usuario**: 32x32px circle, right side
  - onPress: navegar a ProfileScreen
- **🌐 Selector Idioma**: Bandera actual (20x15px)
  - onPress: Dropdown con 3 idiomas
- **🌙 Toggle Tema**: `sunny-outline`/`moon-outline` (24px)
  - onPress: cambiar tema claro/oscuro
- **🔍 Icono Búsqueda**: `search-outline` (24px)
  - onPress: activar SearchBar

**🔍 SearchBar (Expandible):**
- **📝 Input**: "Buscar eventos..."
- **🎛️ Filtros**: Icono `filter-outline` (right)
  - onPress: abrir FilterModal

**📊 Métricas Quick (Horizontal Scroll):**
```typescript
// 3 Cards pequeñas en row
```
1. **💰 Card Total Gastado**:
   - Icono: `cash-outline` (24px, color: `#2ECC71`)
   - Número: "$45,320" (fontSize: 20, fontWeight: 'bold')
   - Label: "Total Gastado" (fontSize: 12)

2. **🎉 Card Eventos Activos**:
   - Icono: `calendar-outline` (24px, color: `#4B89DC`)
   - Número: "8" (fontSize: 20, fontWeight: 'bold')
   - Label: "Eventos Activos" (fontSize: 12)

3. **👥 Card Amigos**:
   - Icono: `people-outline` (24px, color: `#8E44AD`)
   - Número: "23" (fontSize: 20, fontWeight: 'bold')
   - Label: "Amigos" (fontSize: 12)

**📋 Lista de Eventos (ScrollView):**
- **🔄 Pull-to-Refresh**: Habilitado
- **📱 EventCard** (Repetible):

**📄 EventCard Estructura:**
```typescript
// Card: borderRadius: 16px, margin: 16px horizontal, 8px vertical
// Shadow: elevation: 4, shadowOpacity: 0.1
```

**Header (Row Layout):**
- **🎨 Status Indicator**: Circle 8px
  - Verde: Activo | Amarillo: Completado | Gris: Archivado
- **📝 Nombre Evento**: fontSize: 18, fontWeight: '600', flex: 1
- **💰 Monto Total**: fontSize: 16, fontWeight: 'bold', color: `#2ECC71`
- **⋮ Menú Opciones**: `ellipsis-vertical-outline`
  - onPress: ActionSheet (Editar, Archivar, Eliminar)

**Body (Column Layout):**
- **📍 Ubicación**: 
  - Icono: `location-outline` (16px) + Texto (fontSize: 14, color: `#666`)
- **📅 Fecha**:
  - Icono: `calendar-outline` (16px) + Fecha formateada
- **👥 Participantes**: 
  - Icono: `people-outline` (16px) + "X participantes"

**Footer (Row Layout):**
- **📊 Progreso Bar**: 
  - Background: `#F0F0F0`, fill: `#4B89DC`
  - Porcentaje de gastos vs presupuesto
- **🔢 Gastos Count**: "Y gastos" (fontSize: 12, color: `#888`)

**👆 Swipe Actions:**
- **➡️ Swipe Right**: Editar (icono: `create-outline`, color: `#4B89DC`)
- **⬅️ Swipe Left**: Archivar (icono: `archive-outline`, color: `#F39C12`)

**🔘 Floating Action Button:**
- **➕ Icono**: `add-outline` (28px, color: `#FFFFFF`)
- **🎨 Background**: `#4B89DC`, borderRadius: 28px (56x56px)
- **📍 Posición**: Bottom right, margin: 20px
- **onPress**: navegar a CreateEventScreen

**📱 Bottom Tab Bar:**
```typescript
// 4 Tabs principales
```
1. **🏠 Home**: `home-outline`/`home` + "Inicio"
2. **👥 Amigos**: `people-outline`/`people` + "Amigos"
3. **📊 Resumen**: `stats-chart-outline`/`stats-chart` + "Resumen"
4. **⚙️ Configuración**: `settings-outline`/`settings` + "Ajustes"

---

#### **📄 5. EVENT DETAILS SCREEN**
```typescript
// Ubicación: src/screens/EventDetails/index.tsx
// HeaderBar: SÍ con título dinámico y menú
```

**📱 HeaderBar:**
- **⬅️ Back Button**: navegar a HomeScreen
- **📝 Título**: Nombre del evento (truncado si es largo)
- **⋮ Menú**: ActionSheet con opciones:
  - Editar Evento → EditEventScreen
  - Compartir Evento → Share nativo
  - Archivar/Activar → toggle status
  - Eliminar Evento → Confirmation modal

**📊 Event Summary Card (Top Section):**
- **🎨 Background**: Gradiente suave del color del tema
- **📍 Info Row 1**: Ubicación + Fecha (iconos + texto)
- **💰 Info Row 2**: Monto total + Moneda
- **👥 Info Row 3**: Participantes count + Estado
- **📈 Progress Bar**: Gastos actuales vs presupuesto (si existe)

**🚀 Quick Actions Bar:**
```typescript
// 3 botones horizontales, igual width
```
1. **➕ Agregar Gasto**:
   - Icono: `add-circle-outline` (20px, color: `#4B89DC`)
   - Texto: "Agregar Gasto" (fontSize: 12)
   - onPress: navegar a CreateExpenseScreen

2. **👤 Agregar Participante**:
   - Icono: `person-add-outline` (20px, color: `#4B89DC`)
   - Texto: "Agregar Participante" (fontSize: 12)
   - onPress: abrir AddParticipantModal

3. **📊 Ver Resumen**:
   - Icono: `stats-chart-outline` (20px, color: `#4B89DC`)
   - Texto: "Ver Resumen" (fontSize: 12)
   - onPress: navegar a SummaryScreen con eventId

**📋 TabView (3 pestañas):**
```typescript
// TabBar: backgroundColor: theme.card, indicatorColor: theme.primary
```

**📝 Tab 1: GASTOS**
- **📋 Lista de ExpenseItems**:
  
**💸 ExpenseItem Estructura:**
```typescript
// Card individual por gasto
```
- **Header Row**:
  - **📝 Descripción**: fontSize: 16, fontWeight: '600'
  - **💰 Monto**: fontSize: 16, fontWeight: 'bold', color: amount color
  - **⋮ Menú**: Opciones (Editar, Eliminar)

- **Body Row**:
  - **👤 Pagado por**: "Pagado por Juan" (fontSize: 14, color: `#666`)
  - **📅 Fecha**: Fecha formateada
  - **🏷️ Categoría**: Chip con color de categoría

- **Footer Row** (si tiene splits):
  - **👥 División**: "Dividido entre X personas"
  - **📊 Ver División**: Link para ver detalles
  - **✅/❌ Estado**: Pagado/Pendiente por participante

**👆 Swipe Actions en ExpenseItem:**
- **➡️ Swipe Right**: Editar → EditExpenseScreen
- **⬅️ Swipe Left**: Eliminar → Confirmation modal

**👥 Tab 2: PARTICIPANTES**
- **📋 Lista de ParticipantItems**:

**👤 ParticipantItem Estructura:**
- **🖼️ Avatar**: 40x40px circle (imagen o iniciales)
- **📝 Info Column**:
  - Nombre (fontSize: 16, fontWeight: '600')
  - Email/Teléfono (fontSize: 14, color: `#666`)
  - Rol: Owner/Admin/Member (chip pequeño)
- **💰 Balance Column**:
  - Monto balance (fontSize: 16, fontWeight: 'bold')
  - Color: Verde (positive), Rojo (negative), Gris (zero)
  - Estado: "Debe pagar"/"Le deben"/"Equilibrado"
- **⋮ Menú**: Opciones (Editar, Eliminar, Cambiar rol)

**👆 Actions en ParticipantItem:**
- **onPress**: Modal con detalles completos del participante
- **onLongPress**: Quick actions menu

**📊 Tab 3: RESUMEN**
- **💰 Resumen Financiero Card**:
  - Total gastado
  - Gasto promedio por persona
  - Gastos por categoría (gráfico de barras mini)
  
- **⚖️ Balances Card**:
  - Lista de balances por participante
  - Cada balance con color indicativo
  - Total a liquidar

- **💳 Liquidaciones Recomendadas Card**:
  - Lista de pagos sugeridos para equilibrar
  - "Ana → Juan: $500"
  - Botón "Marcar como pagado" por liquidación

- **📈 Estadísticas Card**:
  - Gasto más alto
  - Categoría con más gastos
  - Participante que más gastó

---

#### **➕ 6. CREATE EVENT SCREEN**
```typescript
// Ubicación: src/screens/CreateEvent/index.tsx
// HeaderBar: SÍ con título "Crear Evento"
```

**📱 HeaderBar:**
- **⬅️ Back**: navegar a HomeScreen
- **📝 Título**: "Crear Evento"
- **💾 Botón Guardar**: "Guardar" (habilitado si form válido)
  - onPress: `handleCreateEvent()` → crear y navegar a EventDetails

**📋 Form (ScrollView con padding 20px):**

**📝 Información Básica (Card 1):**
- **🏷️ Nombre del Evento**:
  - Label: "Nombre del Evento *"
  - Placeholder: "Ej: Viaje a Bariloche"
  - Icono: `create-outline` (left)
  - MaxLength: 50 caracteres

- **📄 Descripción**:
  - Label: "Descripción (Opcional)"
  - Placeholder: "Describe de qué trata el evento..."
  - TextArea: multiline, height: 80px
  - MaxLength: 200 caracteres

**📅 Fechas y Ubicación (Card 2):**
- **📅 Fecha Inicio**:
  - Label: "Fecha de Inicio *"
  - TouchableOpacity: mostrar DatePicker
  - Display: fecha formateada
  - Icono: `calendar-outline` (left)

- **📅 Fecha Fin** (Opcional):
  - Label: "Fecha de Fin (Opcional)"
  - Similar a fecha inicio
  - Validación: debe ser posterior a fecha inicio

- **📍 Ubicación**:
  - Label: "Ubicación (Opcional)"
  - Placeholder: "Ej: Bariloche, Argentina"
  - Icono: `location-outline` (left)

**💰 Configuración Financiera (Card 3):**
- **💱 Moneda**:
  - Label: "Moneda *"
  - Picker/Dropdown: ARS, USD, EUR, BRL
  - Default: ARS
  - Icono: símbolo de moneda

- **💰 Presupuesto Estimado**:
  - Label: "Presupuesto Estimado (Opcional)"
  - Placeholder: "0.00"
  - Keyboard: numeric
  - Icono: `cash-outline` (left)

**⚙️ Configuración de Privacidad (Card 4):**
- **🌍 Tipo de Evento**:
  - Radio buttons:
    - 🌐 Público: "Visible para todos los usuarios"
    - 🔒 Privado: "Solo visible para participantes invitados"

- **🏷️ Categoría**:
  - Dropdown: Viaje, Casa, Cena, Trabajo, Evento, Otro
  - Icono por categoría

**👥 Participantes Iniciales (Card 5):**
- **📝 Header**: "Participantes" + "Agregar" button
- **👤 Creador**: Tu usuario (no removible, marcado como Owner)
- **➕ Agregar Participantes**:
  - onPress: abrir AddParticipantModal
  - Lista de participantes agregados (removibles)

**🔘 Botones Footer (Sticky):**
1. **❌ Cancelar**:
   - Outline button, color: `#666`
   - onPress: Confirmation modal → navegar back

2. **✅ Crear Evento**:
   - Filled button, background: `#4B89DC`
   - Disabled si form inválido
   - onPress: crear evento → navegar a EventDetails

---

#### **💸 7. CREATE EXPENSE SCREEN**
```typescript
// Ubicación: src/screens/CreateExpense/index.tsx
// Recibe: eventId como parámetro
```

**📱 HeaderBar:**
- **⬅️ Back**: navegar a EventDetails
- **📝 Título**: "Agregar Gasto"
- **💾 Guardar**: habilitado si form válido

**📋 Form (ScrollView):**

**📝 Información del Gasto (Card 1):**
- **🏷️ Descripción**:
  - Label: "¿En qué se gastó? *"
  - Placeholder: "Ej: Cena en restaurante"
  - Icono: `receipt-outline` (left)

- **💰 Monto**:
  - Label: "Monto Total *"
  - Placeholder: "0.00"
  - Keyboard: numeric con decimales
  - Suffix: moneda del evento
  - Icono: `cash-outline` (left)

- **📅 Fecha**:
  - Label: "Fecha del Gasto *"
  - DatePicker: default hoy
  - Icono: `calendar-outline` (left)

**🏷️ Categorización (Card 2):**
- **📂 Categoría**:
  - Dropdown con iconos:
    - 🍽️ Comida
    - 🚗 Transporte  
    - 🏨 Alojamiento
    - 🎯 Entretenimiento
    - 🛒 Compras
    - 💊 Salud
    - 📚 Educación
    - 🔧 Otros

**👤 Pagador (Card 3):**
- **💳 ¿Quién pagó?**:
  - Lista de participantes del evento
  - Radio buttons con avatares
  - Default: usuario actual

**🧮 División del Gasto (Card 4):**
- **📊 Tipo de División**:
  - Tabs horizontales:
    - ⚖️ **Igual**: Dividir en partes iguales
    - 📊 **Porcentaje**: Por porcentajes personalizados  
    - 💰 **Fijo**: Montos fijos por persona
    - 🎯 **Personalizado**: Combinación

**División Igual Tab:**
- **👥 Participantes Incluidos**:
  - Lista con checkboxes
  - Todos seleccionados por default
  - Exclude button por participante
- **💰 Monto por Persona**: Auto calculado
  - Display: "c/u paga $XX.XX"

**División Porcentaje Tab:**
- **📊 Lista de Participantes**:
  - Slider por participante (0-100%)
  - Input numérico
  - Total debe sumar 100%
  - Warning si no suma 100%

**División Fijo Tab:**
- **💰 Input por Participante**:
  - Monto fijo por persona
  - Total debe igualar monto total
  - Auto-calculado para último participante

**División Personalizada Tab:**
- **🎛️ Mix de controles**:
  - Por participante: Radio (Igual, %, Fijo)
  - Input correspondiente
  - Validación total

**📸 Comprobante (Card 5):**
- **📷 Agregar Foto**:
  - onPress: Image picker (camera/gallery)
  - Preview de imagen seleccionada
  - Remove button si hay imagen

**📝 Notas Adicionales (Card 6):**
- **📄 Notas** (Opcional):
  - TextArea multiline
  - Placeholder: "Notas adicionales..."
  - MaxLength: 300 caracteres

**🔘 Botones Footer:**
1. **❌ Cancelar**: navegar back
2. **💾 Guardar Gasto**: crear expense → navegar back

---

#### **📊 8. SUMMARY SCREEN**
```typescript
// Ubicación: src/screens/Summary/index.tsx
// Recibe: eventId como parámetro
```

**📱 HeaderBar:**
- **⬅️ Back**: navegar to EventDetails
- **📝 Título**: "Resumen - [Nombre Evento]"
- **📤 Compartir**: Icono `share-outline`
  - onPress: compartir resumen como imagen/PDF

**📊 Resumen General (Card 1):**
- **💰 Métricas Row 1**:
  - Total Gastado: $XX,XXX (grande, bold)
  - Presupuesto: $XX,XXX (si existe)
  - Diferencia: +/- $XXX (color según signo)

- **📈 Métricas Row 2**:
  - Gasto Promedio: $XXX por persona
  - Total Participantes: XX personas
  - Total Gastos: XX gastos

**⚖️ Balances por Participante (Card 2):**
- **📋 Lista de Balances**:
  - ParticipantBalanceItem por persona:
    - Avatar + Nombre (left)
    - Balance amount (right, colored)
    - Status text: "Debe pagar"/"Le deben"/"Equilibrado"
  - onPress: modal con detalles del participante

**💳 Liquidaciones Recomendadas (Card 3):**
- **🔄 Algoritmo de Optimización**:
  - Lista de transferencias mínimas
  - SettlementItem:
    - "Juan → Ana: $500"
    - Icono: `arrow-forward-outline`
    - Status: Pendiente/Confirmado
    - Botón: "Marcar como Pagado"
      - onPress: confirm payment modal

**📊 Gastos por Categoría (Card 4):**
- **📈 Gráfico de Barras/Torta**:
  - Visual de distribución por categorías
  - Colores únicos por categoría
  - Tap en segmento: mostrar detalles

- **📋 Lista de Categorías**:
  - CategoryItem:
    - Icono categoría + Nombre
    - Monto total + Porcentaje
    - Barra de progreso visual

**📈 Estadísticas Adicionales (Card 5):**
- **🏆 Records**:
  - Gasto más alto: Descripción + Monto
  - Participante que más gastó: Nombre + Total
  - Día con más gastos: Fecha + Count

- **📅 Timeline** (Opcional):
  - Mini calendario con gastos por día
  - Dots coloreados por intensidad

**💾 Acciones de Exportación (Card 6):**
- **📤 Botones de Export**:
  - 📄 Exportar PDF: genera PDF completo
  - 📊 Exportar CSV: datos tabulares
  - 📱 Compartir Imagen: screenshot del resumen
  - 💾 Backup Evento: incluir en backup manual

---

#### **👤 9. PROFILE SCREEN**
```typescript
// Ubicación: src/screens/Profile/index.tsx
```

**📱 HeaderBar:**
- **⬅️ Back**: navegar a HomeScreen
- **📝 Título**: "Mi Perfil"
- **✏️ Editar**: navegar a EditProfileScreen

**👤 Perfil Header (Card 1):**
- **🖼️ Avatar**: 80x80px circle, centrado
  - onPress: cambiar avatar (image picker)
  - Default: iniciales en círculo coloreado
- **📝 Nombre**: fontSize: 24, fontWeight: 'bold', centrado
- **📧 Email**: fontSize: 16, color: `#666`, centrado
- **📅 Miembro desde**: "Miembro desde Enero 2024"

**📊 Estadísticas Personales (Card 2):**
- **🎯 Métricas Grid (2x2)**:
  - 🎉 Eventos Creados: número + "eventos"
  - 💰 Total Gastado: monto + moneda
  - 👥 Amigos: número + "amigos"
  - 📱 Tiempo Usando App: "X meses"

**👥 Amigos Recientes (Card 3):**
- **📝 Header**: "Amigos Recientes" + "Ver Todos"
  - onPress Ver Todos: navegar a ManageFriendsScreen
- **👤 Lista Horizontal**:
  - FriendAvatarItem (scrollable):
    - Avatar 50x50px
    - Nombre debajo (fontSize: 12)
    - onPress: ver perfil de amigo

**⚙️ Configuraciones Rápidas (Card 4):**
- **🌐 Idioma**:
  - Row: Icono bandera + "Idioma" + valor actual + chevron
  - onPress: selector de idioma
- **🌙 Tema**:
  - Row: Icono + "Tema" + toggle switch
  - onChange: cambiar tema inmediatamente
- **💱 Moneda Default**:
  - Row: Icono + "Moneda Predeterminada" + valor + chevron
  - onPress: selector de moneda

**🔐 Seguridad (Card 5):**
- **👆 Autenticación Biométrica**:
  - Row: Icono + "Huella Digital" + toggle switch
  - onChange: configurar biometría
- **⏱️ Timeout de Sesión**:
  - Row: Icono + "Timeout de Sesión" + valor + chevron
  - onPress: selector de tiempo (5, 15, 30, 60 min)
- **🔒 Cambiar Contraseña**:
  - Row: Icono + "Cambiar Contraseña" + chevron
  - onPress: modal de cambio de contraseña

**💾 Datos y Backup (Card 6):**
- **📤 Exportar Datos**:
  - Row: Icono + "Exportar Mis Datos" + chevron
  - onPress: navegar a ExportDataScreen
- **💾 Crear Backup**:
  - Row: Icono + "Crear Backup Manual" + chevron
  - onPress: modal de opciones de backup
- **📊 Uso de Almacenamiento**:
  - Row: Icono + "Almacenamiento" + "XX MB usados"
  - Progress bar del espacio usado

**🚪 Cerrar Sesión (Card 7):**
- **🔴 Botón Cerrar Sesión**:
  - Full width, color: `#E74C3C`
  - onPress: confirmation modal → logout → LoginScreen

---

#### **⚙️ 10. SETTINGS SCREEN**
```typescript
// Ubicación: src/screens/Settings/index.tsx
```

**📱 HeaderBar:**
- **⬅️ Back**: navegar back
- **📝 Título**: "Configuración"

**📱 Apariencia (Card 1):**
- **🌙 Tema de la Aplicación**:
  - Segmented Control: "Claro" | "Oscuro" | "Automático"
  - Preview inmediato al cambiar
- **🌐 Idioma**:
  - Dropdown con banderas: 🇦🇷 | 🇺🇸 | 🇧🇷
  - Cambio requiere reinicio (alert)
- **🎨 Color Principal** (Futuro):
  - Color picker para personalizar tema

**💰 Configuración Financiera (Card 2):**
- **💱 Moneda Predeterminada**:
  - Dropdown: ARS, USD, EUR, BRL, etc.
  - Afecta nuevos eventos
- **🔢 Precisión Decimal**:
  - Stepper: 0, 1, 2 decimales
  - Para cálculos y display
- **📊 Redondeo**:
  - Options: "Redondear hacia arriba", "Hacia abajo", "Al más cercano"

**🔐 Privacidad y Seguridad (Card 3):**
- **👆 Autenticación Biométrica**:
  - Toggle + configurar cuando activar
  - Modal con opciones: "Al abrir app", "Para acciones sensibles"
- **⏱️ Timeout de Sesión**:
  - Slider: 5min - 60min
  - Preview: "La sesión expirará en X minutos"
- **🔒 Requerir Autenticación Para**:
  - Checkboxes:
    - Eliminar eventos
    - Eliminar gastos
    - Ver información sensible
    - Exportar datos

**📊 Datos y Almacenamiento (Card 4):**
- **💾 Backup Automático**:
  - Toggle + frecuencia
  - Dropdown: Diario, Semanal, Mensual
- **📁 Ubicación de Backups**:
  - Display current path
  - Botón "Cambiar Ubicación"
- **🗑️ Limpiar Cache**:
  - Show tamaño actual
  - Botón "Limpiar" con confirmación
- **📊 Estadísticas de Uso**:
  - Datos: XX eventos, XX gastos, XX participantes
  - Espacio usado: XX MB

**📱 Notificaciones (Card 5):**
- **🔔 Notificaciones Push** (Futuro):
  - Toggle general
  - Configurar tipos: Nuevos gastos, Pagos pendientes, etc.
- **📧 Recordatorios**:
  - Toggle para recordatorios de backup
  - Frecuencia configurable

**🛠️ Avanzado (Card 6):**
- **🔄 Resetear Configuración**:
  - Botón con confirmación
  - Restaura valores por defecto
- **📊 Modo Desarrollador** (Hidden):
  - 7 taps en versión activa
  - Muestra logs, debug info, test data

**ℹ️ Información (Card 7):**
- **📱 Versión de la App**: "v1.0.0 (Build 1)"  
- **📄 Términos y Condiciones**: Link a modal
- **🔒 Política de Privacidad**: Link a modal
- **❓ Ayuda y Soporte**: navegar a HelpScreen
- **⭐ Calificar App**: Link a app store

---

## 🧭 **NAVEGACIÓN Y FLUJOS**

### **Estructura de Navegación**
```typescript
// Configuración React Navigation v7
const AuthStack = createStackNavigator();
const MainStack = createStackNavigator();
const EventStack = createStackNavigator();
const TabNavigator = createBottomTabNavigator();

// Flujo Principal:
// Splash → Auth (Login/SignUp) → MainTabs → EventStack → Details/Create/Edit
```

### **25+ Pantallas Principales**

**Authentication Flow:**
1. **SplashScreen** - Logo + tagline (2.5s)
2. **LoginScreen** - 4 métodos de login
3. **SignUpScreen** - Registro completo
4. **ForgotPasswordScreen** - Recuperación

**Main Application:**
5. **HomeScreen** - Lista de eventos con filtros
6. **EventDetailsScreen** - Pestañas: Gastos, Participantes, Resumen
7. **CreateEventScreen** - Formulario completo
8. **EditEventScreen** - Edición de eventos
9. **CreateExpenseScreen** - Crear gastos con división
10. **EditExpenseScreen** - Editar gastos existentes
11. **SummaryScreen** - Balances y liquidaciones
12. **ProfileScreen** - Perfil de usuario
13. **EditProfileScreen** - Editar perfil
14. **SettingsScreen** - Configuraciones
15. **ManageFriendsScreen** - Gestión de amigos
16. **RecurrentParticipantsScreen** - Participantes frecuentes
17. **ExportDataScreen** - Exportación de datos
18. **SystemStatusScreen** - Estado del sistema
19. **PrivacySecurityScreen** - Configuración de seguridad
20. **AboutHelpScreen** - Información y ayuda

**Utility Screens:**
21. **BackupManagementScreen** - Gestión de backups manuales
22. **ExportOptionsScreen** - Opciones de exportación
23. **ImportDataScreen** - Importar desde backup
24. **StorageManagementScreen** - Gestión de espacio local
25. **ParticipantRolesScreen** - Gestión de roles

### **Componentes de Pantalla Especializados**
- **EventCard** - Tarjeta de evento con swipe actions
- **ExpenseItem** - Item de gasto con detalles
- **ParticipantItem** - Item de participante con balance
- **MetricsCard** - Tarjeta de métricas
- **SkeletonLoading** - Loading states elegantes

---

## � **GESTIÓN DE DATOS OFFLINE**

### **SQLite Integrado - Base de Datos Local**
```typescript
// Esquema de base de datos local optimizada
class LocalDatabase {
  private db: SQLite.SQLiteDatabase;
  
  async initializeSchema(): Promise<void> {
    // Crear todas las tablas localmente
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        start_date TEXT NOT NULL,
        end_date TEXT,
        location TEXT,
        currency TEXT DEFAULT 'ARS',
        total_amount REAL DEFAULT 0,
        status TEXT DEFAULT 'active',
        type TEXT DEFAULT 'public',
        category TEXT,
        creator_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS participants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        alias_cbu TEXT,
        avatar TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // ... más tablas (expenses, payments, splits, etc.)
  }
  
  // Métodos CRUD completamente locales
  async insertEvent(event: Event): Promise<string>
  async updateEvent(id: string, updates: Partial<Event>): Promise<void>
  async deleteEvent(id: string): Promise<void>
  async getAllEvents(): Promise<Event[]>
}
```

### **Sistema de Backup Manual Completo**
```typescript
interface BackupOptions {
  includeImages: boolean;
  compressData: boolean;
  encryptBackup: boolean;
  selectedEvents?: string[];
}

class OfflineBackupService {
  
  // Crear backup completo manual
  async createFullBackup(options: BackupOptions): Promise<string> {
    const timestamp = new Date().toISOString().split('T')[0];
    const backupName = `SplitSmart_Backup_${timestamp}`;
    
    // Recopilar todos los datos
    const backupData = {
      metadata: {
        appVersion: '1.0.0',
        backupDate: new Date().toISOString(),
        deviceInfo: await this.getDeviceInfo(),
        totalEvents: 0,
        totalParticipants: 0,
        totalExpenses: 0
      },
      events: await this.getAllEventsForBackup(options.selectedEvents),
      participants: await this.getAllParticipants(),
      expenses: await this.getAllExpenses(),
      payments: await this.getAllPayments(),
      userSettings: await this.getUserSettings(),
      friendsList: await this.getFriendsList()
    };
    
    // Incluir imágenes si está habilitado
    if (options.includeImages) {
      backupData.images = await this.exportAllImages();
    }
    
    // Comprimir si está habilitado
    let finalData = JSON.stringify(backupData, null, 2);
    if (options.compressData) {
      finalData = await this.compressData(finalData);
    }
    
    // Encriptar si está habilitado
    if (options.encryptBackup) {
      finalData = await this.encryptData(finalData);
    }
    
    // Guardar en carpeta de documentos del dispositivo
    const filePath = await this.saveToDevice(backupName, finalData);
    
    return filePath;
  }
  
  // Restaurar desde backup
  async restoreFromBackup(filePath: string): Promise<RestoreResult> {
    try {
      let backupContent = await FileSystem.readAsStringAsync(filePath);
      
      // Desencriptar si es necesario
      if (this.isEncrypted(backupContent)) {
        backupContent = await this.decryptData(backupContent);
      }
      
      // Descomprimir si es necesario
      if (this.isCompressed(backupContent)) {
        backupContent = await this.decompressData(backupContent);
      }
      
      const backupData = JSON.parse(backupContent);
      
      // Validar estructura del backup
      await this.validateBackupStructure(backupData);
      
      // Restaurar datos en orden correcto
      await this.restoreParticipants(backupData.participants);
      await this.restoreEvents(backupData.events);
      await this.restoreExpenses(backupData.expenses);
      await this.restorePayments(backupData.payments);
      await this.restoreUserSettings(backupData.userSettings);
      
      return {
        success: true,
        eventsRestored: backupData.events.length,
        participantsRestored: backupData.participants.length,
        expensesRestored: backupData.expenses.length
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Exportar a diferentes formatos
  async exportToCSV(eventId?: string): Promise<string>
  async exportToPDF(eventId: string): Promise<string>
  async exportToExcel(eventId?: string): Promise<string>
}
```

### **Configuración de Almacenamiento Local**
```typescript
// Gestión de archivos y carpetas locales
class LocalStorageManager {
  private documentsPath: string;
  private backupsPath: string;
  private imagesPath: string;
  
  async initialize(): Promise<void> {
    this.documentsPath = FileSystem.documentDirectory;
    this.backupsPath = `${this.documentsPath}SplitSmart/Backups/`;
    this.imagesPath = `${this.documentsPath}SplitSmart/Images/`;
    
    // Crear carpetas necesarias
    await this.ensureDirectoryExists(this.backupsPath);
    await this.ensureDirectoryExists(this.imagesPath);
  }
  
  // Gestión de espacio de almacenamiento
  async getStorageInfo(): Promise<StorageInfo> {
    const totalSpace = await FileSystem.getTotalDiskCapacityAsync();
    const freeSpace = await FileSystem.getFreeDiskStorageAsync();
    const usedByApp = await this.calculateAppStorageUsage();
    
    return {
      totalSpace,
      freeSpace,
      usedByApp,
      backupsCount: await this.getBackupsCount(),
      oldestBackup: await this.getOldestBackupDate()
    };
  }
  
  // Limpieza automática de backups antiguos
  async cleanupOldBackups(keepLastN: number = 5): Promise<void>
}
```

---

## 🔄 **ARQUITECTURA SIN BACKEND**

### **Arquitectura 100% Local - Sin Backend**
```typescript
// Estructura principal offline
class SplitSmartOfflineApp {
  private localDb: LocalDatabase;
  private dataManager: OfflineDataManager;
  private backupService: OfflineBackupService;
  private calculationEngine: LocalCalculationEngine;
  
  async initialize(): Promise<void> {
    await this.localDb.initialize();
    await this.dataManager.loadPersistedState();
    await this.backupService.initialize();
    await this.calculationEngine.initialize();
  }
  
  async shutdown(): Promise<void> {
    await this.dataManager.persistCurrentState();
    await this.localDb.close();
  }
  
  async createManualBackup(): Promise<string> {
    return await this.backupService.createFullBackup();
  }
}
```

### **Base de Datos SQLite Embebida**
```typescript
// Entidades locales simplificadas
interface LocalEvent {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  location?: string;
  currency: string;
  totalAmount: number;
  status: 'active' | 'completed' | 'archived';
  type: 'public' | 'private';
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

interface LocalExpense {
  id: string;
  eventId: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  category: string;
  payerId: string;
  splits: LocalSplit[];
  createdAt: string;
  updatedAt: string;
}

// Motor de base de datos local
class LocalDatabase {
  async query(sql: string, params?: any[]): Promise<any[]>
  async insert(table: string, data: any): Promise<string>
  async update(table: string, id: string, data: any): Promise<void>
  async delete(table: string, id: string): Promise<void>
}
```

### **Operaciones CRUD Locales**
```typescript
// Todas las operaciones son locales
class LocalDataService {
  // Eventos
  async createEvent(event: LocalEvent): Promise<string>
  async getEvent(id: string): Promise<LocalEvent | null>
  async updateEvent(id: string, updates: Partial<LocalEvent>): Promise<void>
  async deleteEvent(id: string): Promise<void>
  async getAllEvents(): Promise<LocalEvent[]>
  
  // Gastos
  async createExpense(expense: LocalExpense): Promise<string>
  async getExpensesByEvent(eventId: string): Promise<LocalExpense[]>
  async updateExpense(id: string, updates: Partial<LocalExpense>): Promise<void>
  async deleteExpense(id: string): Promise<void>
  
  // Participantes
  async createParticipant(participant: LocalParticipant): Promise<string>
  async getParticipantsByEvent(eventId: string): Promise<LocalParticipant[]>
  async updateParticipant(id: string, updates: Partial<LocalParticipant>): Promise<void>
  
  // Pagos
  async createPayment(payment: LocalPayment): Promise<string>
  async getPaymentsByEvent(eventId: string): Promise<LocalPayment[]>
  async confirmPayment(id: string): Promise<void>
  
  // Todos los métodos trabajan únicamente con almacenamiento local
}
```

### **Motor de Cálculos Offline**
```typescript
class LocalCalculationEngine {
  // Todos los cálculos se realizan en el dispositivo
  calculateParticipantBalances(
    eventId: string,
    expenses: LocalExpense[],
    payments: LocalPayment[]
  ): Promise<ParticipantBalance[]>
  
  calculateOptimalSettlements(
    balances: ParticipantBalance[]
  ): Promise<Settlement[]>
  
  generateEventSummary(eventId: string): Promise<EventSummary>
  
  // Estadísticas calculadas localmente
  calculateCategoryStatistics(eventId: string): Promise<CategoryStats[]>
  calculateMonthlyTrends(): Promise<MonthlyTrends[]>
  calculateParticipantInsights(participantId: string): Promise<ParticipantInsights>
}
```

### **Estados de Datos Locales**
- `local_stored` - Guardado en base local
- `needs_backup` - Pendiente de backup manual
- `backed_up` - Incluido en último backup
- `export_ready` - Listo para exportar

---

## 🧪 **CONFIGURACIÓN DE TESTING**

### **Cobertura de Testing Completa**
```typescript
// Configuración Jest
module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.minimal.js'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### **Tipos de Tests**
1. **Unit Tests** - Componentes individuales
2. **Integration Tests** - Flujos completos
3. **Context Tests** - Estados globales
4. **Service Tests** - Lógica de negocio
5. **Navigation Tests** - Flujos de navegación

### **Ejemplos de Tests Críticos**
```typescript
// Test de cálculo de balances
describe('CalculationService', () => {
  it('should calculate optimal settlements correctly', () => {
    const balances = [
      { participantId: 'A', balance: 100 },
      { participantId: 'B', balance: -60 },
      { participantId: 'C', balance: -40 }
    ];
    
    const settlements = calculateOptimalSettlement(balances);
    
    expect(settlements).toHaveLength(2);
    expect(settlements[0].amount).toBe(60);
    expect(settlements[1].amount).toBe(40);
  });
});

// Test de autenticación biométrica
describe('BiometricAuthService', () => {
  it('should authenticate successfully with valid biometrics', async () => {
    const result = await BiometricAuthService.authenticate('Test prompt');
    expect(result.success).toBe(true);
  });
});
```

---

## 📊 **DATOS MOCK PARA DESARROLLO**

### **Estructura de Datos Mock Completa**
```typescript
// events.json - 15+ eventos de ejemplo
{
  "events": [
    {
      "id": "event-1",
      "name": "Viaje a Bariloche",
      "description": "Fin de semana en la montaña",
      "startDate": "2024-07-15T10:00:00.000Z",
      "location": "Bariloche, Argentina",
      "currency": "ARS",
      "totalAmount": 45000,
      "status": "active",
      "type": "public",
      "category": "travel",
      "creatorId": "user-1",
      "createdAt": "2024-07-01T10:00:00.000Z"
    }
    // ... más eventos
  ]
}

// participants.json - 20+ participantes
{
  "participants": [
    {
      "id": "participant-1",
      "name": "Ana García",
      "email": "ana.garcia@email.com",
      "phone": "+54 9 11 1234-5678",
      "alias_cbu": "ana.garcia.mp",
      "isActive": true
    }
    // ... más participantes
  ]
}

// expenses.json - 50+ gastos de ejemplo
{
  "expenses": [
    {
      "id": "expense-1",
      "eventId": "event-1",
      "description": "Hotel - 2 noches",
      "amount": 18000,
      "currency": "ARS",
      "date": "2024-07-15T14:00:00.000Z",
      "category": "accommodation",
      "payerId": "participant-1",
      "isActive": true
    }
    // ... más gastos
  ]
}
```

### **MockService - Simulación Backend**
```typescript
class MockService<T> {
  private data: T[] = [];
  
  getAll(): T[]
  getById(id: string): T | undefined
  create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): T
  update(id: string, updates: Partial<T>): T | null
  delete(id: string): boolean
  
  // Métodos de búsqueda y filtrado
  search(query: string): T[]
  filter(predicate: (item: T) => boolean): T[]
}
```

---

## ⚙️ **CONFIGURACIÓN Y VARIABLES**

### **Variables de Entorno**
```typescript
// .env.development
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_ENVIRONMENT=development
EXPO_PUBLIC_ENABLE_LOGGING=true
EXPO_PUBLIC_MOCK_DATA=true
EXPO_PUBLIC_AUTO_SYNC=false

// .env.production
EXPO_PUBLIC_API_URL=https://api.splitsmart.app/v1
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_ENABLE_LOGGING=false
EXPO_PUBLIC_MOCK_DATA=false
EXPO_PUBLIC_AUTO_SYNC=true
```

### **Configuración Expo (app.json)**
```json
{
  "expo": {
    "name": "SplitSmart",
    "slug": "SplitSmart",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.cbalucas.splitsmart"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.cbalucas.splitsmart"
    },
    "plugins": [
      "expo-secure-store",
      "expo-local-authentication"
    ]
  }
}
```

### **Dependencias Principales**
```json
{
  "dependencies": {
    "@react-native-async-storage/async-storage": "2.2.0",
    "@react-navigation/native": "^7.1.14",
    "@react-navigation/stack": "^7.4.2",
    "@react-navigation/bottom-tabs": "^7.4.2",
    "expo": "^54.0.19",
    "expo-local-authentication": "~17.0.7",
    "expo-secure-store": "~15.0.7",
    "i18next": "^25.2.1",
    "react": "19.1.0",
    "react-native": "0.81.4",
    "react-native-vector-icons": "^10.2.0",
    "react-i18next": "^15.5.3",
    "uuid": "^11.1.0"
  }
}
```

---

## 🎯 **CARACTERÍSTICAS ESPECÍFICAS A IMPLEMENTAR**

### **1. Sistema de Permisos por Rol**
```typescript
const PERMISSIONS = {
  owner: ['all'],
  admin: ['canEditEvent', 'canAddParticipant', 'canAddExpense', 'canDeleteExpense'],
  member: ['canAddExpense', 'canEditOwnExpense'],
  viewer: ['canView']
};
```

### **2. Filtros Avanzados**
- **Por Estado**: Activo, Completado, Archivado
- **Por Categoría**: Viaje, Casa, Cena, Trabajo, etc.
- **Por Fecha**: Rango de fechas personalizable
- **Por Monto**: Rango de montos
- **Por Participantes**: Eventos con participantes específicos
- **Búsqueda Textual**: En nombre y descripción

### **3. Animaciones y Transiciones**
```typescript
// Swipe animations para cards
const createSwipeAnimation = () => ({
  translateX: new Animated.Value(0),
  opacity: new Animated.Value(1),
  scale: new Animated.Value(1)
});

// Pull-to-refresh
const onRefresh = () => {
  setRefreshing(true);
  // Lógica de recarga
  setRefreshing(false);
};
```

### **4. Gestos Táctiles**
- **Swipe Right**: Editar
- **Swipe Left**: Eliminar/Archivar
- **Long Press**: Mostrar opciones
- **Pull Down**: Refresh
- **Tap**: Ver detalles

### **5. Estados de Carga Inteligentes**
```typescript
// Skeleton loading para mejor UX
const SkeletonLoading = () => (
  <View style={styles.skeleton}>
    <SkeletonPlaceholder>
      <SkeletonPlaceholder.Item flexDirection="row">
        <SkeletonPlaceholder.Item width={60} height={60} borderRadius={50} />
        <SkeletonPlaceholder.Item marginLeft={20} flex={1}>
          <SkeletonPlaceholder.Item width="60%" height={20} />
          <SkeletonPlaceholder.Item marginTop={6} width="80%" height={20} />
        </SkeletonPlaceholder.Item>
      </SkeletonPlaceholder.Item>
    </SkeletonPlaceholder>
  </View>
);
```

---

## 🚀 **INSTRUCCIONES DE IMPLEMENTACIÓN PASO A PASO**

### **🔧 ORDEN DE DESARROLLO RECOMENDADO:**

#### **📋 FASE 1: CONFIGURACIÓN BASE (Día 1-2)**
```bash
# 1. Crear proyecto
npx create-expo-app --template blank-typescript SplitSmart
cd SplitSmart

# 2. Instalar dependencias básicas
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install expo-secure-store expo-local-authentication expo-sqlite
npm install i18next react-i18next date-fns uuid
npm install react-native-vector-icons @types/uuid

# 3. Configurar estructura de carpetas según especificación
mkdir -p src/{components,screens,navigation,context,services,types,utils,assets}
```

**📝 Archivos a crear primero:**
1. `src/types/index.ts` - Todas las interfaces TypeScript
2. `app.json` - Configuración Expo con permisos Android
3. `eas.json` - Configuración de build para APK
4. `.env.development` y `.env.production`
5. `src/constants/demoUser.ts` - Configuración del usuario DEMO

**🎯 Configuración Usuario DEMO:**
```typescript
// src/constants/demoUser.ts
export const DEMO_USER_CONFIG = {
  credentials: {
    username: "Demo",
    email: "demo@splitsmart.com", 
    password: "demo123456",
    requiresPassword: true
  },
  autoLogin: false, // Cambiar a true solo para testing rápido
  loadSampleData: true, // Cargar eventos y gastos de ejemplo
  skipBiometricSetup: true // Saltar configuración biométrica inicial
};

// Usar en AuthenticationService para login rápido durante desarrollo
export const isDemoCredentials = (credential: string, password: string): boolean => {
  return (credential === "Demo" || credential === "demo@splitsmart.com") && 
         password === "demo123456";
};
```

#### **📋 FASE 2: MODELOS Y CONTEXTOS (Día 3-4)**
**Orden exacto de implementación:**
1. `src/types/index.ts` - Interfaces de entidades (User, Event, Expense, etc.)
2. `src/context/ThemeContext.tsx` - Sistema de temas dinámicos
3. `src/context/LanguageContext.tsx` - i18next setup offline
4. `src/context/AuthContext.tsx` - Estado de autenticación
5. `src/context/DataContext.tsx` - Gestión de datos SQLite

**✅ Punto de control:** Contextos funcionando, temas cambiando

#### **📋 FASE 3: SERVICIOS CORE (Día 5-7)**
**Implementar en este orden:**
1. `src/services/DatabaseService.ts` - SQLite setup y CRUD
2. `src/services/StorageService.ts` - AsyncStorage y SecureStore
3. `src/services/AuthenticationService.ts` - Login tradicional
4. `src/services/BiometricAuthService.ts` - Autenticación biométrica
5. `src/services/MockDataService.ts` - Datos de prueba

**✅ Punto de control:** SQLite funcionando, datos persistiendo

#### **📋 FASE 4: COMPONENTES BASE (Día 8-10)**
**Crear componentes en orden de dependencias:**
1. `src/components/HeaderBar/index.tsx` - Componente más usado
2. `src/components/Alert/index.tsx` - Sistema de alertas global
3. `src/components/Input/index.tsx` - Inputs con validación
4. `src/components/Button/index.tsx` - Botones estandarizados
5. `src/components/Card/index.tsx` - Contenedores básicos
6. `src/components/Avatar/index.tsx` - Avatares de usuarios
7. Resto de componentes (Chip, ListItem, ProgressBar, Badge)

**✅ Punto de control:** Storybook o preview de componentes funcionando

#### **📋 FASE 5: ALGORITMOS MATEMÁTICOS (Día 11-12)**
**Implementar cálculos ANTES de las pantallas:**
1. `src/services/CalculationService.ts` - Algoritmo de balances
2. `src/services/SplitService.ts` - División de gastos
3. `src/utils/optimizePayments.ts` - Liquidación óptima
4. Tests unitarios para todos los cálculos

**✅ Punto de control:** Tests de cálculos pasando al 100%

#### **📋 FASE 6: PANTALLAS DE AUTENTICACIÓN (Día 13-14)**
**Implementar flujo de auth completo:**
1. `src/screens/Splash/index.tsx` - Pantalla inicial
2. `src/screens/Auth/LoginScreen.tsx` - Login tradicional
3. `src/screens/Auth/SignUpScreen.tsx` - Registro
4. `src/screens/Auth/BiometricScreen.tsx` - Setup biométrico
5. `src/navigation/AuthStack.tsx` - Navegación de auth

**✅ Punto de control:** Flujo de autenticación completo

#### **📋 FASE 7: PANTALLAS PRINCIPALES (Día 15-18)**
**Implementar pantallas core:**
1. `src/screens/Home/index.tsx` - Lista de eventos
2. `src/screens/EventDetails/index.tsx` - Detalles con tabs
3. `src/screens/CreateEvent/index.tsx` - Crear eventos
4. `src/screens/CreateExpense/index.tsx` - Crear gastos
5. `src/navigation/MainTabs.tsx` - Navegación principal

**✅ Punto de control:** CRUD completo de eventos y gastos

#### **📋 FASE 8: PANTALLAS AVANZADAS (Día 19-21)**
**Funcionalidades secundarias:**
1. `src/screens/Summary/index.tsx` - Resumen y balances
2. `src/screens/Profile/index.tsx` - Perfil de usuario
3. `src/screens/Settings/index.tsx` - Configuraciones
4. `src/screens/Statistics/index.tsx` - Métricas y gráficos
5. Modales (AddParticipant, Filter, etc.)

#### **📋 FASE 9: SISTEMA DE BACKUP (Día 22-23)**
**Implementar backup manual:**
1. `src/services/BackupService.ts` - Exportación de datos
2. `src/screens/Settings/BackupSettings.tsx` - UI de backup
3. Formatos de exportación (JSON, CSV, ZIP)
4. Tests de backup/restore

#### **📋 FASE 10: TESTING Y OPTIMIZACIÓN (Día 24-25)**
**Testing completo:**
1. Tests unitarios para todos los servicios
2. Tests de integración para pantallas
3. Tests de navegación
4. Tests de cálculos matemáticos
5. Optimización de performance

#### **📋 FASE 11: BUILD Y APK (Día 26-27)**
**Preparación para distribución:**
1. Configurar EAS Build
2. Optimizar bundle size
3. Generar APK de prueba
4. Tests en dispositivos reales
5. Generar APK de producción

### **🎯 CRITERIOS DE ÉXITO POR FASE:**

**FASE 1-2:** ✅ Proyecto creado, dependencias instaladas, contextos funcionando
**FASE 3:** ✅ SQLite persistiendo datos, autenticación básica
**FASE 4:** ✅ Componentes reutilizables listos
**FASE 5:** ✅ Cálculos matemáticos correctos (tests al 100%)
**FASE 6:** ✅ Login/registro funcionando
**FASE 7:** ✅ CRUD completo de eventos/gastos
**FASE 8:** ✅ Todas las pantallas navegables
**FASE 9:** ✅ Backup manual funcionando
**FASE 10:** ✅ >90% cobertura de tests
**FASE 11:** ✅ APK generado y funcionando offline

### **⚡ TIPS DE IMPLEMENTACIÓN:**

1. **Seguir orden estricto:** No saltar fases
2. **Testing continuo:** Test cada servicio al implementarlo
3. **Commits frecuentes:** Un commit por funcionalidad
4. **Revisar especificaciones:** Releer secciones antes de implementar
5. **Probar en dispositivo:** Especialmente autenticación biométrica
2. Implementar tests para operaciones locales
3. Crear tests para backup/restore
4. Implementar tests de persistencia de datos

### **PASO 9: Internacionalización Offline**
1. Configurar i18next con archivos locales
2. Crear archivos de traducción embebidos
3. Implementar selector de idioma offline
4. Traducir toda la interfaz sin dependencias de red

### **PASO 10: Optimización para APK**
1. Configurar build de APK standalone
2. Optimizar bundle size para offline
3. Configurar permisos de Android
4. Preparar assets embebidos
5. Optimizar base de datos local
6. Configurar signing para Play Store

---

## 🎨 **ASSETS Y RECURSOS**

### **Iconos y Logos**
- **App Icon**: 1024x1024 con esquinas redondeadas
- **Splash Icon**: Logo centrado sobre fondo blanco
- **Adaptive Icon**: Versión Android con capas
- **Favicon**: 32x32 para web

### **Iconografía Vectorial**
Usar Ionicons con estos íconos específicos:
- `cash-outline` - Dinero/gastos
- `people-outline` - Participantes
- `calculator-outline` - Cálculos
- `calendar-outline` - Fechas
- `location-outline` - Ubicaciones
- `settings-outline` - Configuración
- `finger-print` - Biometría
- `shield-checkmark-outline` - Seguridad

### **Ilustraciones**
- Splash screen con tagline elegante
- Empty states informativos
- Onboarding illustrations (opcional)

---

# 📋 **FASE 8: OPTIMIZACIÓN Y CALIDAD**

## 📈 **MÉTRICAS Y PERFORMANCE**

### **Métricas de Usuario**
- Total de eventos creados
- Gastos promedio por evento
- Participantes promedio por evento
- Tiempo promedio de sesión
- Frecuencia de uso por semana

### **Métricas de Performance**
- Tiempo de carga de pantallas
- Tiempo de cálculo de balances
- Uso de memoria
- Tamaño de base de datos
- Tiempo de sincronización

### **Métricas de Calidad**
- Crash rate < 1%
- Performance score > 90
- Test coverage > 90%
- Bundle size optimizado
- Battery usage eficiente

---

## 🔮 **ROADMAP FUTURO**

### **Versión 1.1**
- Soporte para múltiples monedas
- Conversión automática de divisas
- Notificaciones push
- Modo offline mejorado

### **Versión 1.2**
- Integración con métodos de pago reales
- Transferencias automáticas
- Reportes avanzados con gráficos
- Export a Excel/PDF

### **Versión 2.0**
- Versión web responsive
- Sync en tiempo real con WebSockets
- Inteligencia artificial para categorización
- Sistema de recomendaciones

---

## ✅ **RESULTADO ESPERADO Y CONCLUSIÓN**

### **Funcionalidades Core** ✅
- [x] Sistema de autenticación completo (4 métodos)
- [x] **Usuario DEMO preconfigurado** (Demo / demo@splitsmart.com / demo123456)
- [x] **Datos de ejemplo cargados automáticamente** (3 eventos, 5 gastos, participantes)
- [x] Gestión completa de eventos
- [x] Gestión de participantes con roles
- [x] Creación y edición de gastos
- [x] Cálculo automático de balances
- [x] Liquidación óptima de pagos
- [x] Sistema de pagos entre participantes

### **UI/UX** ✅
- [x] Temas dinámicos (light/dark)
- [x] Navegación fluida entre pantallas
- [x] Componentes reutilizables
- [x] Animaciones y transiciones
- [x] Responsive design
- [x] Accesibilidad básica

### **Seguridad** ✅
- [x] Autenticación biométrica avanzada
- [x] Almacenamiento seguro de credenciales
- [x] Timeout de sesión configurable
- [x] Detección básica de amenazas
- [x] Encriptación de datos sensibles

### **Internacionalización** ✅
- [x] Soporte completo para 3 idiomas
- [x] Selector de idioma dinámico
- [x] Todas las strings traducidas
- [x] Formatos de fecha/moneda localizados

### **Backend** ✅
- [x] API REST completa
- [x] Base de datos con TypeORM
- [x] Servicios de sincronización
- [x] Google Drive backup
- [x] Sistema de conflictos

### **Testing** ✅
- [x] Configuración Jest completa
- [x] Tests unitarios >80% cobertura
- [x] Tests de integración
- [x] Tests de navegación
- [x] Tests de cálculos matemáticos

---

## 🎯 **RESULTADO ESPERADO**

Al seguir este prompt completo, obtendrás:

### **📱 Una aplicación móvil completamente offline** con:
- **25+ pantallas** funcionales sin conexión a internet
- **Cálculos matemáticos precisos** ejecutados localmente
- **Autenticación biométrica** de nivel empresarial offline
- **Base de datos SQLite embebida** con persistencia total
- **Sistema de backup manual** por el usuario
- **UI/UX superior** con temas dinámicos
- **Internacionalización completa** en 3 idiomas offline
- **Testing robusto** con >90% cobertura
- **APK standalone** listo para distribución

### **💾 Un sistema de almacenamiento local completo** con:
- **SQLite integrado** con todas las tablas necesarias
- **Backup manual** a archivos del dispositivo
- **Exportación múltiple** (JSON, CSV, PDF, ZIP)
- **Restauración completa** desde backups
- **Gestión de espacio** de almacenamiento local
### **🔧 Código de producción offline-first** con:
- **TypeScript estricto** en toda la aplicación
- **Patrones de diseño** consistentes para apps offline
- **Documentación completa** inline
- **Configuración optimizada** para APK standalone
- **Scripts de build** específicos para Android

### **📊 Performance offline optimizado** con:
- **Bundle size** minimizado para APK
- **Base de datos local** optimizada para dispositivos móviles
- **Cálculos optimizados** O(n log n) ejecutados localmente
- **Manejo de memoria** eficiente sin conexiones de red
- **Tiempo de respuesta** < 50ms (sin latencia de red)
- **Consumo de batería** optimizado sin comunicaciones externas
- **Tiempo de respuesta** < 100ms

---

## 🏁 **CONCLUSIÓN**

Este prompt contiene **TODA la información necesaria** para regenerar completamente SplitSmart:

✅ **Arquitectura técnica detallada**  
✅ **Modelos de datos exactos**  
✅ **Algoritmos matemáticos precisos**  
✅ **Configuraciones específicas**  
✅ **Funcionalidades completas**  
✅ **UI/UX especificado**  
✅ **Seguridad implementada**  
✅ **Testing configurado**  
✅ **Backend integrado**  
✅ **Internacionalización completa**  

**Resultado**: Una aplicación de **calidad empresarial** lista para publicar en app stores con todas las funcionalidades de gestión de gastos compartidos, cálculos precisos, seguridad avanzada y experiencia de usuario superior.

---

# 📋 **FASE 7: BUILD Y DISTRIBUCIÓN**

## 📦 **COMANDOS PARA GENERAR APK**

### **Configuración Inicial para APK**
```bash
# 1. Instalar EAS CLI globalmente
npm install -g @expo/eas-cli

# 2. Login en Expo (crear cuenta si no tienes)
eas login

# 3. Configurar el proyecto para builds
eas build:configure

# 4. Generar APK de desarrollo/testing
eas build --platform android --profile preview

# 5. Generar APK de producción
eas build --platform android --profile production_apk

# 6. Generar AAB para Google Play Store
eas build --platform android --profile production_aab
```

### **Comandos de Build Local (Alternativo)**
```bash
# 1. Generar código nativo
expo prebuild --clean

# 2. Navegar a carpeta android
cd android

# 3. Generar APK debug
./gradlew assembleDebug

# 4. Generar APK release (firmado)
./gradlew assembleRelease

# 5. Generar AAB para Play Store
./gradlew bundleRelease
```

### **Scripts NPM Configurados**
Agregar estos scripts al `package.json`:
```json
{
  "scripts": {
    "build:apk:dev": "eas build --platform android --profile preview",
    "build:apk:prod": "eas build --platform android --profile production_apk",
    "build:aab": "eas build --platform android --profile production_aab",
    "prebuild": "expo prebuild --clean",
    "android:debug": "cd android && ./gradlew assembleDebug",
    "android:release": "cd android && ./gradlew assembleRelease"
  }
}
```

### **Ubicación de APK Generados**
- **EAS Build**: Descarga desde dashboard de Expo
- **Build Local**: `android/app/build/outputs/apk/release/app-release.apk`
- **AAB Local**: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 🎯 **ACCESO RÁPIDO - USUARIO DEMO**

### **Credenciales de Testing:**
```
👤 Usuario: Demo
📧 Email: demo@splitsmart.com  
🔑 Password: demo123456
🔒 Requiere Password: Sí (biométrico deshabilitado por defecto)
```

### **Datos Precargados:**
- **✅ 3 Eventos de ejemplo**: Cena de Amigos, Viaje a Bariloche, Gastos de Casa
- **✅ 5 Gastos**: Con diferentes categorías y montos realistas
- **✅ 4 Participantes**: Amigos ficticios con emails válidos
- **✅ Balances calculados**: Para probar algoritmos de liquidación
- **✅ Configuración inicial**: Tema light, idioma español, moneda ARS

### **Para Testing Rápido:**
1. **Login inicial**: Username "Demo" + Password "demo123456"
2. **Datos automáticos**: Se cargan al hacer login por primera vez
3. **Funcionalidades**: Todas habilitadas para testing completo
4. **Reset datos**: Disponible en Settings > Datos > Reset Demo Data

---

*🎉 **¡Prompt completado! Con esta información puedes regenerar SplitSmart al 100% como app offline con APK** 🎉*