from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from enum import Enum
from typing import List, Optional, Tuple, Dict, Any
import json
import os
from app.api.deps import get_current_user
from openai import AsyncOpenAI
from app.core.config import settings
import dotenv
import logging

# Configure logging
logger = logging.getLogger(__name__)
# Aumentar el nivel de detalle del logging
logger.setLevel(logging.DEBUG)

router = APIRouter(tags=["AI Workout Recommendations"])

class DifficultyLevel(str, Enum):
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"

class MuscleGroup(str, Enum):
    CHEST = "Chest"
    BACK = "Back"
    SHOULDERS = "Shoulders"
    BICEPS = "Biceps"
    TRICEPS = "Triceps"
    LEGS = "Legs"
    CORE = "Core"
    GLUTES = "Glutes"
    FOREARMS = "Forearms"
    CALVES = "Calves"

class WorkoutRecommendationRequest(BaseModel):
    difficulty_level: DifficultyLevel
    muscle_groups: List[MuscleGroup]
    duration: int
    include_cardio: bool
    username: Optional[str] = "Usuario"

class ExerciseRecommendation(BaseModel):
    name: str
    sets: int
    reps: str
    restSeconds: int
    notes: Optional[str] = None

class WorkoutRecommendation(BaseModel):
    name: str
    description: str
    workoutType: str
    estimatedDuration: int
    muscleGroups: List[MuscleGroup]
    exercises: List[ExerciseRecommendation]
    notes: Optional[str] = None

class WorkoutRecommendationResponse(BaseModel):
    recommendations: str

class OpenRouterClient:
    """
    Cliente para manejar las peticiones a OpenRouter
    """
    def __init__(self):
        self.api_key = None
        self.api_key_source = None
        self.base_url = "https://openrouter.ai/api/v1"
        self.referer = "https://www.presentandflow.cl/"
        self.title = "SoulDream Workout Recommendations"
        self.model = "mistralai/mistral-7b-instruct"
        
        # Inicializar la API key
        self._initialize_api_key()

    def _initialize_api_key(self) -> None:
        """
        Inicializa la API key intentando diferentes fuentes
        """
        # 1. Intentar desde .env
        env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))), '.env')
        logger.info(f"Intentando cargar API key desde: {env_path}")
        dotenv.load_dotenv(env_path)
        
        try:
            with open(env_path, 'r') as f:
                env_content = f.read()
                for line in env_content.split('\n'):
                    if line.startswith('OPENROUTER_API_KEY='):
                        self.api_key = line.split('=', 1)[1].strip().strip('"').strip("'")
                        self.api_key_source = '.env file'
                        logger.info("API key encontrada en archivo .env")
                        return
        except Exception as e:
            logger.error(f"Error leyendo archivo .env: {str(e)}")

        # 2. Intentar desde settings
        try:
            settings_key = settings.OPENROUTER_API_KEY
            if settings_key:
                self.api_key = settings_key
                self.api_key_source = 'settings'
                logger.info("API key encontrada en settings")
                return
        except Exception as e:
            logger.error(f"Error obteniendo API key desde settings: {str(e)}")

        logger.error("No se encontró API key en ninguna fuente")

    def check_api_key_status(self) -> Tuple[bool, str]:
        """
        Verifica el estado de la API key
        
        Returns:
            Tuple[bool, str]: (está_configurada, mensaje_de_estado)
        """
        if not self.api_key:
            return False, "API key no configurada"
        
        return True, f"API key configurada (fuente: {self.api_key_source})"

    async def _create_client(self) -> AsyncOpenAI:
        """
        Crea un cliente de OpenAI con la configuración correcta
        """
        is_configured, status = self.check_api_key_status()
        if not is_configured:
            raise ValueError(status)
            
        headers = {
            "HTTP-Referer": self.referer,
            "X-Title": self.title
        }
        
        return AsyncOpenAI(
            api_key=self.api_key,
            base_url=self.base_url,
            default_headers=headers
        )

    async def _send_request(self, messages: List[Dict[str, str]], temperature: float = 0.7, max_tokens: int = 2000, stream: bool = False) -> Any:
        """
        Envía una solicitud a la API de OpenRouter
        """
        if not self.api_key:
            raise ValueError("OpenRouter API key no configurada")
            
        client = await self._create_client()
        
        try:
            response = await client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=stream,
                extra_body={
                    "provider": {
                        "order": ["Groq", "Fireworks"],
                        "allow_fallbacks": True
                    }
                }
            )
            
            return response
        except Exception as e:
            logger.error(f"Error en OpenRouter API: {str(e)}")
            raise
        finally:
            await client.close()

