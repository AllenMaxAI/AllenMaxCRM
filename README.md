# 🦷 DentalFlow CRM

Este es un CRM moderno para clínicas dentales construido con Next.js, React, Tailwind CSS y Genkit AI.

## 🚀 Guía de Exportación Manual (Paso a Paso)

Si no puedes descargar el ZIP, sigue estas instrucciones directamente desde tu terminal local:

### 1. Crear el proyecto base
```bash
npx create-next-app@latest . --typescript --tailwind --eslint
```
*(Selecciona "Yes" a todas las opciones)*

### 2. Instalar dependencias
```bash
npm install lucide-react clsx tailwind-merge date-fns zod react-hook-form @hookform/resolvers @radix-ui/react-dialog @radix-ui/react-label @radix-ui/react-toast @radix-ui/react-tabs @radix-ui/react-badge @radix-ui/react-avatar @radix-ui/react-scroll-area @radix-ui/react-separator @radix-ui/react-dropdown-menu firebase genkit @genkit-ai/google-genai
```

### 3. Copiar archivos
Copia el contenido de cada archivo desde este editor a tu carpeta local, respetando la misma estructura de carpetas (`src/app/...`, `src/components/...`, etc.).

### 4. Subir a GitHub
```bash
git init
git add .
git commit -m "Carga inicial"
git branch -M main
git remote add origin TU_URL_DE_GITHUB
git push -u origin main
```

## ☁️ Importar en Google Antigravity
Una vez en GitHub, ve a tu consola de **Google Cloud Antigravity**, selecciona **"Import from GitHub"** y elige este repositorio. El sistema detectará automáticamente Next.js.
