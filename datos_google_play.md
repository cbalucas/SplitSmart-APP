# Datos para publicación en Google Play Store — SplitSmart

---

## 1. Crear la aplicación en la consola

| Campo | Valor |
|---|---|
| **Nombre de la app** | SplitSmart |
| **Idioma predeterminado** | Español (es-419) |
| **Idiomas adicionales** | Inglés (en-US), Portugués (pt-BR) |
| **Tipo** | Aplicación |
| **Precio** | Gratis |
| **Package ID** | com.cbalucas.splitsmart |

---

## 2. Ficha de Play Store (Marketing)

### Nombre de la app *(máx. 50 caracteres)*
```
SplitSmart – Divide gastos fácil
```

### Descripción breve *(máx. 80 caracteres)*
```
Divide gastos con amigos y grupos. Funciona sin internet; respaldo opcional con Google.
```

### Descripción larga *(máx. 4000 caracteres)*

**Español:**
```
SplitSmart es la forma más inteligente y segura de gestionar gastos compartidos con amigos, familia o compañeros de trabajo.

¿Fuiste de viaje? ¿Compartiste una cena? ¿Vivís con compañeros de piso? SplitSmart te permite registrar cada gasto, ver quién debe a quién y liquidar cuentas de forma transparente y sencilla, todo desde tu teléfono. Funciona sin internet y, si lo deseas, puedes iniciar sesión con Google para respaldar y sincronizar tus datos.

✨ FUNCIONALIDADES PRINCIPALES

💰 División de gastos
• Registrá gastos y dividilos automáticamente entre los participantes
• Excluí a personas puntuales de un gasto específico
• Visualizá quién debe qué en tiempo real

👥 Gestión de participantes
• Amigos permanentes y participantes temporales por evento
• Balances individuales claros y detallados

📋 Eventos y grupos
• Organizá los gastos por eventos: viajes, cenas, convivencias
• Estados: activo, completado y archivado
• Adjuntá fotos de comprobantes a cada gasto

💱 Multi-moneda
• Soporte para ARS, USD, EUR, BRL y más

🔒 Tú decides dónde viven tus datos
• Sin iniciar sesión: tus datos quedan solo en tu dispositivo (base local, funciona sin internet)
• Con Google: tus datos se respaldan en la nube y se sincronizan entre tus dispositivos
• Autenticación biométrica (huella digital / Face ID)
• Sin publicidad ni rastreadores

☁️ Sincronización y eventos compartidos (con Google)
• Usa tus eventos en otro teléfono o en la web
• Comparte un evento con un código QR (solo lectura o edición)

🎨 Experiencia de usuario
• Modo claro y oscuro automático
• Disponible en Español, Inglés y Portugués
• Interfaz limpia y optimizada para móvil

📤 Exportación
• Exportá tus datos cuando los necesites

SplitSmart es ideal para viajeros, compañeros de piso, grupos de amigos o cualquier situación donde haya gastos compartidos. Rápida, confiable y sin publicidad.
```

**Inglés:**
```
SplitSmart is the smartest and safest way to manage shared expenses with friends, family, or coworkers.

Going on a trip? Sharing a dinner? Living with roommates? SplitSmart lets you track every expense, see who owes what, and settle up easily — all from your phone. It works offline, and you can optionally sign in with Google to back up and sync your data.

✨ KEY FEATURES

💰 Expense splitting
• Log expenses and split them automatically among participants
• Exclude specific people from individual expenses
• See who owes what in real time

👥 Participant management
• Permanent friends and temporary participants per event
• Clear, detailed individual balances

📋 Events & groups
• Organize expenses by events: trips, dinners, shared living
• Event states: active, completed, archived
• Attach receipt photos to each expense

💱 Multi-currency
• Support for ARS, USD, EUR, BRL and more

🔒 You decide where your data lives
• Not signed in: your data stays only on your device (local database, works offline)
• Signed in with Google: your data is backed up to the cloud and synced across your devices
• Biometric authentication (fingerprint / Face ID)
• No ads, no trackers

☁️ Sync & shared events (with Google)
• Use your events on another phone or on the web
• Share an event with a QR code (read-only or edit)

🎨 User experience
• Automatic light and dark mode
• Available in Spanish, English, and Portuguese
• Clean, mobile-optimized interface

📤 Export
• Export your data whenever you need it

SplitSmart is ideal for travelers, roommates, friend groups, or any situation involving shared expenses. Fast, reliable, and ad-free.
```

---

## 3. Configuración de contenido (Obligatorio)

### Política de privacidad
- **Estado:** ✅ Redactada en `docs/privacy-policy.html` (publicarla y completar la URL)
- **Dónde alojarla (gratis):** GitHub Pages (carpeta `docs/`) o Google Sites
- **URL final (completar una vez publicada):** `___________________________________`

**Modelo de datos de la app:** sin iniciar sesión con Google los datos quedan solo en el dispositivo; con Google se sincronizan con la nube (Supabase). La política y el formulario de Seguridad de los datos deben decir exactamente esto.