@router.post("/workout-recommendations", response_model=WorkoutRecommendationResponse)
async def generate_workout_recommendations(
    request: WorkoutRecommendationRequest,
    current_user = Depends(get_current_user)
):
    try:
        # Debug logging
        logger.debug(f"Received workout recommendations request for user: {current_user.id if current_user else 'No user'}")
        logger.debug(f"Request data: {request.dict()}")
        
        # Verificación de autenticación
        if not current_user:
            logger.error("No user found in request")
            raise HTTPException(
                status_code=401,
                detail="No se encontró información del usuario"
            )
            
        logger.debug(f"User authenticated successfully: {current_user.id}")
        
        # Inicializar el cliente OpenRouter
        client_manager = OpenRouterClient()
        is_configured, status = client_manager.check_api_key_status()
        
        if not is_configured:
            logger.error(status)
            raise HTTPException(
                status_code=500,
                detail="Error de configuración de API: " + status
            )
            
        logger.debug(f"OpenRouter client configured: {status}")

        # Creamos un prompt más directo y estructurado
        muscle_groups_str = ", ".join(request.muscle_groups)
        
        prompt = f"""[INSTRUCCIÓN]
Genera exactamente 3 planes de entrenamiento en JSON. NO INCLUYAS EXPLICACIONES.

DATOS:
Usuario: {request.username}
Nivel: {request.difficulty_level.value}
Músculos: {muscle_groups_str}
Duración: {request.duration} min
Cardio: {"Sí" if request.include_cardio else "No"}

FORMATO REQUERIDO:
[
  {{
    "name": "Nombre corto",
    "description": "Descripción breve",
    "workoutType": "Fuerza",
    "estimatedDuration": {request.duration},
    "muscleGroups": ["{muscle_groups_str}"],
    "exercises": [
      {{
        "name": "Ejercicio",
        "sets": 3,
        "reps": "12",
        "restSeconds": 60,
        "notes": "Nota técnica"
      }}
    ],
    "notes": "Notas generales"
  }}
]

REGLAS:
1. SOLO devuelve el JSON, sin texto adicional
2. Todo en ESPAÑOL
3. 4-6 ejercicios por plan
4. NO uses backticks (```)
[/INSTRUCCIÓN]"""
        
        logger.debug("Prompt created, calling OpenRouter API...")
        
        try:
            response = await client_manager._send_request(
                messages=[
                    {"role": "system", "content": "Eres un API que SOLO genera JSON de planes de entrenamiento. NO des explicaciones ni razonamientos."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,  # Reducimos la temperatura para respuestas más consistentes
                max_tokens=2000,
                stream=False
            )
            
            logger.debug("Response received from API")
            
            # Log the complete response object for debugging
            logger.debug(f"Complete API response object: {response}")
            
            # Verificar si tenemos una respuesta válida
            if not response or not response.choices or not response.choices[0].message:
                logger.error("Respuesta de API inválida o vacía")
                raise ValueError("La API no devolvió una respuesta válida")
            
            # Procesamos la respuesta para asegurar que es JSON válido
            raw_content = response.choices[0].message.content
            logger.debug(f"Raw content from API: {raw_content}")  # Log contenido completo
            
            if not raw_content or not raw_content.strip():
                logger.error("Contenido de respuesta vacío")
                raise ValueError("La API devolvió una respuesta vacía")
            
            content = raw_content.strip()
            
            # Si está envuelto en backticks de markdown, quitarlos
            if content.startswith("```json") and content.endswith("```"):
                content = content[7:-3].strip()
            elif content.startswith("```") and content.endswith("```"):
                content = content[3:-3].strip()
                
            logger.debug(f"Cleaned content before JSON parsing: {content}")
                
            # Intentar validar el JSON
            try:
                parsed_json = json.loads(content)
                logger.debug("Successfully parsed JSON response")
                
                # Validación adicional para asegurar formato correcto
                if isinstance(parsed_json, list) and len(parsed_json) > 0:
                    logger.debug(f"JSON validation passed: found {len(parsed_json)} recommendations")
                    return WorkoutRecommendationResponse(recommendations=content)
                else:
                    logger.error(f"JSON validation failed: unexpected format")
                    raise ValueError("Formato de respuesta inesperado")
                    
            except json.JSONDecodeError as json_err:
                logger.error(f"Error parsing JSON response: {str(json_err)}")
                # Intentar limpiar el contenido para recuperar JSON válido
                content = content.strip()
                # Buscar el inicio y fin del array JSON
                start_idx = content.find('[')
                end_idx = content.rfind(']') + 1
                
                if start_idx >= 0 and end_idx > start_idx:
                    cleaned_json = content[start_idx:end_idx]
                    try:
                        json.loads(cleaned_json)
                        logger.debug("JSON recuperado después de limpieza")
                        return WorkoutRecommendationResponse(recommendations=cleaned_json)
                    except:
                        logger.error("No se pudo recuperar JSON válido después de limpieza")
                
                raise ValueError("No se pudo obtener JSON válido de la respuesta")
                
        except Exception as e:
            logger.error(f"Error calling OpenRouter API: {str(e)}")
            raise ValueError(f"Error en la llamada a la API: {str(e)}")
            
    except Exception as e:
        logger.error(f"Unexpected error in workout recommendations: {str(e)}")
        # Ya no hacemos fallback a mock automáticamente
        raise HTTPException(status_code=500, detail=f"Error al generar recomendaciones de entrenamiento: {str(e)}")

# Mantener el endpoint mock pero separado, para pruebas
@router.post("/workout-recommendations-mock", response_model=WorkoutRecommendationResponse)
async def generate_workout_recommendations_mock(
    request: WorkoutRecommendationRequest,
    current_user = Depends(get_current_user)
):
    """
    Endpoint alternativo que devuelve datos mock para pruebas
    """
    try:
        # Verificación básica de autenticación
        if not current_user or not current_user.id:
            raise HTTPException(
                status_code=401, 
                detail="Usuario no autenticado o token inválido"
            )
        
        # Datos mock según el nivel de dificultad y grupos musculares
        difficulty = request.difficulty_level.value
        muscle_groups = request.muscle_groups
        
        # Crear una respuesta mock formateada como JSON con 3 planes de entrenamiento
        mock_response = f'''[
  {{
    "name": "Entrenamiento {difficulty} de {', '.join(muscle_groups)} - Plan A",
    "description": "Rutina personalizada para trabajar {', '.join(muscle_groups)} con nivel {difficulty}",
    "workoutType": "Fuerza",
    "difficultyLevel": "{difficulty}",
    "estimatedDuration": {request.duration},
    "muscleGroups": {json.dumps(muscle_groups)},
    "exercises": [
      {{
        "name": "Press de banca",
        "sets": 3,
        "reps": "10-12",
        "restSeconds": 60,
        "notes": "Mantén los codos a 45 grados del cuerpo"
      }},
      {{
        "name": "Sentadillas",
        "sets": 4,
        "reps": "8-10",
        "restSeconds": 90,
        "notes": "Mantén la espalda recta y las rodillas alineadas con los pies"
      }},
      {{
        "name": "Remo con barra",
        "sets": 3,
        "reps": "10-12",
        "restSeconds": 60,
        "notes": "Mantén la espalda recta y tira la barra hacia el abdomen"
      }}
    ],
    "notes": "Asegúrate de calentar adecuadamente antes de comenzar y estirar al finalizar"
  }},
  {{
    "name": "Entrenamiento {difficulty} de {', '.join(muscle_groups)} - Plan B",
    "description": "Rutina alternativa para trabajar {', '.join(muscle_groups)} con nivel {difficulty}",
    "workoutType": "HIIT",
    "difficultyLevel": "{difficulty}",
    "estimatedDuration": {request.duration},
    "muscleGroups": {json.dumps(muscle_groups)},
    "exercises": [
      {{
        "name": "Flexiones explosivas",
        "sets": 4,
        "reps": "8-10",
        "restSeconds": 45,
        "notes": "Explota hacia arriba y controla la bajada"
      }},
      {{
        "name": "Zancadas con salto",
        "sets": 3,
        "reps": "12 por pierna",
        "restSeconds": 60,
        "notes": "Alterna las piernas y mantén el equilibrio"
      }},
      {{
        "name": "Dominadas supinas",
        "sets": 3,
        "reps": "máximo posible",
        "restSeconds": 90,
        "notes": "Utiliza banda elástica si es necesario para asistencia"
      }}
    ],
    "notes": "Este entrenamiento es de alta intensidad, toma suficiente agua entre series"
  }},
  {{
    "name": "Entrenamiento {difficulty} de {', '.join(muscle_groups)} - Plan C",
    "description": "Rutina enfocada en resistencia para {', '.join(muscle_groups)} con nivel {difficulty}",
    "workoutType": "Cardio",
    "difficultyLevel": "{difficulty}",
    "estimatedDuration": {request.duration},
    "muscleGroups": {json.dumps(muscle_groups)},
    "exercises": [
      {{
        "name": "Circuito de fondos",
        "sets": 3,
        "reps": "12-15",
        "restSeconds": 30,
        "notes": "Realiza los fondos controlando el movimiento"
      }},
      {{
        "name": "Mountain climbers",
        "sets": 4,
        "reps": "30 segundos",
        "restSeconds": 30,
        "notes": "Mantén el core activado durante todo el ejercicio"
      }},
      {{
        "name": "Burpees",
        "sets": 3,
        "reps": "10",
        "restSeconds": 45,
        "notes": "Realiza el movimiento completo a un ritmo constante"
      }}
    ],
    "notes": "Ideal para mejorar la resistencia muscular y cardiovascular"
  }}
]'''
        
        return WorkoutRecommendationResponse(recommendations=mock_response)
    except Exception as e:
        logger.error(f"Error generating mock workout recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating mock workout recommendations: {str(e)}")