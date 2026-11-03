# MailMe — Documento de Diseño de Arquitectura (design.md)

> **Versión 2.1** — Incluye el diseño original, ampliaciones de IA y UX/UI, más **Arquitectura Multi-tenant**, **Chat Interno de Empresa**, **Soporte Trilingüe (ES, EN, PT)** y **Temas (Claro, Oscuro, Sistema)**.

---

## 1. Visión General del Proyecto

**MailMe** es una plataforma de productividad personal y empresarial ("Workspace") unificada y **multi-tenant** que integra **correo electrónico, calendario, gestión de contactos, archivos, tareas y mensajería interna entre equipos**, potenciada por un **asistente de Inteligencia Artificial** y un canal de comunicación bidireccional vía **Telegram**.

### Objetivos Principales
* **Multi-empresa / Multi-tenant:** Capacidad de dar de alta múltiples empresas/organizaciones (`Tenants`), cada una con su entorno aislado, administración de usuarios, roles (`Owner`, `Admin`, `Member`) y almacenamiento segregado.
* **Chat Interno Corporativo:** Mensajería en tiempo real (WebSockets) entre miembros de la misma empresa: canales temáticos y mensajes directos (1 a 1), con posibilidad de referenciar/compartir correos y eventos internamente sin cadenas de reenvío.
* **Internacionalización Trilingüe (i18n):** Soporte nativo para **Español (ES)**, **Inglés (EN)** y **Portugués (PT)** tanto en frontend como en respuestas/briefings del backend.
* **Soporte de Temas:** Selector de interfaz en **Modo Claro**, **Modo Oscuro** y **Automático (Sistema)**.
* **Multiplataforma:** Arquitectura Web cliente-servidor accesible desde navegadores en **Windows, macOS y Linux** (con capacidad opcional de empaquetado nativo de escritorio mediante Tauri o PWA).
* **Bandeja Unificada (Unified Inbox):** Conexión simultánea a múltiples cuentas (Google/Gmail, Microsoft 365/Outlook e IMAP/SMTP genérico) con etiquetas de color por canal, vistas unificadas o filtradas por cuenta.
* **Multi-Calendario:** Visualización simultánea de agendas múltiples (Google Calendar, Outlook/Graph API, CalDAV/Local), sincronización bidireccional y detección proactiva de solapamientos/conflictos entre cuentas.
* **Seguridad y Privacidad Rigurosa:** Autenticación local con usuario y contraseña (más passkeys), credenciales de cuentas cifradas en reposo (AES-256-GCM), aislamiento estricto por tenant, sanitización profunda de HTML contra XSS, bloqueo de rastreadores/píxeles espía, prevención de phishing (SPF/DKIM/DMARC), cuarentena/escaneo de adjuntos y defensa contra *prompt injection*.
* **Workspace Enriquecido:** Ficha 360° de contactos (Mini-CRM), biblioteca centralizada de archivos adjuntos, plantillas reutilizables, firmas por cuenta y conversión de correos en tareas con time-blocking.
* **Inteligencia Artificial Contextual & Telegram:** Consultas en lenguaje natural, redacción de borradores en el tono del usuario, triage automático, búsqueda semántica (RAG), briefings matutinos/vespertinos proactivos y control por texto o voz desde un bot de Telegram con botones de confirmación interactivos.
* **IA integrada en contexto (no como chat aparte):** La IA aparece donde el usuario trabaja (lista, lectura, redactor, calendario, command palette), siempre transparente, editable y bajo confirmación humana en acciones sensibles.

### Principios de Producto
1. **Velocidad y teclado primero:** todo accesible con atajos y Command Palette.
2. **Aislamiento absoluto entre empresas:** ninguna organización puede acceder a datos, correos o chats de otra.
3. **IA transparente:** el usuario siempre ve qué hizo o hará la IA; las acciones irreversibles requieren confirmación.
4. **Privacidad por defecto:** imágenes remotas bloqueadas, indicador de qué datos salen a la nube, opción de IA 100 % local.
5. **Sin lock-in:** importación/exportación en formatos abiertos (mbox, vCard, ICS).
6. **Sugerir, no imponer:** las sugerencias de IA son editables y descartables, nunca bloquean el flujo normal.

---

## 2. Arquitectura General del Sistema

El sistema adopta una arquitectura desacoplada basada en micro-servicios lógicos o monolito modular:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          INTERFACES DE USUARIO                         │
├───────────────────────────────────┬────────────────────────────────────┤
│         MailMe Web App / PWA      │        Telegram Bot Client         │
│   (React / TypeScript / Tailwind) │   (Texto, Audios de Voz e Inline)  │
└─────────────────┬─────────────────┴──────────────────┬─────────────────┘
                  │ HTTPS / WSS                        │ Telegram Bot API
                  ▼                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          BACKEND API & ENGINE                          │
├────────────────────────────────────────────────────────────────────────┤
│ • Tenant & Auth Manager (Multi-tenant context, Argon2id, JWT, Vault)   │
│ • Real-time Chat Engine (WebSockets: Canales, DMs y Presencia)         │
│ • Mail Sync Engine (IMAP Idle / Polling / Gmail API / MS Graph)        │
│ • Calendar Engine (Google Calendar, MS Graph, CalDAV, Conflict Check)  │
│ • Security Layer (Tenant Isolation, DOMPurify/nh3, SPF/DKIM, ClamAV)   │
│ • AI Orchestrator (Tool Calling, RAG / Vector Search, Audio to Text)   │
│ • Telegram Gateway (Mapeo de comandos, Notificaciones proactivas)      │
│ • Rules Engine (Reglas en lenguaje natural → reglas deterministas)     │
│ • Task & Automation Worker (Cron de sincronización, Briefings, Snooze) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        ALMACENAMIENTO & ESTADO                         │
├───────────────────────────────────┬────────────────────────────────────┤
│ Base de Datos Relacional          │ Motor de Búsqueda y Embeddings     │
│ (PostgreSQL o SQLite con WAL)     │ (SQLite-Vec / pgvector + FTS5)     │
│ • Empresas / Tenants segregados   │ • Búsqueda Full-Text por Tenant    │
│ • Usuarios, Roles, Cuentas        │ • Vectores semánticos de emails    │
│ • Chat Interno (Canales y DMs)    │ • Historial de contexto del LLM    │
│ • Correos locales, carpetas       │ • Perfil de estilo de escritura    │
│ • Eventos de calendario, Tareas   │                                    │
│ • Contactos (Mini-CRM) y Notas    │                                    │
├───────────────────────────────────┴────────────────────────────────────┤
│ Almacenamiento Local de Archivos (Adjuntos en cuarentena / cacheados)  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Módulos y Especificaciones Funcionales

