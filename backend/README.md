# SoulDream API

API backend para la plataforma SoulDream, desarrollada con FastAPI y Supabase.

## Características

- Autenticación de usuarios con JWT y Supabase Auth
- Gestión de tareas con sistema Kanban
- Gestión de finanzas personales
- Chat con IA usando OpenRouter

## Requisitos

- Python 3.9+
- Cuenta en Supabase
- Cuenta en OpenRouter (para la funcionalidad de IA)

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/souldream.git
cd souldream/backend
```

2. Crear un entorno virtual:
```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

3. Instalar dependencias:
```bash
pip install -r requirements.txt
```

4. Configurar variables de entorno:
   - Copia el archivo `.env.example` a `.env`
   - Completa las variables con tus credenciales

## Ejecución

Para iniciar el servidor de desarrollo:

```bash
uvicorn app.main:app --reload
```

El servidor estará disponible en http://localhost:8000

## Documentación de la API

Una vez que el servidor esté en ejecución, puedes acceder a la documentación interactiva de la API en:

- Swagger UI: http://localhost:8000/api/v1/docs
- ReDoc: http://localhost:8000/api/v1/redoc

## Estructura del proyecto

```
backend/
├── app/
│   ├── api/
│   │   ├── endpoints/       # Endpoints de la API
│   │   └── api.py           # Router principal
│   ├── core/                # Configuración central
│   ├── db/                  # Conexión a la base de datos
│   ├── models/              # Modelos de datos
│   ├── schemas/             # Esquemas Pydantic
│   ├── services/            # Servicios y lógica de negocio
│   ├── utils/               # Utilidades
│   └── main.py              # Punto de entrada
├── .env                     # Variables de entorno
├── .env.example             # Ejemplo de variables de entorno
└── requirements.txt         # Dependencias
```

## Endpoints principales

- `/api/v1/auth`: Autenticación y gestión de usuarios
- `/api/v1/tasks`: Gestión de tareas
- `/api/v1/finance`: Gestión de finanzas
- `/api/v1/ai`: Chat con IA 