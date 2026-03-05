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
Divide gastos con amigos y grupos de forma inteligente y 100% offline.
```

### Descripción larga *(máx. 4000 caracteres)*

**Español:**
```
SplitSmart es la forma más inteligente y segura de gestionar gastos compartidos con amigos, familia o compañeros de trabajo.

¿Fuiste de viaje? ¿Compartiste una cena? ¿Vivís con compañeros de piso? SplitSmart te permite registrar cada gasto, ver quién debe a quién y liquidar cuentas de forma transparente y sencilla, todo desde tu teléfono y sin necesidad de internet.

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

🔒 Privacidad total
• 100% offline: tus datos nunca salen de tu dispositivo
• Base de datos SQLite local, sin cuentas ni servidores externos
• Autenticación biométrica (huella digital / Face ID)

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

Going on a trip? Sharing a dinner? Living with roommates? SplitSmart lets you track every expense, see who owes what, and settle up easily — all from your phone, completely offline.

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

🔒 Full privacy
• 100% offline: your data never leaves your device
• Local SQLite database — no accounts, no external servers
• Biometric authentication (fingerprint / Face ID)

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
- **Estado:** ⚠️ Pendiente de creación
- **Herramienta recomendada:** [App Privacy Policy Generator](https://app-privacy-policy-generator.nisrulz.com/)
- **Dónde alojarla (gratis):** GitHub Pages o Google Sites
- **URL final (completar una vez creada):** `___________________________________`

**Puntos clave que DEBE incluir la política** (por los permisos que usa la app):
| Permiso | Qué declarar |
|---|---|
| `CAMERA` / `READ_MEDIA_IMAGES` | Acceso a cámara y fotos para adjuntar comprobantes |
| `USE_BIOMETRIC` / `USE_FINGERPRINT` | Autenticación biométrica local, no se envía a servidores |
| `READ/WRITE_EXTERNAL_STORAGE` | Exportación de datos, solo en el dispositivo |
| SQLite local | Los datos se almacenan únicamente en el dispositivo del usuario |
| Sin analíticas ni publicidad | La app no recopila ni transmite datos personales |

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
| ¿Interacción con usuarios? | No (no hay chat ni red social) |
| **Clasificación esperada** | **PEGI 3 / Everyone** |

---

### Público objetivo
- **Audiencia:** Adultos (18+) / Todos los públicos
- **No dirigida a niños** (menores de 13 años)
- Marcar: **"No, esta app no está dirigida a niños"**

---

### Acceso a la aplicación
- **¿Requiere login para probarla?** Sí, pero existe un **usuario DEMO** que Google puede usar.
- **Instrucciones para el revisor de Google:**
  ```
  La aplicación incluye un modo DEMO accesible desde la pantalla de login.
  Presionar el botón "Usar cuenta DEMO" para acceder sin registrarse.
  No es necesaria conexión a internet.
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
- **Versión a subir:** v1.4.0 (versionCode 6) — archivo `SplitSmart_v1.4.0_*.aab`
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
