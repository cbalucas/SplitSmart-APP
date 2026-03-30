# Cambios Pendientes de Registrar — SplitSmart

> **Propósito:** Bitácora de trabajo en curso entre sesiones de chat.
> Registrar aquí TODOS los cambios realizados antes de generar un nuevo APK/AAB.
> Una vez generado el build, mover el contenido a `CHANGELOG.md` y vaciar este archivo.

---

## 🗂️ Versión en desarrollo: v1.4.6

> Cambios realizados después del build de v1.4.5 (versionCode 11)

### 🚀 Nuevas Funcionalidades

- **Icono SplitSmart en HeaderBar**: Se agregó el logo de la app (`assets/splitsmart/icon.png`) a la izquierda del título en todas las pantallas, excepto en la pantalla de Login.
- **Prop `isModal` en HeaderBar**: Nuevo prop opcional que elimina el `paddingTop: 30` cuando se usa dentro de modales `pageSheet`, evitando espacio muerto en el top.

### 🔧 Correcciones de Bugs

- **Traducción `consolidationModal.applyButton`**: La key no existía en el diccionario inline de `LanguageContext.tsx`, por lo que se mostraba el nombre de la variable. Agregada en ES (`"Aplicar"`) y EN (`"Apply"`).
- **Safe Area top en modales**: Los 3 modales principales tenían `edges={['top','bottom','left','right']}` en `SafeAreaView`, generando espacio extra en el top (el HeaderBar ya maneja el top con `paddingTop`). Corregido a `edges={['bottom','left','right']}` en todos.
- **Botón "Aplicar" en ConsolidationModal**: El botón estaba dentro del `ScrollView`, lo que hacía que quedara oculto cuando había muchos ítems. Movido fuera del `ScrollView` para que siempre sea visible.
- **Overflow menu desalineado**: Ajustado `top: 88` (era `110`) para coincidir con la altura real del HeaderBar.

### ✨ Mejoras

- **Unificación estética de los 3 modales principales**: `ConsolidationModal`, `ExpenseDetailModal` y `ParticipantInfoModal` ahora comparten la misma estructura: `Modal animationType="slide" presentationStyle="pageSheet"` + `SafeAreaView edges={['bottom','left','right']}` + `HeaderBar` con `showLogo={true}`, `showBackButton={false}`, `isModal={true}`, `useDynamicColors={true}`.
- **ConsolidationModal — HeaderBar unificado**: Reemplazado el header custom por el componente `HeaderBar` estándar.
- **ParticipantInfoModal — migrado a `pageSheet`**: Era `transparent={false} statusBarTranslucent={true}`. Migrado a `presentationStyle="pageSheet"` + `SafeAreaView`.
- **HeaderBar — eliminado placeholder invisible**: Cuando `showLogo=true` y no hay elemento izquierdo, ya no se renderiza un `<View width=40>` vacío, reduciendo el padding muerto del lado izquierdo.
- **Botón "Aplicar" en body**: Movido al pie del modal (fuera del scroll) con `marginHorizontal: 16`, `paddingVertical: 14`, `borderRadius: 12`.

### 📁 Archivos Modificados

- `src/components/HeaderBar.tsx` — Prop `showLogo`, prop `isModal`, eliminación de placeholder, `paddingLeft: 8`, overflow `top: 88`
- `src/components/ConsolidationModal/index.tsx` — SafeAreaView, HeaderBar, botón Aplicar fijo al pie
- `src/screens/Auth/LoginScreen.tsx` — `showLogo={false}`
- `src/screens/EventDetail/index.tsx` — `isModal={true}` y `showLogo={true}` en ExpenseDetail y ParticipantInfo; SafeAreaView `edges` corregidos
- `src/context/LanguageContext.tsx` — Agregadas keys `consolidationModal.applyButton` en ES y EN
- `src/localization/es.json` — Agregada key `applyButton` en sección `consolidationModal`
- `src/localization/en.json` — Agregada key `applyButton` en sección `consolidationModal`

---

## 📋 Instrucciones de uso

1. **Al inicio de cada sesión**: leer este archivo para retomar el contexto
2. **Durante la sesión**: agregar cada cambio realizado en la sección correspondiente
3. **Al generar el build**: copiar el contenido a `CHANGELOG.md` y limpiar este archivo
4. **Incrementar versión**: seguir el proceso del documento `Prompt/Incrementar Version APP`
