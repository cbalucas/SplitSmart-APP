# Cambios Pendientes de Registrar — SplitSmart

> **Propósito:** Bitácora de trabajo en curso entre sesiones de chat.
> Registrar aquí TODOS los cambios realizados antes de generar un nuevo APK/AAB.
> Una vez generado el build, mover el contenido a `CHANGELOG.md` y vaciar este archivo.

---

## 🗂️ Versión en desarrollo: v1.6.1

> Cambios realizados después del build de v1.6.0

### 🚀 Nuevas Funcionalidades

- **EventDetail — Tab Gastos: lista expandible de pagadores múltiples**: en la card de cada gasto, cuando hay más de un pagador, la segunda fila muestra `"Pagado por: X Personas"` con un chevron ▼/▲ tocable. Al expandir, se listan todos los pagadores con su nombre y monto individual en filas separadas. Gastos de pagador único mantienen el comportamiento anterior.

### 🔧 Correcciones de Bugs

_(ninguna aún)_

### ✨ Mejoras

- **EventDetail — Mensajes de compartir (WhatsApp y portapapeles)**: acortadas las líneas divisoras `━━━━━━━━━━━━━━━━━━` → `━━━━━━━` en todos los templates. El alias CBU ahora muestra `💳Alias => *alias*` en lugar de `💳 *alias*`. Añadido espacio en blanco extra entre grupos de gastos en el template de texto plano. Corregida posición del separador en el bloque de advertencia del evento activo.
- **NotificationService — Notificación de pago recibido vía WhatsApp**: reorganizado el orden de los campos (Evento primero, luego Monto y De). Insertadas líneas divisoras `━━━━━━━` entre el encabezado y los datos, y entre los datos y el pie de mensaje.
- **LanguageContext — Nuevas claves i18n** `expenses.paidByPersons` / `expenses.paidByPerson` en ES, EN y PT para el contador de pagadores en la card de gastos.

### 📁 Archivos Modificados

- `src/screens/EventDetail/index.tsx`
- `src/context/LanguageContext.tsx`
- `src/services/NotificationService.ts`

---

## 📋 Instrucciones de uso

1. **Al inicio de cada sesión**: leer este archivo para retomar el contexto
2. **Durante la sesión**: agregar cada cambio realizado en la sección correspondiente
3. **Al generar el build**: copiar el contenido a `CHANGELOG.md` y limpiar este archivo
4. **Incrementar versión**: ejecutar `.\versiones.ps1`
