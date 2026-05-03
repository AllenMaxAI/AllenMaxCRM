# Plan Maestro: Admin Management Hub (AllenMax CRM)

Este documento detalla la arquitectura y el plan de implementación para el panel central de administración. Este panel es un proyecto independiente diseñado para gestionar el ecosistema de clientes del CRM AllenMax.

## 🎯 Objetivo
Separar la lógica de negocio y administración (altas, bajas, planes, facturación) de la herramienta operativa (Client CRM), garantizando seguridad total y control centralizado.

---

## 🛡️ 1. Seguridad y Acceso (Admin Tier)
La cuenta maestra `agency@allenmax.com` debe tener privilegios de **Super-Admin** a nivel de infraestructura.

*   **Autenticación**: Firebase Auth con Custom Claims (`admin: true`).
*   **MFA Obligatorio**: Segundo factor de autenticación vía SMS o App (Authenticator) para el acceso al Hub.
*   **Gestión de Credenciales**: Capacidad de reseteo de contraseña con envío de notificación por Email y SMS.

---

## 🏛️ 2. Arquitectura de Datos (Estructura Multitenant)

El Admin Hub se conectará a la misma instancia de Firestore pero con una vista global:

### Colección Maestra: `/users`
Cada documento de usuario en el CRM de clientes tendrá metadatos de administración:
```json
{
  "uid": "ID_UNICO",
  "email": "doctor@clinica.com",
  "admin_metadata": {
    "plan": "basic | pro | elite",
    "status": "active | suspended | pending",
    "onboarding_date": "ISO_TIMESTAMP",
    "last_billing_date": "ISO_TIMESTAMP",
    "total_revenue": 0.00,
    "features_enabled": ["calls", "ai_sync", "bulk_sms"]
  },
  "clinic_profile": {
    "name": "Nombre Clínica",
    "address": "...",
    "phone": "..."
  }
}
```

---

## 🚀 3. Funcionalidades del Panel Maestro

### A. Gestión de Clientes (CRUD)
*   **Alta de Clínica**: Formulario para crear un nuevo usuario. Al guardar, se dispara una función que inicializa la estructura de carpetas privada (`/users/{uid}/patients`, etc.).
*   **Baja/Suspensión**: Interruptor para desactivar el acceso de un cliente sin borrar sus datos (modo "Solo Lectura" o "Bloqueo").
*   **Reset de Credenciales**: Botón para forzar el cambio de contraseña del cliente con notificación automática.

### B. Control de Planes (Tiering)
Definición de límites por plan:
1.  **Plan Básico**: Gestión de pacientes y calendario manual.
2.  **Plan Pro**: Incluye IA de autoguardado y sincronización básica.
3.  **Plan Elite**: Acceso total, llamadas Retell AI (Elite Account), y soporte prioritario.

### C. Analytics de Negocio
*   **Métrica de Tiempo**: Contador de días activos desde `onboarding_date`.
*   **Métrica de Gasto**: Seguimiento de costos de API (Retell, OpenAI) por cada cliente para calcular el margen y gasto real.

---

## 🔌 4. Integración con Client CRM

Para que ambos proyectos funcionen en armonía:

1.  **Desactivación de Registro Público**:
    *   En el código del Client CRM, la ruta `/register` debe ser eliminada o redirigida al login.
    *   Nadie puede crear una cuenta si no es a través del Admin Hub.
2.  **API de Aprovisionamiento**:
    *   El Admin Hub utiliza el SDK de `firebase-admin` para crear usuarios sin necesidad de cerrar la sesión del administrador.
3.  **Sincronización de Estado**:
    *   El Client CRM consulta el campo `status` al iniciar sesión. Si es `suspended`, redirige a una página de "Contacto con Soporte".

---

## 🛠️ 5. Stack Tecnológico Recomendado
*   **Framework**: Next.js 14+ (App Router).
*   **UI Library**: Shadcn/UI + Framer Motion (Manteniendo la estética "Elite" y oscura de AllenMax).
*   **Backend**: Firebase Admin SDK (Node.js).
*   **Notificaciones**: Twilio (SMS) + SendGrid/Firebase Email (Correos).

---

## 📅 Próximos Pasos para la IA / Desarrollador:
1.  Configurar un nuevo proyecto Next.js para el Admin Hub.
2.  Vincular el SDK de Firebase Admin con las credenciales de `crm-allenmax`.
3.  Implementar la tabla de visualización global de `/users`.
4.  Crear la lógica de "Shadow Login" para entrar en las cuentas de los clientes.

---
**Documento de Planificación Técnica - AllenMax Agency 2024**
