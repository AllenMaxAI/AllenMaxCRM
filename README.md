# 🦷 DentalFlow CRM

Este es un CRM moderno para clínicas dentales construido con Next.js, React, Tailwind CSS y Genkit AI. Diseñado para desplegarse en **Google Cloud Antigravity**.

## 🚀 Guía de Despliegue (Paso a Paso)

### Opción A: Descarga automática (Recomendado)
1. Descarga el proyecto como ZIP desde el editor.
2. Descomprímelo y sigue los pasos de "Subir a GitHub".

### Opción B: Configuración Manual (Si falla el ZIP)
Si no puedes descargar el ZIP, sigue estos pasos en tu ordenador:

1. **Crea la carpeta del proyecto:**
   ```bash
   mkdir dentalflow-crm
   cd dentalflow-crm
   ```
2. **Inicializa el proyecto de Next.js:**
   ```bash
   npx create-next-app@latest . --typescript --tailwind --eslint
   ```
   *(Responde "Yes" a todo)*
3. **Copia el contenido:** Ve copiando el código de cada archivo desde este editor a los archivos correspondientes en tu carpeta local.
4. **Instala las dependencias adicionales:**
   ```bash
   npm install lucide-react clsx tailwind-merge date-fns zod react-hook-form @hookform/resolvers @radix-ui/react-dialog @radix-ui/react-label @radix-ui/react-toast @radix-ui/react-tabs @radix-ui/react-badge @radix-ui/react-avatar @radix-ui/react-scroll-area @radix-ui/react-separator @radix-ui/react-dropdown-menu firebase genkit @genkit-ai/google-genai
   ```

## 📤 Cómo subir a GitHub

Una vez tengas los archivos en tu carpeta local:

1. Crea un repositorio en [GitHub](https://github.com/new) (ej: `dentalflow-crm`).
2. En tu terminal local, dentro de la carpeta del proyecto:
   ```bash
   git init
   git add .
   git commit -m "Carga inicial de DentalFlow CRM"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   git push -u origin main
   ```

## ☁️ Importar en Google Antigravity
1. Ve a tu consola de **Google Cloud Antigravity**.
2. Haz clic en **"Import from GitHub"**.
3. Selecciona tu repositorio `dentalflow-crm`.
4. El sistema detectará automáticamente Next.js. Haz clic en **Deploy**.

---
*Desarrollado con ❤️ para clínicas dentales modernas.*
