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

## 🗂️ Validación de campos obligatorios (patrón `submittedOnce`)

> Trabajo realizado en sesión 31/03/2026

### ✨ Mejoras

- **Patrón de validación visual unificado**: Se implementó en todas las pantallas/modales con campos obligatorios el patrón `submittedOnce` + label rojo + asterisco rojo al intentar guardar con campo vacío. El `*` rojo lo muestra el componente `<Input>` via `required={true}` o el JSX con `<Text style={requiredStar}> *</Text>`. El label cambia a rojo `#FF5252` cuando `submittedOnce && !campo.trim()`.
- **Fix bug duplicación de texto**: En `SignUpScreen`, el campo username duplicaba caracteres por tener `.toLowerCase()` en `onChangeText`. Corregido: la transformación se aplica solo al momento de validar/enviar.
- **Botón fijo al pie en SignUpScreen**: El botón "Crear cuenta" se movió fuera del `ScrollView` a un `fixedFooter` para que siempre sea visible.
- **Doble asterisco eliminado**: Se removió el `*` hardcodeado de los textos de traducción en todos los idiomas (ES/EN/PT) donde el JSX ya añadía el `*` visual.

### 🔧 Archivos modificados — Validación

- `src/screens/Auth/SignUpScreen.tsx` — Patrón completo: `submittedOnce`, `hasFieldError()`, `*` en labels requeridos, botón fijo al pie, fix duplicación texto
- `src/screens/Auth/LoginScreen.tsx` — `submittedOnce`, función `hasFieldError('credential')`, label rojo en credencial
- `src/screens/Auth/ForgotPasswordScreen.tsx` — `submittedOnce`, label rojo en credencial
- `src/screens/Auth/styles.ts` — Estilos `labelError`, `requiredStar`, `fixedFooter`
- `src/screens/CreateEvent/index.tsx` — `submittedOnce`, `required={true}` en nombre, label rojo en fecha inicio
- `src/screens/CreateEvent/styles.ts` — Estilos `inputLabelError`, `requiredStar`
- `src/screens/CreateEvent/language.ts` — Eliminado ` *` hardcodeado de `eventName` y `startDate` (ES/EN/PT)
- `src/screens/CreateExpense/index.tsx` — `submittedOnce`, `required={true}` en descripción y monto, `*` JSX en fecha
- `src/screens/CreateExpense/language.ts` — Eliminado ` *` hardcodeado de `descriptionLabel`, `amountLabel` y `dateLabel` (ES/EN/PT)
- `src/screens/ManageFriends/index.tsx` — `submittedOnce`, label rojo en nombre, reset en cancelar
- `src/screens/ManageFriends/styles.ts` — Estilos `inputLabelError`, `requiredStar`
- `src/screens/ProfileScreen/index.tsx` — `submittedOnce`, `required={true}` y `error` en nombre/username/email, reset en cancelar
- `src/screens/EventDetail/index.tsx` — `submittedOnce` en `EditParticipantModalContent`, label nombre con `*` y color rojo, botón guardar sin `disabled` estático
- `src/components/AddParticipantModal/index.tsx` — `submittedOnce` (tab Nuevo) y `bulkSubmittedOnce` (tab Masivo custom), labels con `*` y color rojo, botones sin `disabled` estático, reset en `handleClose`; estilos `inputLabelError`, `requiredStar`
- `src/context/LanguageContext.tsx` — Eliminado ` *` hardcodeado de `eventDetail.labelName` y `addParticipant.fullNameLabel` (ES/EN/PT)
- `build-apk.ps1` — Directorio de copia backup cambiado a `C:\Users\cbalu\Dropbox\VsCode\SplitSmart APK`

---

## 📋 Instrucciones de uso

1. **Al inicio de cada sesión**: leer este archivo para retomar el contexto
2. **Durante la sesión**: agregar cada cambio realizado en la sección correspondiente
3. **Al generar el build**: copiar el contenido a `CHANGELOG.md` y limpiar este archivo
4. **Incrementar versión**: seguir el proceso del documento `Prompt/Incrementar Version APP`