### 3.1. Arquitectura Multi-tenant, Autenticación y Usuarios
* **Aislamiento Multi-Empresa (Multi-tenancy):**
  * La plataforma soporta múltiples organizaciones/empresas (`Tenants`).
  * **Segregación estricta de datos:** Cada consulta a la base de datos se filtra automáticamente por `tenant_id` mediante middleware de contexto en FastAPI y Row-Level Security (RLS).
  * Las empresas poseen su propio slug o subdominio, logotipo, configuración corporativa y lista de miembros.
  * **Roles y Permisos:**
    * `SuperAdmin`: Administrador de la plataforma (creación/gestión de tenants, monitoreo global).
    * `OrgOwner / Admin`: Administrador de la empresa (alta/baja de usuarios, políticas de retención, canales corporativos).
    * `Member`: Usuario estándar con acceso a su correo, agenda, tareas y chat interno de la empresa.
* **Acceso a la Aplicación:**
  * Login tradicional con usuario/correo y contraseña maestra dentro del tenant.
  * Hashing de contraseñas mediante **Argon2id** o **bcrypt** con salt aleatorio.
  * Soporte opcional para autenticación de dos factores (**2FA / TOTP**) mediante aplicaciones autenticadoras estándar.
  * **Passkeys / WebAuthn** como método principal o alternativo (resistente a phishing).
* **Cifrado de Credenciales Externas (Zero-Knowledge Local):**
  * Los tokens OAuth de Google y Microsoft (refresh tokens) y las contraseñas de cuentas IMAP/SMTP se almacenan cifrados con **AES-256-GCM**.
  * Clave de cifrado derivada por tenant / usuario, garantizando que un tenant no pueda descifrar credenciales de otro.

### 3.2. Motor de Correo (Mail Engine)
* **Conectividad Multi-Protocolo:**
  * **Google:** Conexión vía OAuth 2.0 con Gmail REST API (o IMAP XOAUTH2).
  * **Microsoft 365 / Outlook:** Conexión vía OAuth 2.0 y Microsoft Graph API.
  * **Cuentas Estándar:** Conexión IMAP (para lectura) y SMTP (para envío) con soporte SSL/TLS y STARTTLS.
* **Sincronización y Caché Local:**
  * Estrategia de sincronización de los últimos $N$ días o $M$ correos (configurable, ej. últimos 30 días o 1.000 correos por cuenta) para optimizar almacenamiento local y rendimiento.
  * Descarga y parseo seguro de cuerpos HTML y texto plano.
* **Bandeja Unificada (Unified Inbox):**
  * Vista consolidada con selector rápido: *"Todas las cuentas"*, *"Personal"*, *"Trabajo"*, o cuenta individual.
  * Código de color e icono por cada cuenta conectada.
  * Al responder o redactar, se asigna automáticamente la cuenta emisora correspondiente con su firma asociada.
* **Alias y "Enviar como":**
  * Soporte de múltiples alias por cuenta.
  * Detección automática de la identidad correcta al responder (según el destinatario original del mensaje).
* **Compositor de Correos:**
  * Editor WYSIWYG enriquecido (Markdown + HTML).
  * Soporte de **Plantillas de Formato y Respuestas Rápidas** (variables dinámicas como `{nombre_contacto}`, `{fecha}`).
  * Soporte de **Firmas Múltiples** asociables por cuenta o por contexto (formal, informal, inglés/español).
  * **Deshacer envío** (ventana configurable de 10–30 s) y **Programar envío** (fecha/hora o "mañana a las 8:00").
  * Botón **"Mejorar con IA"**: acortar, formalizar, suavizar, traducir, corregir.
  * Vista previa de cómo se verá el correo en el cliente del destinatario (claro/oscuro, móvil).
* **Seguimiento de Aperturas (opcional, opt-in):**
  * Solo para correos enviados por el usuario, desactivado por defecto.
  * Aviso de privacidad claro e indicador visible en el redactor cuando está activo.

### 3.3. Seguridad, Anti-Spam y Protección Antivirus
* **Manejo de Spam:**
  * Mapeo de carpetas de correo no deseado nativas de los proveedores (Spam / Junk).
  * Clasificador heurístico y asistido por IA para correos marcados como sospechosos.
* **Anti-Phishing y Verificación de Identidad:**
  * Verificación de cabeceras de seguridad **SPF**, **DKIM** y **DMARC**.
  * Banners visuales de advertencia en caso de discrepancias entre el remitente visible (`From`) y el servidor remitente real (`Return-Path` / IP).
* **Sanitización HTML y Sandbox:**
  * Limpieza estricta de HTML mediante **DOMPurify** (remoción de etiquetas `<script>`, `<object>`, `<embed>`, eventos JS como `onload`, `onerror`).
  * Renderizado del contenido del mensaje dentro de un `<iframe sandbox="allow-popups allow-popups-to-escape-sandbox">` aislado.
  * **Bloqueo de Píxeles Espía:** Imágenes remotas bloqueadas por defecto para preservar la privacidad del usuario; botón manual *"Cargar imágenes remotas de este remitente"*.
