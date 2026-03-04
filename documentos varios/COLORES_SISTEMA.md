# Sistema de Colores Centralizado - SplitSmart App

## 📋 Descripción

Este sistema de colores centralizado permite mantener consistencia visual en toda la aplicación y facilita el mantenimiento de los temas claro y oscuro.

## 🎨 Archivos Principales

### `/src/constants/colors.ts`
- **Propósito**: Define todas las paletas de colores de la aplicación
- **Contenido**: Colores organizados por categorías (primary, surface, text, border, status, interactive, special)
- **Función helper**: `getAppColors(isDark: boolean)` que retorna los colores apropiados según el tema

### `/src/constants/theme.ts`
- **Propósito**: Configuración de temas que usa los colores centralizados
- **Integración**: Importa y utiliza `AppColors` para mantener consistencia

### `/src/hooks/useAppColors.ts`
- **Propósito**: Hook personalizado para acceder fácilmente a los colores en componentes
- **Funciones**: `useAppColors()` y `useColorMode()`

## 🚀 Cómo Usar

### 1. En Componentes (Recomendado)
```typescript
import { useAppColors } from '../hooks/useAppColors';

const MyComponent = () => {
  const colors = useAppColors();
  
  return (
    <View style={{ backgroundColor: colors.surface }}>
      <Text style={{ color: colors.textPrimary }}>Hola Mundo</Text>
    </View>
  );
};
```

### 2. En Archivos de Estilos
```typescript
import { getAppColors } from '../../constants/colors';
import { Theme } from '../../constants/theme';

export const createStyles = (theme: Theme) => {
  const isDarkMode = theme.colors.surface !== '#FFFFFF';
  const appColors = getAppColors(isDarkMode);

  return StyleSheet.create({
    container: {
      backgroundColor: appColors.surface,
      borderColor: appColors.borderPrimary,
    },
    text: {
      color: appColors.textPrimary,
    }
  });
};
```

### 3. Acceso Directo a Colores
```typescript
import { AppColors } from '../constants/colors';

// Para modo claro
const lightColor = AppColors.primary.light;

// Para modo oscuro  
const darkColor = AppColors.primary.dark;
```

## 🎯 Colores Disponibles

### Colores Primarios
- `primary` - Color principal de la app (azul claro / verde oscuro)
- `primaryContainer` - Contenedores con color primario (más opaco)

### Colores de Superficie
- `surface` - Superficie principal
- `surfaceSecondary` - Superficie secundaria (cards)
- `surfaceVariant` - Variante de superficie

### Colores de Texto
- `textPrimary` - Texto principal
- `textSecondary` - Texto secundario
- `textOnPrimary` - Texto sobre color primario

### Colores de Borde
- `borderPrimary` - Bordes principales
- `borderFocus` - Bordes en foco/selección

### Colores de Estado
- `success` - Verde para éxito
- `error` - Rojo para errores
- `warning` - Naranja para advertencias
- `info` - Azul para información

### Colores Interactivos
- `interactive.active` - Estado activo
- `interactive.inactive` - Estado inactivo
- `interactive.hover` - Estado hover
- `interactive.pressed` - Estado presionado

## 🔄 Migración de Pantallas Existentes

Para migrar una pantalla existente:

1. **Importar el sistema de colores**:
```typescript
import { getAppColors } from '../../constants/colors';
```

2. **Actualizar la función de estilos**:
```typescript
export const createStyles = (theme: Theme) => {
  const isDarkMode = theme.colors.surface !== '#FFFFFF';
  const appColors = getAppColors(isDarkMode);
  
  return StyleSheet.create({
    // Usar appColors en lugar de theme.colors
  });
};
```

3. **Reemplazar colores hardcodeados**:
- `'#FFFFFF'` → `appColors.surface`
- `'#000000'` → `appColors.textPrimary`
- `'#007AFF'` → `appColors.primary`
- etc.

## ✅ Beneficios

- **Consistencia**: Todos los colores están centralizados
- **Mantenibilidad**: Cambios globales desde un solo archivo
- **Escalabilidad**: Fácil agregar nuevos colores o temas
- **Flexibilidad**: Sistema que se adapta automáticamente al tema

## 📝 Ejemplo Completo

Ver `/src/screens/CreateExpense/styles.ts` como ejemplo de implementación.

## 🎨 Personalización de Colores

Para cambiar los colores de la app, edita `/src/constants/colors.ts`:

```typescript
export const AppColors = {
  primary: {
    light: '#TU_COLOR_CLARO',
    dark: '#TU_COLOR_OSCURO',
    // ...
  }
  // ...
};
```

Los cambios se reflejarán automáticamente en toda la aplicación.