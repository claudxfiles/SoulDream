from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from enum import Enum
from typing import List, Optional
import json
import os
from app.api.deps import get_current_user
from openai import AsyncOpenAI
from app.core.config import settings
import dotenv
import logging

# Configure logging
logger = logging.getLogger(__name__)

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

@router.post("/workout-recommendations", response_model=WorkoutRecommendationResponse)
async def generate_workout_recommendations(
    request: WorkoutRecommendationRequest,
    current_user = Depends(get_current_user)
):
    try:
        # Debug logging
        logger.info(f"Received workout recommendations request for user: {current_user.id if current_user else 'No user'}")
        logger.info(f"Request data: {request.dict()}")
        
        # Verificación de autenticación
        if not current_user:
            logger.error("No user found in request")
            raise HTTPException(
                status_code=401,
                detail="No se encontró información del usuario"
            )
            
        logger.info(f"User authenticated successfully: {current_user.id}")
            
        # Verificar si tenemos la API key disponible - leer directamente del archivo .env
        # Cargar .env manualmente
        env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))), '.env')
        logger.info(f"Loading .env from: {env_path}")
        dotenv.load_dotenv(env_path)
        
        # Leer API key directamente del archivo
        try:
            with open(env_path, 'r') as f:
                env_content = f.read()
                # Buscar la línea con OPENROUTER_API_KEY
                for line in env_content.split('\n'):
                    if line.startswith('OPENROUTER_API_KEY='):
                        api_key = line.split('=', 1)[1].strip()
                        logger.info("API key found in .env file")
                        break
                else:
                    api_key = ""
        except Exception as e:
            logger.error(f"Error reading .env file: {str(e)}")
            api_key = ""
            
        # Si no encontramos la clave, intentar desde settings
        if not api_key:
            api_key = settings.OPENROUTER_API_KEY
            
        if not api_key:
            logger.error("No API key found")
            return await generate_workout_recommendations_mock(request, current_user)
            
        # Crear cliente bajo demanda
        try:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "HTTP-Referer": "https://www.presentandflow.cl/",
                "X-Title": "SoulDream Workout Recommendations"
            }
            
            client = AsyncOpenAI(
                api_key="ANON",
                base_url="https://openrouter.ai/api/v1",
                default_headers=headers
            )
            logger.info("OpenAI client created successfully")
        except Exception as e:
            logger.error(f"Error creating OpenAI client: {str(e)}")
            return await generate_workout_recommendations_mock(request, current_user)

        # Creamos un prompt para la IA
        muscle_groups_str = ", ".join(request.muscle_groups)
        
        prompt = f"""Generar EXACTAMENTE 3 recomendaciones diferentes de entrenamiento para {request.username} con las siguientes características:
- Nivel de dificultad: {request.difficulty_level.value}
- Grupos musculares a trabajar: {muscle_groups_str}
- Duración aproximada: {request.duration} minutos
- Incluir cardio: {"Sí" if request.include_cardio else "No"}

Debes devolver ÚNICAMENTE un array JSON válido con 3 planes de entrenamiento diferentes sin ningún texto de markdown o explicación adicional.
No incluyas anotaciones como ```json o ```.
No incluyas explicaciones antes o después del JSON.
IMPORTANTE: Toda la información en el JSON debe estar en ESPAÑOL.
IMPORTANTE: Incluye al menos 4-6 ejercicios diferentes en cada plan de entrenamiento.

El formato debe ser exactamente como sigue (este es un ejemplo, debes personalizarlo):

[
  {{
    "name": "Nombre del primer entrenamiento en español",
    "description": "Breve descripción del entrenamiento en español",
    "workoutType": "Fuerza",
    "estimatedDuration": {request.duration},
    "muscleGroups": ["Grupo1", "Grupo2"],
    "exercises": [
      {{
        "name": "Nombre del ejercicio en español",
        "sets": 3,
        "reps": "12",
        "restSeconds": 60,
        "notes": "Notas sobre la técnica o ejecución en español"
      }}
    ],
    "notes": "Notas adicionales sobre el entrenamiento en español"
  }}
]"""
        
        try:
            logger.info("Calling OpenRouter API...")
            response = await client.chat.completions.create(
                model="qwen/qwq-32b",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=1500,
                stream=False,
                extra_body={
                    "provider": {
                        "order": ["Groq", "Fireworks"],
                        "allow_fallbacks": False
                    }
                }
            )
            logger.info("Response received from API")
            
            # Cerrar el cliente correctamente
            await client.close()
            
            # Procesamos la respuesta para asegurar que es JSON válido
            raw_content = response.choices[0].message.content
            content = raw_content.strip()
            
            # Si está envuelto en backticks de markdown, quitarlos
            if content.startswith("```json") and content.endswith("```"):
                content = content[7:-3].strip()
            elif content.startswith("```") and content.endswith("```"):
                content = content[3:-3].strip()
                
            # Intentar validar el JSON
            try:
                json.loads(content)
                logger.info("Successfully parsed JSON response")
                return WorkoutRecommendationResponse(recommendations=content)
            except json.JSONDecodeError as json_err:
                logger.error(f"Error parsing JSON response: {str(json_err)}")
                logger.info("Falling back to mock data")
                return await generate_workout_recommendations_mock(request, current_user)
                
        except Exception as e:
            logger.error(f"Error calling OpenRouter API: {str(e)}")
            await client.close()
            logger.info("Falling back to mock data")
            return await generate_workout_recommendations_mock(request, current_user)
            
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return await generate_workout_recommendations_mock(request, current_user)

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
        print(f"Error generating mock workout recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating mock workout recommendations: {str(e)}") 