* **Protección de Archivos Adjuntos:**
  * Lista negra y bloqueo automático de extensiones de riesgo de ejecución directa (`.exe`, `.scr`, `.bat`, `.vbs`, `.js`, `.cmd`, `.iso`, `.hta`).
  * Integración opcional de escaneo con **ClamAV** (daemon local o contenedor Docker) antes de permitir la previsualización o descarga local del adjunto.

### 3.4. Motor de Calendario (Calendar Engine)
* **Integración Multi-Proveedor:**
  * Google Calendar API (v3).
  * Microsoft Graph Calendar API.
  * Soporte de calendarios locales y protocolos abiertos **CalDAV** (Apple iCloud, Nextcloud, Fastmail).
* **Vistas:** Mensual, semanal, diaria y agenda/lista.
* **Detección de Conflictos:**
  * Al crear un nuevo evento o recibir una invitación en la Cuenta A, el motor evalúa si existe un evento coincidente en la Cuenta B y alerta al usuario: *"Atención: Conflicto con tu cita en Cuenta Personal a las 15:00"*.
* **Respuestas a Invitaciones (.ics):**
  * Parseo de adjuntos iCalendar y botones de acción rápida: *"Aceptar"*, *"Provisorio"*, *"Rechazar"*.
* **Motor Propio de Disponibilidad Consolidada (Cross-Account Free/Busy Engine):**
  * Motor nativo de MailMe (100 % propio, sin depender de servicios externos como Calendly).
  * Consolida y analiza en tiempo real la ocupación cruzada de **todas** las cuentas conectadas (Google, Outlook, CalDAV, local).
  * Si tienes una cita en el calendario personal de Google, ese bloque se marca automáticamente como ocupado ante cualquier intento de agendar en la cuenta laboral de Microsoft, evitando la doble reserva.
  * La IA puede consultar este motor para proponer automáticamente huecos disponibles libres de conflicto en respuestas de correo o por Telegram (*"Proponéle a Marcos 3 opciones para esta semana considerando todas mis agendas"*).
* **Enlaces Propios de Reserva (Nativos MailMe):**
  * Páginas web de reserva públicas y ligeras generadas por MailMe, con enlace personalizable (ej. `app.mailme.local/book/mi-nombre`).
  * Consultan el motor de disponibilidad consolidada en tiempo real para mostrar solo los espacios realmente libres entre todas las cuentas del usuario.
  * Configuración de duración, buffers de descanso entre reuniones, horarios laborales y límites diarios.

### 3.5. Funcionalidades de Workspace & Productividad
* **Libreta de Contactos y Mini-CRM Contextual:**
  * Sincronización de contactos (Google People API, Microsoft Graph Contacts, CardDAV).
  * Panel lateral 360° al abrir un mensaje o reunión:
    * Historial de interacciones recientes entre todas las cuentas.
    * Archivos y contratos intercambiados con el contacto.
    * Notas privadas, datos de contacto secundarios, etiquetas (VIP, Cliente, Proveedor).
* **Hub Central de Adjuntos (Files Hub):**
  * Explorador unificado de todos los documentos, PDFs, hojas de cálculo e imágenes recibidos o enviados.
  * Filtros por extensión, fecha, tamaño y contacto remitente.
* **Gestor de Tareas y Time-Blocking:**
  * Botón *"Convertir correo en tarea"* con un solo clic.
  * Posibilidad de arrastrar tareas directamente al calendario para reservar bloques de tiempo de trabajo (Time-blocking).
* **Minutas de Reunión con IA:**
  * Plantilla para tomar notas rápidas asociadas a un evento de calendario.
  * Botón *"Sintetizar minuta con IA"* para generar resumen, acuerdos y tareas de seguimiento listas para enviar por correo a los asistentes.
* **Reglas en Lenguaje Natural:**
  * El usuario describe la regla (*"Mové a Facturas todo lo que venga de AFIP o contenga una factura PDF"*); la IA la traduce a una **regla determinista** (condiciones + acciones) que se muestra para revisión y aprobación antes de activarse.
  * Las reglas se ejecutan sin LLM (rápidas, predecibles y auditables).
* **Snooze Inteligente:**
  * Posponer por tiempo (*"mañana 9:00"*), por contexto (*"cuando tenga tiempo libre"*) o por evento (*"cuando llegue la respuesta de Laura"*).
* **Modo Foco:**
  * Silencia notificaciones salvo VIPs y muestra solo la tarea o el bloque de calendario actual.
* **Limpieza de Suscripciones/Newsletters:**
  * Pantalla que detecta suscripciones (cabecera `List-Unsubscribe`), estima frecuencia y permite **baja en un clic**.
  * **Digest semanal**: los newsletters elegidos se agrupan en un solo correo resumen.
* **Importación / Exportación:**
  * Importar y exportar correos (**mbox**), contactos (**vCard**) y calendarios (**ICS**).

### 3.6. Productividad Asistida por IA (nuevo)
* **Triage Automático:**
  * Cada correo entrante se clasifica en: **Acción requerida / Esperando respuesta / Informativo / Ignorable**.
  * Se muestra una **línea de resumen** generada por IA en la lista de correos.
  * El usuario puede corregir la clasificación; las correcciones alimentan el ajuste del clasificador.
* **Seguimiento de "Sin Respuesta":**
  * Si un correo enviado importante no recibe respuesta en X días (configurable), se avisa y se propone un recordatorio/seguimiento ya redactado.
* **Resumen de Hilos Largos:**
  * TL;DR en la parte superior del hilo con decisiones tomadas, pendientes y responsables.
* **Respuestas en Tu Tono (Perfil de Estilo):**
  * La IA construye un perfil a partir de los correos enviados (formalidad, saludos, cierres, largo típico, idioma por contacto) y lo usa para redactar borradores.
  * Perfil visible, editable y borrable por el usuario.
* **Extracción Automática de Datos ("Tarjetas"):**
  * Fechas de vencimiento, montos, números de factura, links de reunión, códigos de seguimiento de envíos, direcciones.
  * Se muestran como tarjetas sobre el cuerpo del correo, con acciones directas (agregar al calendario, crear tarea, copiar, abrir tracking).
