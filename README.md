# SoulDream AI - Plataforma All-in-One para Gestión Personal

SoulDream AI es una plataforma integral para la gestión personal que combina tareas, hábitos, finanzas, fitness y más en una sola aplicación, potenciada por inteligencia artificial.

## Características principales

- **Dashboard centralizado**: Visualiza todas tus métricas personales en un solo lugar
- **Gestión de tareas**: Organiza tus tareas con un sistema Kanban intuitivo
- **Seguimiento de hábitos**: Desarrolla hábitos positivos y mantén rachas
- **Gestión financiera**: Controla tus finanzas, gastos y metas de ahorro
- **Seguimiento fitness**: Registra tus entrenamientos y progreso físico
- **Chat con IA**: Recibe recomendaciones personalizadas y coaching
- **Calendario integrado**: Visualiza todos tus eventos y tareas en un calendario unificado
- **Analítica personal**: Obtén insights sobre tus patrones y progreso
- **Autenticación completa**: Sistema de autenticación con Supabase (email, Google, etc.)

## Tecnologías utilizadas

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- Framer Motion
- Shadcn/UI
- Lucide Icons
- Zustand
- React Query
- date-fns
- Supabase Auth Helpers

### Backend
- FastAPI (Python)
- Supabase (Auth, Database, Storage)
- OpenRouter para modelos de IA
- JWT para autenticación
- Pydantic para validación de datos

## Estructura del proyecto

```
souldream-ai/
├── frontend/               # Aplicación Next.js
│   ├── src/
│   │   ├── app/            # App Router de Next.js
│   │   ├── components/     # Componentes React
│   │   ├── hooks/          # Hooks personalizados
│   │   ├── lib/            # Utilidades y servicios
│   │   ├── providers/      # Proveedores de contexto
│   │   ├── store/          # Estado global (Zustand)
│   │   └── types/          # Definiciones TypeScript
│   └── public/             # Archivos estáticos
├── backend/                # API FastAPI
│   ├── app/
│   │   ├── api/            # Endpoints de la API
│   │   ├── core/           # Configuración central
│   │   ├── db/             # Conexión a la base de datos
│   │   ├── models/         # Modelos de datos
│   │   ├── schemas/        # Esquemas Pydantic
│   │   ├── services/       # Servicios y lógica de negocio
│   │   └── utils/          # Utilidades
│   └── requirements.txt    # Dependencias del backend
└── supabase-init.sql       # Script para inicializar Supabase
```

## Instalación y configuración

### Requisitos previos
- Node.js 18+
- Python 3.9+
- npm o yarn
- Cuenta en Supabase
- Cuenta en OpenRouter (para la funcionalidad de IA)

### Configuración de Supabase

1. Crea una cuenta en [Supabase](https://supabase.com/) si aún no tienes una.
2. Crea un nuevo proyecto en Supabase.
3. En la sección SQL Editor, ejecuta el script `supabase-init.sql` incluido en este repositorio para crear las tablas necesarias.
4. En la sección Authentication > Settings, configura los proveedores de autenticación que desees (Email, Google, etc.).
5. En la sección Settings > API, copia las credenciales `URL` y `anon key` para usarlas en tu archivo `.env.local`.

### Configuración del Frontend

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/souldream-ai.git
cd souldream-ai
```

2. Instalar dependencias del frontend:
```bash
cd frontend
npm install
```

3. Configurar variables de entorno:
   - Crea un archivo `.env.local` en la carpeta `frontend` con las siguientes variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima-de-supabase
   NEXT_PUBLIC_API_URL=http://localhost:8000
   OPENROUTER_API_KEY=tu-clave-de-openrouter (opcional)
   ```

4. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

5. Abrir [http://localhost:3000](http://localhost:3000) en tu navegador

### Configuración del Backend

1. Instalar dependencias del backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. Configurar variables de entorno:
   - Crea un archivo `.env` en la carpeta `backend` con las siguientes variables:
   ```
   SUPABASE_URL=tu-url-de-supabase
   SUPABASE_KEY=tu-clave-de-servicio-de-supabase
   OPENROUTER_API_KEY=tu-clave-de-openrouter (opcional)
   JWT_SECRET=un-secreto-seguro-para-jwt
   ```

3. Iniciar el servidor de desarrollo:
```bash
uvicorn app.main:app --reload
```

4. La API estará disponible en [http://localhost:8000](http://localhost:8000)
5. La documentación de la API estará disponible en [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)

## Estado del Proyecto

Actualmente, el proyecto tiene implementado:
- Autenticación completa con Supabase (email, Google)
- Estructura básica del frontend con Next.js
- Componentes principales para el dashboard
- Módulos de tareas, finanzas y chat con IA
- Backend con FastAPI

## Próximos Pasos

- Implementar políticas RLS en Supabase
- Completar el perfil de usuario
- Desarrollar el tablero Kanban para tareas
- Implementar el módulo de finanzas completo
- Integrar el chat con IA con OpenRouter
- Desarrollar el calendario integrado
- Crear el sistema de analítica personal
- Implementar el sistema de suscripciones

## Contribuir

Las contribuciones son bienvenidas. Por favor, sigue estos pasos:

1. Haz fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Haz commit de tus cambios (`git commit -m 'Add some amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## Contacto

Tu Nombre - [@tu_twitter](https://twitter.com/tu_twitter) - email@ejemplo.com

Link del proyecto: [https://github.com/tu-usuario/souldream-ai](https://github.com/tu-usuario/souldream-ai) 