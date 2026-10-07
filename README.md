# LIFEOS - Mi Sistema Operativo Personal

LIFEOS es un sistema personal de productividad y organización integral diseñado para gestionar **Estudios, Gym, Deporte, Hábitos, Objetivos, Proyectos, Startup y Progreso Personal**.

## Tecnologías Utilizadas

- **HTML5 & CSS3 Vanilla**: Interfaz tipo SaaS Dark Mode, responsiva y fluida.
- **JavaScript Vanilla**: Módulos ES sin frameworks pesados ni TypeScript para fácil aprendizaje.
- **Supabase**: Autenticación de Usuarios, PostgreSQL con **Row Level Security (RLS)**.
- **Chart.js**: Gráficos interactivos de rendimiento personal.
- **Vercel**: Despliegue estático ultra-rápido.

---

## Guía de Configuración Inicial (Supabase)

1. Crea un proyecto en [Supabase](https://supabase.com).
2. Ve al **SQL Editor** en tu panel de Supabase y copia/pega el contenido del archivo [`schema.sql`](./schema.sql). Ejecuta el script.
3. En la sección **Project Settings > API**, copia la `URL` y la `anon/public key`.
4. Abre `js/config.js` e ingresa tus credenciales:
   ```javascript
   export const SUPABASE_URL = "https://tu-proyecto.supabase.co";
   export const SUPABASE_ANON_KEY = "tu-anon-key-aqui";
   ```

*Nota: La aplicación incluye un modo Demo/Fallback local con `localStorage` automático si no has configurado aún tus credenciales de Supabase.*

---

## Ejecución Local y Despliegue en Vercel

### Localmente
Puedes abrir `index.html` directamente en tu navegador o usar la extensión **Live Server** en VS Code o ejecutar:
```bash
npx serve .
```

### Despliegue en Vercel
1. Instala la CLI de Vercel (opcional) o conecta tu repositorio de GitHub a Vercel.
2. Vercel detectará la configuración en [`vercel.json`](./vercel.json) y desplegará la aplicación inmediatamente.

---

## Estructura del Código

- `index.html`: Estructura SPA y contenedores modales.
- `style.css`: Sistema de diseño SaaS Dark Mode, animaciones y responsive design.
- `js/app.js`: Orquestador de la aplicación y enrutador.
- `js/modules/`: Lógica de cada módulo (Tareas, Objetivos, Hábitos, Pomodoro, Gym, Deporte, Estudios, Proyectos, Startup, Estadísticas).
- `schema.sql`: Definición de tablas, relaciones, políticas RLS y triggers de PostgreSQL.