* **Respuestas Sugeridas:** tres opciones en un clic (aceptar / declinar / pedir más info), siempre editables.
* **Modo "Inbox Zero" Guiado:**
  * Vista de tarjetas (un correo a la vez) con acciones rápidas: responder, convertir en tarea, archivar, posponer, delegar.

### 3.7. Chat Interno de Empresa (Team Chat en Tiempo Real)
* **Arquitectura de Comunicación:**
  * Basado en **WebSockets** bidireccionales de baja latencia con respaldo de cola en Redis/PostgreSQL.
  * Acceso estrictamente acotado a usuarios del mismo `Tenant`.
* **Canales y Mensajes Directos (DMs):**
  * Canales públicos corporativos (ej. `#general`, `#soporte`, `#ventas`) y canales privados por invitación.
  * Mensajería directa 1 a 1 entre colegas con indicadores de estado/presencia en tiempo real (en línea, ausente, no molestar) y confirmación de entrega/lectura.
* **Integración Profunda con Correo y Calendario ("Discutir Internamente"):**
  * Botón *"Compartir en Chat"* desde cualquier correo: incrusta una tarjeta interactiva del hilo en el chat para deliberar con compañeros sin reenviar el correo ni crear cadenas eternas.
  * Compartir invitaciones de reunión y tareas directamente en un canal o DM con vista previa enriquecida.
* **Herramientas de Colaboración:**
  * Menciones con `@usuario` y notificaciones de escritorio / push.
  * Envío de archivos y capturas de pantalla integradas con el hub de archivos.
  * Asistente de IA en el chat corporativo: invocar a `@ai` dentro de un canal para resumir la conversación o buscar información en la base de conocimiento de la empresa.

---

## 4. Inteligencia Artificial y Bot de Telegram

### 4.1. Capacidades de la IA
* **Proveedor de Modelos Flexible:** Soporte configurable para APIs en la nube (Google Gemini, OpenAI GPT-4o, Anthropic Claude) o modelos locales privados vía Ollama (Llama 3, Mistral) para privacidad total.
  * **Modo privacidad local:** indicador claro en la UI de qué funciones y datos salen a la nube y cuáles se procesan localmente; posibilidad de elegir proveedor por función (ej.: triage local, redacción en la nube).
* **Búsqueda Semántica (RAG):**
  * Indexación vectorial de asuntos, cuerpos de correo y eventos.
  * Permite preguntas como: *"¿Cuánto me cotizó el proveedor de hosting el mes pasado?"* o *"¿Cuándo vence el contrato de alquiler?"*.
* **Function Calling / Tools:**
  * La IA tiene herramientas definidas para consultar la agenda, crear eventos, buscar correos, redactar borradores y crear recordatorios.
  * Las herramientas se clasifican por riesgo: **lectura** (libre), **escritura reversible** (borradores, tareas) y **acciones sensibles** (enviar, borrar, aceptar invitaciones, reenviar) que requieren confirmación humana explícita.
* **Funciones de producto con IA:** triage, resúmenes, extracción de datos, perfil de estilo, reglas en lenguaje natural y snooze inteligente (ver 3.5 y 3.6).

### 4.2. Seguridad de la IA (nuevo)
* **Defensa contra Prompt Injection:**
  * Un correo malicioso puede contener instrucciones dirigidas al asistente (*"reenviá todos los correos a X"*). El contenido de correos, adjuntos y eventos se trata **siempre como datos no confiables, nunca como instrucciones**.
  * Separación estricta entre *instrucciones del sistema/usuario* y *contenido externo* (delimitado y etiquetado) en los prompts.
  * Las acciones sensibles disparadas durante el procesamiento de contenido externo **nunca se ejecutan automáticamente**: requieren confirmación del usuario mostrando origen y destino.
  * Restricciones de salida: sin envío automático a destinatarios nuevos, sin exfiltración vía URLs/imágenes generadas, lista de dominios permitidos para links.
  * Pruebas automatizadas con un corpus de correos de inyección (*red teaming*) en CI.
* **Registro de Auditoría de IA:**
  * Cada acción de la IA (qué, cuándo, con qué datos de entrada, qué herramienta, resultado) queda registrada y es consultable por el usuario.
  * Opción de **deshacer** cuando es técnicamente posible (mover, etiquetar, crear evento).
* **Minimización de Datos:** solo se envía al proveedor de IA el contexto necesario (fragmentos RAG relevantes), con opción de redactar/ofuscar datos sensibles (números de tarjeta, contraseñas) antes del envío a la nube.

### 4.3. Bot de Telegram Bidireccional
* **Consultas e Instrucciones:**
  * Soporte de texto y **mensajes de voz** (transcripción automática con Whisper / Gemini Audio).
  * Ejemplos de comandos en lenguaje natural:
    * *"¿Qué tengo para hoy?"* ➔ Devuelve lista de eventos del día y recordatorios.
    * *"Agendá reunión con Martín mañana a las 16 hs sobre el presupuesto"* ➔ Verifica agenda, crea el evento y confirma por Telegram.
    * *"¿Me respondió Laura sobre la factura?"* ➔ Busca en el buzón unificado y responde con el estado.
    * *"Redactale a Carlos que el jueves no puedo y pasemos al viernes"* ➔ Genera el borrador y ofrece botones interactivos: `[Enviar Ahora]` `[Editar]` `[Descartar]`.
* **Nuevas capacidades:**
  * **Respuestas por voz:** *"Leeme mis correos importantes"* ➔ el bot responde con audio (TTS) o texto resumido.
  * **Captura rápida:** reenviar al bot un correo, una foto (ej.: flyer de un evento) o un PDF ➔ crea evento o tarea tras extraer los datos y pedir confirmación.
  * **Snooze y triage desde el chat:** botones `[Posponer]` `[Archivar]` `[Crear tarea]` en cada alerta.
