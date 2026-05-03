# Documentación Técnica: AllenMax CRM y Asistente Clínico IA

Esta documentación detalla el funcionamiento actual de todo el ecosistema (CRM + Chatbot + N8n), los flujos de comunicación y los mecanismos de validación de seguridad implementados.

## 1. Arquitectura General

El sistema está compuesto por tres pilares fundamentales que interactúan entre sí:

1. **AllenMax CRM (Backend/Frontend)**: 
   - Desarrollado en Next.js (App Router).
   - Base de datos en Firebase (Firestore).
   - *Nota de Despliegue*: Actualmente en fase de pruebas (testing) utilizando túneles locales (Ngrok). En producción, se alojará directamente en Firebase Console (Firebase Hosting / Cloud Run), por lo que las dependencias o bloqueos relacionados con Ngrok desaparecerán.
   - Expone webhooks (`/api/webhook/n8n`) para que sistemas externos registren mensajes.
   - Expone APIs (`/api/patients/validate`) para comprobaciones de seguridad.

2. **Chatbot (Widget Embed)**:
   - Construido en Vanilla HTML/CSS/JS (`script.js`).
   - Mantiene el estado en el navegador del usuario usando `localStorage` (`SESSION_ID`, `PATIENT_ID`, nombre, teléfono).
   - Renderiza formularios nativos para agendar citas y editar perfiles de forma interactiva.

3. **Motor de Inteligencia Artificial (N8n)**:
   - Orquesta la lógica del LLM (OpenAI) a través de LangChain.
   - Tiene acceso al calendario de la clínica para leer disponibilidad y agendar.
   - Envía copias de la conversación al CRM mediante peticiones HTTP internas.

---

## 2. Flujos de Comunicación

### A. Flujo de Mensajes Regulares
1. El usuario escribe un mensaje en el chatbot.
2. El JavaScript envía un `POST` a la URL de N8n (`WEBHOOK_URL`).
3. N8n procesa la intención con el LLM.
4. **Sincronización**: N8n ejecuta un nodo HTTP que envía una copia del mensaje del usuario y la respuesta de la IA a `CRM_WEBHOOK_URL` (`/api/webhook/n8n`).
5. El endpoint del CRM ejecuta `addMessage()` en Firestore:
   - Si el teléfono está presente, busca al paciente.
   - Si no existe y el Auto-Guardado está activo, crea un nuevo documento en `patients`.
   - Vincula el mensaje a la colección `conversations` y `messages`.

### B. Flujo de Actualización de Perfil y Reservas de Cita
Para evitar latencias y respuestas confusas de la IA, los formularios se manejan en el cliente:
1. El usuario rellena Nombre y Teléfono (en el formulario de perfil o de cita).
2. Al pulsar **Guardar/Enviar**, el JavaScript lanza la validación cruzada (ver sección 3).
3. Si la validación es exitosa:
   - Guarda los datos en `localStorage`.
   - **(Solo en Perfil)** Envía la confirmación visual de forma instantánea al CRM para que el recepcionista vea "Perfil actualizado" en tiempo real sin esperar a n8n.
   - Envía los datos a N8n (`[SISTEMA] El usuario ha actualizado su perfil...` o `Agendar cita para...`).

---

## 3. Validación de Propiedad del Teléfono (Seguridad)

Para evitar que un paciente secuestre el número de otro (ej. "Jake" registrándose con el número de "Javi"), se implementó una verificación pre-vuelo:

### Lógica del Endpoint (`/api/patients/validate`):
Cuando el usuario intenta enviar un formulario, el navegador pregunta al CRM si puede usar ese teléfono.
1. Busca el número en la colección `patients`.
2. **Si no existe:** Permite el registro (devuelve `ok: true`).
3. **Si existe:** Evalúa el "Patient ID" (`clínica_patient_id` de la cookie del navegador).
   - **Mismo Dispositivo:** Si el ID del navegador coincide con el ID del dueño en Firestore, asume que es la misma persona editando sus datos. Permite el cambio.
   - **Distinto Dispositivo:** Si los IDs no coinciden, compara el *Nombre*. Tolera acentos y mayúsculas/minúsculas (ej: "Javi" y "Javier"). Si los nombres coinciden, permite el acceso. **Si no coinciden, bloquea la acción.**

---

## 4. Revisión de "Agujeros" (Puntos Críticos para auditar)

Si el bloqueo de teléfonos ("Jake" usando el teléfono de "Javi" en modo incógnito) no está saltando, aquí están los puntos ciegos o "agujeros" donde la lógica puede estar fallando. Te recomiendo repasar estos 3 puntos mañana:

### Agujero 1: El formato del teléfono en Firestore
Si Javi se registró originalmente pero en Firestore su teléfono se guardó como `+34626209988` (sin espacios) o `626 20 99 88` (sin prefijo), la consulta exacta `where("phone", "==", "+34 626 20 99 88")` devolverá vacío. 
Al devolver vacío, el sistema asume que **el teléfono está libre** y le permite el registro a Jake.
**Comprobación:** Revisa un documento en la colección `patients` en Firebase y verifica cómo están escritos exactamente los espacios y prefijos en el campo `phone`.

### Agujero 2: Fallo silencioso en el navegador (Red/CORS)
El código de validación en el Chatbot tiene un bloque `try...catch`. Si la petición al CRM es interceptada o bloqueada por el navegador (ej: AdBlockers, políticas estrictas de cookies en Incógnito, o fallos del túnel de Ngrok en la fase de testing actual), el chatbot arroja un error en consola y **permite continuar por defecto** para no dejar al paciente varado. 
*(Nota: Cualquier problema relacionado con Ngrok, como su pantalla de advertencia, desaparecerá orgánicamente cuando el CRM se despliegue a producción en Firebase)*.
**Comprobación:** En la ventana de incógnito, pulsa `F12` (Console) antes de pulsar "Enviar". Mira si aparece el texto: *"Validación de teléfono no disponible, continuando..."*. Si es así, significa que la validación no se está haciendo, se está saltando.

### Agujero 3: Retraso en la creación de la Base de Datos
El CRM crea el paciente en Firestore solo cuando recibe un mensaje a través del Webhook de N8n. Si por algún motivo N8n no envió el teléfono correctamente al CRM en la sesión de "Javi", el paciente "Javi" existirá en la memoria de N8n, pero **no en la base de datos del CRM**. Por tanto, al consultar a Firestore, aparecerá vacío.
**Comprobación:** Asegúrate de que "Javi" aparece físicamente en la pestaña de "Pacientes" del CRM con ese número de teléfono asignado, antes de intentar suplantarlo con "Jake".
