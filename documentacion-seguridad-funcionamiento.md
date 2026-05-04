# Documento Técnico: Seguridad y Funcionamiento del CRM AllenMax

Este documento detalla el funcionamiento técnico y las medidas de seguridad implementadas en el ecosistema del CRM AllenMax, diseñado específicamente para la gestión inteligente de clínicas dentales mediante Inteligencia Artificial.

---

## 1. Funcionamiento del Sistema

El ecosistema AllenMax se compone de tres pilares fundamentales que interactúan en tiempo real:

1. **Agentes de Inteligencia Artificial (Voz y Texto):**
   * **Voz (Retell AI):** Un agente conversacional telefónico capaz de atender llamadas entrantes, agendar citas y extraer información clave del paciente con una latencia mínima.
   * **Texto (n8n / WhatsApp / Web):** Un asistente de texto automatizado que atiende consultas escritas, integrándose con WhatsApp y el widget web.
2. **Plataforma CRM Central (Next.js):**
   * Aplicación web alojada en **Vercel** que centraliza toda la información. Los recepcionistas y administradores pueden visualizar pacientes, escuchar grabaciones de llamadas, leer transcripciones, ver resúmenes generados por IA y gestionar el calendario de citas.
3. **Base de Datos y Sincronización en Tiempo Real (Firebase):**
   * Toda la información (pacientes, citas, historiales de chat y llamadas) se almacena y sincroniza en tiempo real utilizando **Google Cloud Firestore**. Cuando la IA agenda una cita por teléfono o WhatsApp, el calendario del CRM se actualiza instantáneamente en la pantalla del administrador.

---

## 2. Medidas de Seguridad y Privacidad de Datos

El sistema ha sido diseñado priorizando la seguridad y la confidencialidad de la información médica y personal de los pacientes.

### 2.1. Autenticación y Control de Acceso
* **Autenticación Segura (Firebase Auth):** El acceso al panel del CRM está restringido. Utiliza el sistema de autenticación de Google de nivel empresarial, asegurando que solo el personal autorizado de la clínica pueda acceder a los datos.
* **Dominios Restringidos:** El inicio de sesión está limitado criptográficamente para que solo pueda ejecutarse desde los dominios oficiales de la clínica (ej. `allenmaxcrm.com`), bloqueando intentos de acceso desde ubicaciones no autorizadas.

### 2.2. Seguridad de Base de Datos y Reglas de Firestore
* **Reglas de Seguridad Estrictas:** La base de datos (Firestore) tiene reglas de seguridad configuradas a nivel de servidor. Ningún dato puede ser leído o escrito sin un token de autenticación válido proporcionado por un usuario con sesión iniciada.
* **Aislamiento de Datos (Multi-tenant):** Cada clínica u organización opera dentro de su propio espacio aislado (`clinic_id`), garantizando que los datos de diferentes clínicas no se mezclen ni sean accesibles entre sí.

### 2.3. Protección de APIs y Webhooks
* **Autenticación por API Keys:** Las comunicaciones entre la IA (Retell / n8n) y el CRM están protegidas mediante claves secretas exclusivas (`x-api-key` y `x-webhook-secret`). Cualquier petición a los servidores sin esta llave es rechazada automáticamente con un error 401 (Unauthorized).
* **Políticas CORS (Cross-Origin Resource Sharing):** Los endpoints públicos (como los usados por el Chatbot Web) tienen políticas CORS estrictas que solo permiten peticiones provenientes de las URLs aprobadas (ej. la web de la clínica).

### 2.4. Encriptación y Cumplimiento
* **Tráfico Encriptado (HTTPS/SSL):** Absolutamente todo el tráfico entre los pacientes, la IA, el CRM y las bases de datos viaja encriptado mediante certificados SSL/TLS de grado bancario.
* **Infraestructura Confiable:** Al utilizar la infraestructura de Google Cloud (Firebase) y Vercel, el sistema se beneficia del cumplimiento de normativas internacionales de seguridad de datos (como GDPR e HIPAA), garantizando que la información se almacena de forma redundante y segura.
* **Prevención de Suplantación de Identidad:** El sistema incorpora lógica para evitar la sobrescritura de pacientes. Si un usuario distinto intenta agendar una cita usando el número de teléfono de un paciente existente pero con un nombre diferente, la IA detecta la anomalía para prevenir fugas de información.

---
*Documento generado para la presentación y demostración del sistema AllenMax.*