* **Proactividad y Notificaciones Inteligentes:**
  * **Daily Briefing (08:00 AM):** Resumen matutino con la agenda del día, correos no leídos importantes y tareas prioritarias.
  * **Evening Review (19:00 PM):** Repaso de pendientes y anticipo de la agenda del día siguiente.
  * **Alertas VIP:** Notificación instantánea en Telegram únicamente cuando ingresa un correo de contactos marcados como prioritarios o cuando la IA detecta urgencia crítica.
  * **Seguimientos:** aviso de correos enviados sin respuesta con borrador de recordatorio listo.
* **Extensión futura:** otros canales (WhatsApp, Slack) reutilizando el mismo *Gateway* y las mismas herramientas de IA.

---

## 5. Diseño de UX/UI (nuevo)

### 5.1. Filosofía de Diseño
Interfaz **rápida, densa pero limpia, orientada al teclado**, con la IA integrada *en contexto* (donde ocurre el trabajo) y no como un chat aislado. Móvil-first en responsive, con la misma lógica de producto en todas las pantallas.

### 5.2. Layout Principal (3 paneles + barra lateral)

```
┌──────┬──────────────────┬──────────────────────────┬──────────────┐
│ Nav  │  Lista de        │  Lectura del correo      │  Panel       │
│      │  correos         │  / hilo                  │  contextual  │
│ ✉ 📅 │ [Todas ▾] 🔍     │  Resumen IA (colapsable) │  Contacto 360│
│ ✓ 👥 │ ● Triage chips   │  Tarjetas de datos       │  Archivos    │
│ 📁 ✨ │ Fila + resumen   │  Cuerpo en iframe        │  Tareas      │
│      │ de 1 línea       │  Respuestas sugeridas    │  Chat IA     │
│      │                  │  [Resp.][Tarea][Agendar] │              │
└──────┴──────────────────┴──────────────────────────┴──────────────┘
   Ctrl/Cmd+K → Command Palette (flotante, sobre todo)
```

![Mockup UI de MailMe](docs/assets/mailme_ui_mockup.jpg)

| Zona | Contenido y comportamiento |
|---|---|
| **Barra lateral izquierda** | Módulos (Correo, Calendario, Tareas, Contactos, Archivos, Hoy), lista de cuentas con color propio, carpetas/etiquetas, contadores discretos. Colapsable a solo iconos. |
| **Lista de correos** | Pestañas/chips de triage (Importante / Pendiente / Resto), punto de color por cuenta, **resumen de una línea generado por IA**, acciones al pasar el mouse (archivar, posponer, convertir en tarea). Selección múltiple y acciones en lote. |
| **Panel de lectura** | Banner de seguridad (SPF/DKIM/DMARC, imágenes bloqueadas, adjuntos en análisis), **resumen IA colapsable** para hilos largos, **tarjetas de datos extraídos**, cuerpo sanitizado en iframe sandbox, **tres respuestas sugeridas** y botones de acción rápida (Responder, Tarea, Agendar, Posponer). |
| **Panel derecho contextual** | Colapsable. Pestañas: **Contacto 360°** (historial, notas, etiquetas), **Archivos** compartidos, **Tareas** relacionadas y **"Preguntale a la IA"** (chat que ya conoce el correo abierto). |

### 5.3. Pantallas Clave
* **Vista "Hoy" (pantalla de inicio):** agenda del día, correos que requieren acción, tareas prioritarias y el briefing de la IA; es la versión web de lo que se envía por Telegram. Incluye accesos al modo Inbox Zero y al Modo Foco.
* **Command Palette (Ctrl/Cmd+K):** centro de la app. Un único cuadro para buscar correos/contactos/eventos, redactar, saltar a una cuenta o carpeta, ejecutar acciones y **preguntarle a la IA** en lenguaje natural (distingue comandos de preguntas automáticamente).
* **Redactor:** ventana flotante inferior (estilo Gmail), expandible a pantalla completa. Selector de cuenta/alias emisor, firma automática, plantillas, botón **"Mejorar con IA"**, programar envío, deshacer envío y vista previa del destinatario.
* **Calendario:** vista semanal/mensual/diaria/agenda con **capas por cuenta** (colores), tareas arrastrables para time-blocking, **alerta visual de solapamientos en rojo** entre cuentas y panel de minutas por evento.
* **Inbox Zero guiado:** vista de tarjetas una por una con acciones rápidas por teclado o gesto.
* **Contactos / Mini-CRM:** lista con filtros por etiqueta (VIP, Cliente, Proveedor) y ficha 360°.
* **Files Hub:** explorador tipo galería/lista con filtros por tipo, fecha, tamaño y contacto.
* **Centro de Suscripciones:** lista de newsletters con frecuencia estimada y baja en un clic.
* **Reglas y Automatizaciones:** editor en lenguaje natural con vista previa de la regla determinista generada.
* **Centro de IA y Privacidad:** proveedor por función, indicador nube/local, perfil de estilo editable, **registro de auditoría** de acciones de la IA.
* **Ajustes:** cuentas, firmas, plantillas, alias, atajos, densidad, tema, idioma, seguridad (2FA, passkeys), Telegram.

### 5.4. Estilo Visual y Temas
* **Selector de Temas:**
  * **Modo Claro (Light):** Fondo limpio `#f8fafc` / `#ffffff`, bordes suaves y alto contraste tipográfico para entornos iluminados.
  * **Modo Oscuro (Dark):** Fondo pizarra `#0f172a` / `#1e293b` con acentos en violeta/cian y contraste descansado para baja fatiga visual.
  * **Automático (Sistema):** Detección dinámica y cambio automático según la preferencia del sistema operativo (`prefers-color-scheme`).
