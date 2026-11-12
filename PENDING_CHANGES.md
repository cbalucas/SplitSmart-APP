# Cambios Pendientes de Registrar — SplitSmart

> **Propósito:** Bitácora de trabajo en curso entre sesiones de chat.
> Registrar aquí TODOS los cambios realizados antes de generar un nuevo APK/AAB.
> Una vez generado el build, mover el contenido a `CHANGELOG.md` y vaciar este archivo.

---

## 🗂️ Versión en desarrollo: v1.10.7

> Cambios realizados después del build de v1.10.6

### 🚀 Nuevas Funcionalidades

- Pantalla de recuperación ante errores (ErrorBoundary): un fallo de render ya no cierra la app sin aviso.
- El changelog de Perfil se genera desde CHANGELOG.md (`node scripts/build-changelog.js`) en lugar de estar escrito en el código.

### 🔧 Correcciones de Bugs

- La nube ahora se usa SOLO con inicio de sesión con Google; cuentas locales y Demo quedan 100% en el dispositivo (se quita el alta/vinculación con email+contraseña en Supabase).
- El usuario Demo nunca sincroniza ni se sube: bloqueado en AuthContext y en SupabaseSyncService; la sync web ya no adopta sus datos al entrar con Google.
- Centavos: dividir en partes iguales ya no pierde ni crea dinero (100/3 suma 100).
- calculateOptimalSettlements ya no modifica los balances recibidos.
- Versión mostrada en "Acerca de" tomada de app.json.

### ✨ Mejoras

- Permisos bloqueados en app.json: RECORD_AUDIO, SYSTEM_ALERT_WINDOW, READ/WRITE_EXTERNAL_STORAGE.
- Producción: se eliminan console.log/info/debug en el build (babel.config.js).
- Política de privacidad y ficha de Play reescritas (offline sin Google / nube con Google) + tabla de Data Safety.
- Jest configurado con tests de cálculo de balances y liquidaciones (`npm test`).
- Eliminados: i18next, react-i18next, expo-auth-session, eas-cli (dependencias sin uso), src/localization, Button/ y Card/ duplicados, CalculationService.ts duplicado y test/ (scripts sueltos). Agregado expo-linking explícito.

### 📁 Archivos Modificados

- App.tsx, src/components/ErrorBoundary.tsx, src/context/AuthContext.tsx, src/screens/Auth/SignUpScreen.tsx, src/screens/ProfileScreen/index.tsx, src/services/SupabaseSyncService.ts, src/services/calculations.ts, app.json, babel.config.js, jest.config.js, tsconfig.json, docs/privacy-policy.html, datos_google_play.md

---

## 📋 Instrucciones de uso

1. **Al inicio de cada sesión**: leer este archivo para retomar el contexto
2. **Durante la sesión**: agregar cada cambio realizado en la sección correspondiente
3. **Al generar el build**: copiar el contenido a `CHANGELOG.md` y limpiar este archivo
4. **Incrementar versión**: ejecutar `.\versiones.ps1`