### Seguridad de los datos (Data Safety) — respuestas a cargar
| Pregunta | Respuesta |
|---|---|
| ¿Recopila o comparte datos del usuario? | **Sí** (solo si el usuario inicia sesión con Google) |
| ¿Datos cifrados en tránsito? | **Sí** (HTTPS) |
| ¿El usuario puede pedir que se eliminen sus datos? | **Sí** (ver "Eliminación de cuenta") |
| ¿Se comparten datos con terceros? | **No** (Supabase y Google actúan como proveedores de servicio) |

| Tipo de dato | Recopilado | Finalidad | Opcional |
|---|---|---|---|
| Nombre | Sí | Funcionalidad de la app, cuenta | Sí (solo con Google) |
| Dirección de email | Sí | Cuenta, funcionalidad | Sí (solo con Google) |
| ID de usuario | Sí | Cuenta | Sí |
| Fotos (comprobantes, avatar) | Sí | Funcionalidad de la app | Sí |
| Otro contenido del usuario (eventos, gastos, participantes) | Sí | Funcionalidad de la app, respaldo | Sí |
| Datos de contacto de terceros (teléfono, alias/CBU de participantes) | Sí | Funcionalidad de la app | Sí |
| Ubicación, contactos, mensajes, audio, analíticas, publicidad | **No** | — | — |

### Eliminación de cuenta (obligatorio si hay creación de cuentas)
- **URL para solicitar la eliminación:** la URL de la política de privacidad (sección 5).
- **Pendiente:** hoy la eliminación se solicita por email a cbalucas@gmail.com. Google además exige una opción **dentro de la app**; falta implementarla.

**Permisos reales:** `CAMERA` (comprobantes y escaneo de QR), `USE_BIOMETRIC`/`USE_FINGERPRINT` (acceso local), `INTERNET` (sincronización y chequeo de versión). Se bloquean `RECORD_AUDIO`, `SYSTEM_ALERT_WINDOW` y `READ/WRITE_EXTERNAL_STORAGE`.

---

### Clasificación de contenido (cuestionario IARC)
Respuestas para el cuestionario de Google Play:

| Pregunta | Respuesta |
|---|---|
| ¿Violencia? | No |
| ¿Lenguaje inapropiado? | No |
| ¿Contenido sexual? | No |
| ¿Drogas o alcohol? | No |
| ¿Juego de azar simulado? | No |
| ¿Compras dentro de la app? | No |
| ¿Interacción con usuarios? | Compartir eventos por QR/código (sin chat ni red social) |
| **Clasificación esperada** | **PEGI 3 / Everyone** |

---

### Público objetivo
- **Audiencia:** Adultos (18+) / Todos los públicos
- **No dirigida a niños** (menores de 13 años)
- Marcar: **"No, esta app no está dirigida a niños"**

---

### Acceso a la aplicación
- **¿Requiere login para probarla?** No es obligatorio: existe un **usuario DEMO** local.
- **Instrucciones para el revisor de Google:**
  ```
  La aplicación incluye un modo DEMO accesible desde la pantalla de login (botón "Usar cuenta DEMO").
  Credenciales, si se solicitan: usuario "Demo" / contraseña "demo123456".
  El usuario DEMO funciona 100% offline: sus datos quedan solo en el dispositivo y nunca se sincronizan.
  El inicio de sesión con Google (opcional) activa el respaldo y la sincronización en la nube.
  ```

---

## 4. Assets visuales necesarios

| Asset | Tamaño | Estado |
|---|---|---|
| Ícono de la app | 512 x 512 px (PNG) | ✅ `assets/splitsmart/icon.png` |
| Ícono adaptativo (fondo) | 1024 x 500 px | ✅ `assets/splitsmart/adaptive-icon.png` |
| Capturas de pantalla (mínimo 2) | 16:9 o 9:16 | ⚠️ Pendiente |
| Gráfico de función (Feature Graphic) | 1024 x 500 px | ⚠️ Pendiente |

---

## 5. Consejos antes de publicar

- **Usar Prueba Interna primero:** Subir el AAB a "Prueba interna" en Play Console y enviárselo a amigos para validar que todo funcione antes del lanzamiento público.
- **Derechos de autor:** La app usa solo íconos y recursos propios. No usa imágenes de terceros ni marcas registradas externas.
- **Versión a subir:** v1.4.1 (versionCode 7) — archivo `SplitSmart_v1.4.1_*.aab`
- **Keystore:** Guardar backup del archivo `android/app/splitsmart-release-key.keystore` en un lugar seguro (nube/email). Sin él no se pueden publicar actualizaciones.

---

## 6. Links útiles

| Recurso | URL |
|---|---|
| Google Play Console | https://play.google.com/console |
| App Privacy Policy Generator | https://app-privacy-policy-generator.nisrulz.com/ |
| Google Sites (alojar política gratis) | https://sites.google.com |
| Guía oficial de publicación | https://support.google.com/googleplay/android-developer/answer/9859152 |
| Requisitos de calidad de Play Store | https://developer.android.com/docs/quality-guidelines/core-app-quality |