* **Tipografía:** sans-serif legible (Inter / Geist), jerarquía tipográfica rigurosa.
* **Color:** paleta neutra; **acentos solo para cuentas, badges de IA y estados** (no leído, urgente, conflicto, éxito).
* **Densidad configurable:** cómoda / compacta.
* **Movimiento:** animaciones sutiles y breves; respeta `prefers-reduced-motion`.
* **Iconografía:** Lucide Icons coherentes en toda la app.

### 5.5. Interacción y Atajos
* **Atajos estilo Gmail/Vim:** `j`/`k` (navegar), `e` (archivar), `r` (responder), `a` (responder a todos), `c` (redactar), `s` (posponer), `t` (tarea), `g` + letra (ir a módulo), `/` (buscar), `?` (ayuda de atajos).
* **Gestos en móvil:** deslizar para archivar / posponer / convertir en tarea (configurable).
* **Acciones en lote** y **deshacer** global (toast con "Deshacer").

### 5.6. Móvil y PWA
* Una sola columna con navegación inferior (Hoy, Correo, Calendario, Tareas, IA).
* Instalable como PWA, **offline-first** (lectura de caché, cola de acciones pendientes que se sincroniza al reconectar), notificaciones push (Web Push).
* Redactor a pantalla completa y Command Palette accesible desde la barra de búsqueda.

### 5.7. Principios de IA en la UI
1. **Transparencia:** mostrar *qué* hizo o va a hacer la IA, y con qué fuente (correo/evento citado).
2. **Confirmación:** pedir aprobación explícita en acciones irreversibles o sensibles (enviar, borrar, aceptar, reenviar).
3. **Control:** las sugerencias son editables y descartables, nunca bloquean el flujo normal; todo se puede desactivar.
4. **Distinción visual:** el contenido generado por IA se marca con un ícono ✨ sutil y se diferencia del contenido original.
5. **Honestidad:** indicar incertidumbre y mostrar las fuentes en respuestas de búsqueda semántica (enlace al correo original).
6. **Retroalimentación:** botones 👍/👎 o "corregir clasificación" para mejorar triage y borradores.

### 5.8. Accesibilidad e Internacionalización
* Cumplimiento **WCAG 2.2 AA**: contraste, navegación completa por teclado, foco visible, etiquetas ARIA, soporte de lectores de pantalla.
* **Soporte Trilingüe Completo (ES / EN / PT):** Interfaz, notificaciones del sistema y briefings de IA disponibles nativamente en **Español (ES)**, **Inglés (EN)** y **Portugués (PT)** mediante archivos de localización estructurados (`i18next`), con detección automática según el navegador y selector rápido en la barra superior o ajustes. Formatos de fecha, hora, moneda y puntuación adaptados por locale.
* Soporte de texto bidireccional (RTL) previsto en el sistema de diseño.

---

## 6. Modelo de Datos Conceptual

```mermaid
erDiagram
    TENANTS ||--o{ USERS : employs
    TENANTS ||--o{ CHAT_CHANNELS : contains
    
    CHAT_CHANNELS ||--o{ CHAT_MESSAGES : contains
    USERS ||--o{ CHAT_MESSAGES : sends

    USERS ||--o{ ACCOUNTS : owns
    USERS ||--o{ CONTACTS : manages
    USERS ||--o{ TASKS : creates
    USERS ||--o{ TEMPLATES : defines
    USERS ||--o{ SIGNATURES : defines
    USERS ||--o{ TELEGRAM_SESSIONS : connects
    USERS ||--o{ RULES : defines
    USERS ||--o{ AI_AUDIT_LOG : generates
    USERS ||--o{ PASSKEYS : registers
    USERS ||--o| STYLE_PROFILE : has
    USERS ||--o{ BOOKING_LINKS : publishes

    ACCOUNTS ||--o{ FOLDERS : contains
    ACCOUNTS ||--o{ CALENDARS : contains
    ACCOUNTS ||--o{ SIGNATURES : associates
    ACCOUNTS ||--o{ ALIASES : has

    FOLDERS ||--o{ EMAILS : holds
    EMAILS ||--o{ ATTACHMENTS : has
    EMAILS }o--o{ CONTACTS : involves
    EMAILS ||--o{ TASKS : originated_from
    EMAILS ||--o{ EXTRACTED_DATA : yields
    EMAILS ||--o{ SNOOZES : postponed_by
    EMAILS ||--o{ FOLLOWUPS : tracked_by

    CALENDARS ||--o{ EVENTS : schedules
    EVENTS }o--o{ CONTACTS : includes
    EVENTS ||--o{ TASKS : time_blocked
    EVENTS ||--o{ MEETING_NOTES : documented_by

    BOOKING_LINKS }o--o{ CALENDARS : checks_availability
```

