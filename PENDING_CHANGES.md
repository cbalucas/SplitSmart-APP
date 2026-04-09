# Cambios Pendientes de Registrar — SplitSmart

> **Propósito:** Bitácora de trabajo en curso entre sesiones de chat.
> Registrar aquí TODOS los cambios realizados antes de generar un nuevo APK/AAB.
> Una vez generado el build, mover el contenido a `CHANGELOG.md` y vaciar este archivo.

---

## 🗂️ Versión en desarrollo: v1.5.1

> Cambios realizados después del build de v1.5.0

### 🚀 Nuevas Funcionalidades

- **CreateExpense — Calculadora integrada**: nuevo botón 🧮 al lado del campo Monto que abre un modal de calculadora con operaciones `+`, `-`, `×`, `÷`. Display estilo calculadora tradicional: número en edición abajo (grande) y expresión acumulada arriba (pequeño). Botones "Volver" (1/3) y "Usar (resultado)" (2/3) en el footer
- **CreateExpense — Calculadora: comportamiento post-`=`**: al presionar un operador después de `=`, el resultado se convierte en el primer operando de la nueva expresión
- **CreateExpense — Calculadora: confirmación sin `=`**: si el usuario presiona "Usar" con una expresión pendiente (sin haber presionado `=`), se muestra un popup de confirmación que evalúa y muestra el resultado antes de aplicarlo al monto

### 🔧 Correcciones de Bugs

- **ProfileScreen — historial de versiones corrompido**: restaurados todos los emojis e íconos del historial v1.0.0–v1.5.0 que aparecían como `?` y `??` tras ejecutar `versiones.ps1`
- **ProfileScreen — caracteres acentuados**: corregidos todos los `\uFFFD` en comentarios JSX, sección "Seguridad y Privacidad", modal de estadísticas e información técnica
- **ProfileScreen — contaminación `${f.name}`**: eliminados prefijos espurios `${f.name}` en bullet points de la sección de privacidad, detalles de error de importación y sección de info técnica de BD que causaban `ReferenceError: Property 'f' doesn't exist` al abrir el perfil
- **ProfileScreen — sintaxis JSX**: corregido cierre `>` faltante en `<ScrollView>` del modal de historial que generaba `SyntaxError: Unexpected token, expected "..."` (línea 1661)
- **versiones.ps1 — corrupción UTF-8**: agregado `-Encoding UTF8` en `Get-Content` y `Set-Content` del archivo `ProfileScreen/index.tsx` para evitar que futuros incrementos de versión corrompan emojis y caracteres acentuados
- **CreateExpense — Calculadora: decimales perdidos**: corregido bug donde valores decimales (ej: `15.75`) llegaban al campo Monto sin la parte decimal debido a un `replace('.', ',')` incorrecto previo al formateo

### ✨ Mejoras

- **versiones.ps1**: lectura y escritura de `ProfileScreen/index.tsx` ahora siempre en UTF-8, previene regresión permanente del problema de encoding

### 📁 Archivos Modificados

- `src/screens/ProfileScreen/index.tsx` — restauración completa de contenido UTF-8
- `versiones.ps1` — fix de encoding (líneas 278 y 368)
- `src/screens/CreateExpense/index.tsx` — calculadora integrada (estados, lógica, modal JSX)
- `src/screens/CreateExpense/styles.ts` — estilos del modal calculadora

---

## 📋 Instrucciones de uso

1. **Al inicio de cada sesión**: leer este archivo para retomar el contexto
2. **Durante la sesión**: agregar cada cambio realizado en la sección correspondiente
3. **Al generar el build**: copiar el contenido a `CHANGELOG.md` y limpiar este archivo
4. **Incrementar versión**: ejecutar `.\versiones.ps1`