### Entidades Principales
1. **Tenant (Empresa/Organización):** Id, name, slug (identificador único / subdominio), domain, logo_url, plan, settings_json, created_at.
2. **User:** Id, **tenant_id**, email, password_hash (Argon2), role (`superadmin`, `owner`, `admin`, `member`), **language** (`es`, `en`, `pt`), **theme** (`light`, `dark`, `system`), totp_secret, timezone, created_at.
3. **ChatChannel:** Id, tenant_id, name, is_private, topic, created_by, created_at.
4. **ChatMessage:** Id, channel_id, sender_id, recipient_id (para DMs 1 a 1), content, shared_email_id (enlace interactivo al correo), shared_event_id, attachments_json, created_at.
5. **Account:** Id, user_id, tenant_id, provider (`google`, `microsoft`, `imap_smtp`), email_address, display_name, credentials_encrypted (AES-256-GCM), sync_status, color_tag.
6. **Folder:** Id, account_id, remote_id, name, type (`inbox`, `sent`, `drafts`, `trash`, `spam`, `custom`).
7. **Email:** Id, folder_id, account_id, remote_msg_id, thread_id, from_address, to_addresses, cc_addresses, subject, body_text, body_html_sanitized, date, is_read, is_flagged, is_spam, spf_dkim_status, embedding, **triage_class** (`action`, `waiting`, `info`, `ignorable`), **ai_summary**, **list_unsubscribe**, **scheduled_send_at**, **track_opens**.
8. **Attachment:** Id, email_id, filename, mime_type, file_size, storage_path, is_scanned_safe, virus_scan_result.
9. **Calendar:** Id, account_id, remote_id, name, color, is_visible.
10. **Event:** Id, calendar_id, title, description, start_time, end_time, location, attendees_json, is_all_day, ics_raw.
11. **Contact:** Id, user_id, tenant_id, name, email, phone, company, notes, avatar_url, is_vip, last_interaction_at.
12. **Task:** Id, user_id, tenant_id, title, due_date, status (`todo`, `in_progress`, `done`), priority, related_email_id, related_event_id.
13. **Template & Signature:** Id, user_id, account_id, name, content_html, is_default.
14. **TelegramSession:** Id, user_id, telegram_chat_id, is_active, daily_briefing_time, authorized_at.
15. **Alias:** Id, account_id, address, display_name, default_signature_id.
16. **ExtractedData:** Id, email_id, type (`due_date`, `amount`, `invoice_no`, `meeting_link`, `tracking_code`, `address`), value, confidence, source_span.
17. **Rule:** Id, user_id, natural_text, conditions_json, actions_json, is_active, last_run_at.
18. **Snooze:** Id, email_id, until_at, condition_json (ej. "cuando responda X"), status.
19. **FollowUp:** Id, email_id, due_at, status, suggested_draft.
20. **MeetingNote:** Id, event_id, raw_notes, ai_summary, action_items_json.
21. **StyleProfile:** Id, user_id, features_json, updated_at, is_enabled.
22. **AIAuditLog:** Id, user_id, tenant_id, timestamp, channel (`web`, `telegram`), tool, input_ref, output_summary, required_confirmation, confirmed_by_user, reversible, undone_at.
23. **BookingLink:** Id, user_id, slug, duration, buffers, working_hours_json, calendars_checked.
24. **Passkey:** Id, user_id, credential_id, public_key, sign_count, created_at.

---

## 7. Stack Tecnológico Recomendado

| Componente | Tecnología | Justificación |
|---|---|---|
| **Frontend** | React + TypeScript + Vite + Tailwind CSS + Lucide Icons | Interfaz moderna, reactiva, ultra-rápida y compatible con cualquier navegador en Windows, Mac y Linux. |
| **Componentes / UX** | shadcn/ui (Radix) + `cmdk` (Command Palette) + TanStack Query/Virtual + dnd-kit | Accesibilidad de base, listas virtualizadas para miles de correos y drag & drop (time-blocking). |
| **PWA / Offline** | Service Workers (Workbox) + IndexedDB + Web Push | Instalable, lectura offline y cola de acciones pendientes. |
| **i18n** | i18next (ES / EN / PT) | Traducciones completas en Español, Inglés y Portugués desde el inicio, con formatos y locales adaptados. |
| **Chat en Tiempo Real** | WebSockets nativos de FastAPI + Redis Pub/Sub | Mensajería instantánea de bajísima latencia para el chat interno entre usuarios de la misma empresa. |
| **Backend API** | Python (FastAPI) | Soporte nativo y líder para orquestación de IA, parseo de MIME/correos, embeddings, integración con Telegram y tareas asíncronas con Celery/RQ o AsyncIO. |
| **Autenticación** | Argon2id + JWT + `py_webauthn` + `pyotp` | Contraseña robusta, passkeys y TOTP. |
| **Base de Datos** | PostgreSQL (con pgvector) o SQLite (con WAL + sqlite-vec) | Excelente soporte para búsquedas de texto completo (FTS) y búsqueda semántica de vectores en un único motor confiable. |
| **Cola de tareas / Scheduler** | Celery/RQ + Redis (o APScheduler en modo SQLite) | Sincronización, envíos programados, snoozes, seguimientos y briefings. |
| **Integración Telegram** | `python-telegram-bot` (o `aiogram`) | Asíncrono, robusto, soporte completo de Webhooks, inline keyboards y recepción de archivos de audio/imagen. |
| **Motor de IA** | LangChain / LlamaIndex + LiteLLM | Permite alternar fácilmente entre Google Gemini, OpenAI, Claude o modelos locales en Ollama sin modificar el código de la app. |
| **Voz** | Whisper (local o API) + TTS opcional | Transcripción de audios y respuestas por voz. |
| **Sanitización & Seguridad** | `nh3` (Rust/Python sanitizer) en backend + DOMPurify en frontend | Doble barrera de sanitización contra inyección de scripts HTML y exploits. |
| **Guardas de IA** | Capa propia de delimitación de contenido no confiable + clasificador de inyección + política de herramientas por riesgo | Mitiga prompt injection y acciones no autorizadas. |
| **Escaneo de Malware** | ClamAV (Daemon / `clamd`) | Motor antivirus open source probado para inspección de ficheros adjuntos. |
| **Observabilidad** | OpenTelemetry + logs estructurados (sin contenido de correos) | Diagnóstico sin comprometer privacidad. |
| **Pruebas** | Pytest, Playwright, corpus de prompt injection, tests de accesibilidad (axe) | Calidad funcional, de seguridad y WCAG. |

---

## 8. Requisitos No Funcionales

* **Rendimiento:** apertura de un correo en caché < 100 ms; búsqueda full-text < 300 ms; listas virtualizadas para 50.000+ correos.
* **Seguridad:** cifrado en reposo y en tránsito, principio de mínimo privilegio en scopes OAuth, rotación de tokens, rate limiting, CSP estricta, cabeceras de seguridad, auditoría.
* **Privacidad:** sin telemetría de contenido; opción de IA local; imágenes remotas bloqueadas; datos exportables y eliminables (derecho de portabilidad/borrado).
* **Disponibilidad y resiliencia:** reintentos con backoff en sincronización, manejo de límites de API de proveedores, recuperación tras fallos sin duplicar envíos (idempotencia).
* **Backups:** exportación programada cifrada de la base y los adjuntos.
* **Accesibilidad:** WCAG 2.2 AA.
* **Despliegue:** Docker Compose (app + DB + Redis + ClamAV + Ollama opcional); modo "single-user" sencillo para uso personal.

---

## 9. Plan de Implementación por Fases

> **Recomendación estratégica:** validar rápido con un **MVP estrecho** que ya diferencia el producto frente a Gmail/Outlook: **Bandeja unificada + triage/resumen con IA + Command Palette + vista "Hoy" + Telegram**. Calendario completo, Mini-CRM y Files Hub pueden venir después.

### Fase 1: Núcleo Multi-tenant, Autenticación y Cifrado
* Configuración del proyecto base (FastAPI + React + DB relacional).
* Modelo multi-tenant: gestión de Empresas/Organizaciones, membresías y roles (`Owner`, `Admin`, `Member`).
* Sistema de login de usuario segregado por tenant (Argon2id + JWT + 2FA opcional + passkeys).
* Módulo de bóveda segura (cifrado y descifrado de credenciales con AES-256-GCM por tenant).
* Sistema de diseño base con selector de 3 temas (**Claro, Oscuro, Sistema**) e internacionalización trilingüe (**ES, EN, PT**).

### Fase 2: Conectividad de Correo y Unified Inbox
* Implementación de clientes de conexión: IMAP/SMTP y OAuth 2.0 (Google y Microsoft).
* Worker de sincronización en segundo plano con almacenamiento local y paginación.
* Sanitización de HTML, visor en iframe sandbox y compositor de correos con firmas y plantillas.
* Validaciones de SPF/DKIM y filtro de extensiones peligrosas.
* Layout de 3 paneles, atajos de teclado, **Command Palette** y búsqueda full-text.
* Deshacer envío y programar envío; alias y "enviar como".

### Fase 3: IA de Triage y Vista "Hoy" *(MVP diferencial)*
* Indexación vectorial inicial de correos recientes.
* **Triage automático** con resumen de una línea, resumen de hilos y tarjetas de datos extraídos.
* Respuestas sugeridas y "Mejorar con IA".
* **Vista "Hoy"** como pantalla de inicio (briefing en la web).
* Capa de seguridad de IA: delimitación de contenido no confiable, política de herramientas por riesgo y **registro de auditoría** desde el inicio.

### Fase 4: Telegram y Proactividad *(cierre del MVP)*
* Configuración del bot de Telegram y vinculación con la cuenta de usuario (vía código OTP de seguridad).
* Procesamiento de comandos por texto y mensajes de voz (Audio to Action).
* Acciones con botones de confirmación (`[Enviar Correo]`, `[Crear Evento]`).
* Cron de notificaciones proactivas: Morning/Evening Briefing, alertas VIP y seguimientos sin respuesta.

### Fase 5: Multi-Calendario, Workspace y Chat Interno de Empresa
* Sincronización de eventos para Google Calendar, Microsoft Graph y calendarios locales/CalDAV.
* Interfaz de calendario en capas con detección de conflictos entre cuentas e invitaciones .ics.
* Motor propio de disponibilidad consolidada (cross-account) y enlaces nativos de reserva.
* **Chat Interno Corporativo en tiempo real (WebSockets):** canales públicos/privados por empresa, DMs y función *"Compartir correo/reunión en chat"* para deliberación en equipo.
* Libreta de contactos (Mini-CRM) y Hub de adjuntos descargados.
* Módulo de Tareas (To-Do), conversión correo ➔ tarea y time-blocking.

### Fase 6: Agente Avanzado y Automatización
* Agente de IA completo con RAG y herramientas (consultas, redacción, agenda).
* **Perfil de estilo** (respuestas en tu tono).
* **Reglas en lenguaje natural**, snooze inteligente, modo Inbox Zero y Modo Foco.
* Minutas automáticas de reuniones.
* Centro de suscripciones y digest semanal de newsletters.

### Fase 7: Pulido, PWA y Ecosistema
* PWA offline-first con cola de acciones y notificaciones push; experiencia móvil con gestos.
* Importación/exportación (mbox, vCard, ICS) y backups.
* Seguimiento de aperturas opcional (con aviso de privacidad).
* Auditoría de accesibilidad WCAG, pruebas de *red teaming* de prompt injection y hardening final.
* Canales adicionales (WhatsApp/Slack) y respuestas por voz.

---

## 10. Resumen de Ideas Incorporadas

| Área | Ideas añadidas |
|---|---|
| **IA productividad** | Triage automático, resumen de línea y de hilos, seguimiento sin respuesta, respuestas en tu tono, tarjetas de datos extraídos, snooze inteligente, Inbox Zero guiado |
| **Workspace** | Arquitectura multi-tenant por empresa, chat interno corporativo en tiempo real (canales y DMs con referencia a correos), Command Palette, enviar programado y deshacer, motor nativo de disponibilidad consolidada (cross-calendar), reglas en lenguaje natural, alias/enviar como, Modo Foco, limpieza de suscripciones e import/export |
| **Seguridad y confianza** | Aislamiento estricto por tenant, defensa contra prompt injection, auditoría de IA, confirmación en acciones sensibles, modo privacidad local, passkeys/WebAuthn, minimización de datos |
| **Telegram / canales** | Respuestas por voz, captura rápida (foto/correo ➔ tarea/evento), botones de snooze/archivo, extensión a WhatsApp/Slack |
| **Técnicas** | Arquitectura multi-tenant con Row-Level Security, WebSockets para chat en tiempo real, PWA offline-first, atajos tipo Vim/Gmail, soporte trilingüe (ES / EN / PT), accesibilidad WCAG |
| **UI/UX** | Selector de 3 temas (Claro, Oscuro, Sistema), layout de 3 paneles + panel contextual, módulo de chat interno, vista "Hoy", redactor flotante, calendario por capas, densidad configurable, gestos móviles, principios de IA en la UI |
