import httpx
import json
import logging
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.schemas.ai import AIChatRequest, AIChatResponse, MessageCreate, MessageSender
from app.db.database import get_supabase_client
from datetime import datetime, timedelta
import uuid
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from enum import Enum
import os
from openai import AsyncOpenAI
from app.services.auth import get_current_user

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["AI"])

# No inicializamos el cliente globalmente para evitar errores con httpx
# En su lugar, crearemos el cliente bajo demanda cuando sea necesario

# Modelos Pydantic para solicitudes y respuestas
class AIPromptRequest(BaseModel):
    prompt: str
    context: Optional[Dict[str, Any]] = None
    model: Optional[str] = "qwen/qwq-32b:online"
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 1000

class AIPromptResponse(BaseModel):
    response: str
    model_used: str
    tokens_used: Optional[int] = None
    processing_time: Optional[float] = None

class SuggestionType(str, Enum):
    TASK_IMPROVEMENT = "task_improvement"
    GOAL_PLANNING = "goal_planning"
    TIME_ESTIMATION = "time_estimation"
    PRIORITY_RECOMMENDATION = "priority_recommendation"
    SUBTASK_GENERATION = "subtask_generation"
    COMPREHENSIVE = "comprehensive"

class AISuggestionRequest(BaseModel):
    entity_id: str
    entity_type: str = "task"  # task, goal, etc.
    suggestion_type: SuggestionType = SuggestionType.COMPREHENSIVE
    additional_context: Optional[Dict[str, Any]] = None

class AISuggestion(BaseModel):
    id: str
    entity_id: str
    entity_type: str
    suggestion_type: str
    content: Optional[str] = None
    status: str
    user_id: str
    created_at: datetime
    completed_at: Optional[datetime] = None

@router.post("/generate", response_model=AIPromptResponse)
async def generate_ai_response(
    request: AIPromptRequest,
    current_user: dict = Depends(get_current_user)
):
    """Genera una respuesta de IA basada en un prompt."""
    try:
        # Verificar si tenemos la API key disponible
        api_key = os.getenv("OPENROUTER_API_KEY", settings.OPENROUTER_API_KEY)
        if not api_key:
            return AIPromptResponse(
                response="El servicio de IA no está disponible en este momento. Por favor, intente más tarde.",
                model_used="none",
                tokens_used=0,
                processing_time=0.0
            )
        
        # Crear cliente bajo demanda
        client = AsyncOpenAI(
            api_key=api_key,
            base_url=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
        )
            
        start_time = datetime.now()
        
        # Añadir contexto del usuario al prompt
        enhanced_prompt = f"""
        [Contexto del usuario: ID {current_user['id']}, Rol: {current_user.get('role', 'usuario')}]
        
        {request.prompt}
        """
        
        # Llamar a la API de OpenRouter con proveedores específicos
        response = await client.chat.completions.create(
            model=request.model,
            messages=[{"role": "user", "content": enhanced_prompt}],
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            http_headers={
                "HTTP-Referer": "https://souldream-ai.com",
                "X-Title": "SoulDream AI",
                "OpenRouter-Providers": "Groq,Fireworks"
            }
        )
        
        # Cerrar el cliente correctamente
        await client.close()
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return AIPromptResponse(
            response=response.choices[0].message.content,
            model_used=request.model,
            tokens_used=response.usage.total_tokens if hasattr(response, 'usage') else None,
            processing_time=processing_time
        )
    except Exception as e:
        logger.error(f"Error generating AI response: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating AI response: {str(e)}")

@router.post("/suggestions", response_model=AISuggestion)
async def create_ai_suggestion(
    request: AISuggestionRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Crea una sugerencia de IA para una entidad (tarea, meta, etc.)"""
    supabase = get_supabase_client()
    
    # Verificar que la entidad existe y pertenece al usuario
    if request.entity_type == "task":
        task_response = supabase.table("tasks").select("*").eq("id", request.entity_id).eq("user_id", current_user["id"]).execute()
        if not task_response.data:
            raise HTTPException(status_code=404, detail="Task not found")
    elif request.entity_type == "goal":
        goal_response = supabase.table("goals").select("*").eq("id", request.entity_id).eq("user_id", current_user["id"]).execute()
        if not goal_response.data:
            raise HTTPException(status_code=404, detail="Goal not found")
    else:
        raise HTTPException(status_code=400, detail="Unsupported entity type")
    
    # Crear registro de sugerencia pendiente
    suggestion_id = str(uuid.uuid4())
    suggestion_data = {
        "id": suggestion_id,
        "entity_id": request.entity_id,
        "entity_type": request.entity_type,
        "suggestion_type": request.suggestion_type,
        "status": "pending",
        "user_id": current_user["id"],
        "created_at": datetime.now().isoformat()
    }
    
    supabase.table("ai_suggestions").insert(suggestion_data).execute()
    
    # Generar sugerencia en segundo plano
    background_tasks.add_task(
        generate_suggestion_background,
        suggestion_id,
        request.entity_type,
        request.entity_id,
        request.suggestion_type,
        request.additional_context,
        current_user["id"]
    )
    
    # Obtener la sugerencia recién creada
    suggestion_response = supabase.table("ai_suggestions").select("*").eq("id", suggestion_id).execute()
    
    return AISuggestion(**suggestion_response.data[0])

@router.get("/suggestions/{suggestion_id}", response_model=AISuggestion)
async def get_ai_suggestion(
    suggestion_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Obtiene una sugerencia de IA por ID"""
    supabase = get_supabase_client()
    
    suggestion_response = supabase.table("ai_suggestions").select("*").eq("id", suggestion_id).eq("user_id", current_user["id"]).execute()
    
    if not suggestion_response.data:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    
    return AISuggestion(**suggestion_response.data[0])

@router.get("/suggestions/entity/{entity_type}/{entity_id}", response_model=List[AISuggestion])
async def get_entity_suggestions(
    entity_type: str,
    entity_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Obtiene todas las sugerencias de IA para una entidad específica"""
    supabase = get_supabase_client()
    
    suggestions_response = supabase.table("ai_suggestions").select("*").eq("entity_type", entity_type).eq("entity_id", entity_id).eq("user_id", current_user["id"]).execute()
    
    return [AISuggestion(**suggestion) for suggestion in suggestions_response.data]

async def generate_suggestion_background(
    suggestion_id: str,
    entity_type: str,
    entity_id: str,
    suggestion_type: str,
    additional_context: Optional[Dict[str, Any]],
    user_id: str
):
    """Genera una sugerencia de IA en segundo plano"""
    supabase = get_supabase_client()
    
    try:
        # Actualizar estado a "processing"
        supabase.table("ai_suggestions").update({"status": "processing"}).eq("id", suggestion_id).execute()
        
        # Verificar si tenemos la API key disponible
        api_key = os.getenv("OPENROUTER_API_KEY", settings.OPENROUTER_API_KEY)
        if not api_key:
            logger.error("API key not available, cannot generate suggestion")
            supabase.table("ai_suggestions").update({
                "status": "failed",
                "content": "El servicio de IA no está disponible en este momento. Por favor, intente más tarde."
            }).eq("id", suggestion_id).execute()
            return
        
        # Obtener la entidad
        if entity_type == "task":
            task_response = supabase.table("tasks").select("*").eq("id", entity_id).execute()
            if not task_response.data:
                logger.error(f"Task {entity_id} not found")
                supabase.table("ai_suggestions").update({
                    "status": "failed",
                    "content": "Task not found"
                }).eq("id", suggestion_id).execute()
                return
            
            entity = task_response.data[0]
            prompt = generate_task_prompt(entity, suggestion_type, additional_context)
        elif entity_type == "goal":
            goal_response = supabase.table("goals").select("*").eq("id", entity_id).execute()
            if not goal_response.data:
                logger.error(f"Goal {entity_id} not found")
                supabase.table("ai_suggestions").update({
                    "status": "failed",
                    "content": "Goal not found"
                }).eq("id", suggestion_id).execute()
                return
            
            entity = goal_response.data[0]
            prompt = generate_goal_prompt(entity, suggestion_type, additional_context)
        else:
            supabase.table("ai_suggestions").update({
                "status": "failed",
                "content": "Unsupported entity type"
            }).eq("id", suggestion_id).execute()
            return
        
        # Crear cliente bajo demanda
        client = AsyncOpenAI(
            api_key=api_key,
            base_url=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
        )
        
        # Llamar a la API de OpenRouter con proveedores específicos
        response = await client.chat.completions.create(
            model="qwen/qwq-32b:online",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            http_headers={
                "HTTP-Referer": "https://souldream-ai.com",
                "X-Title": "SoulDream AI",
                "OpenRouter-Providers": "Groq,Fireworks"
            }
        )
        
        # Cerrar el cliente correctamente
        await client.close()
        
        content = response.choices[0].message.content
        
        # Actualizar la sugerencia con la respuesta
        supabase.table("ai_suggestions").update({
            "content": content,
            "status": "completed",
            "completed_at": datetime.utcnow().isoformat()
        }).eq("id", suggestion_id).execute()
        
        # Si es generación de subtareas, intentar parsear y crear las subtareas
        if suggestion_type == SuggestionType.SUBTASK_GENERATION and entity_type == "task":
            try:
                create_subtasks_from_suggestion(content, entity_id, user_id, supabase)
            except Exception as e:
                logger.error(f"Error creating subtasks: {str(e)}")
        
        # Si es planificación de metas, intentar parsear y crear los pasos
        if suggestion_type == SuggestionType.GOAL_PLANNING and entity_type == "goal":
            try:
                create_goal_steps_from_suggestion(content, entity_id, user_id, supabase)
            except Exception as e:
                logger.error(f"Error creating goal steps: {str(e)}")
        
    except Exception as e:
        logger.error(f"Error generating suggestion: {str(e)}")
        # Actualizar estado a "failed"
        supabase.table("ai_suggestions").update({
            "status": "failed",
            "content": f"Error: {str(e)}"
        }).eq("id", suggestion_id).execute()

def generate_task_prompt(task: Dict[str, Any], suggestion_type: str, additional_context: Optional[Dict[str, Any]]) -> str:
    """Genera un prompt para una tarea basado en el tipo de sugerencia"""
    base_prompt = f"""
    Analiza esta tarea y proporciona sugerencias útiles:
    
    Título: {task.get('title', 'No disponible')}
    Descripción: {task.get('description', 'No hay descripción')}
    Prioridad: {task.get('priority', 'No especificada')}
    Fecha límite: {task.get('due_date', 'No especificada')}
    Tiempo estimado: {task.get('estimated_hours', 'No especificado')} horas
    """
    
    if additional_context:
        base_prompt += f"\nContexto adicional: {json.dumps(additional_context, ensure_ascii=False)}\n"
    
    if suggestion_type == SuggestionType.TASK_IMPROVEMENT:
        base_prompt += """
        Por favor, proporciona sugerencias para mejorar esta tarea:
        1. Cómo hacer la descripción más clara y accionable
        2. Posibles obstáculos y cómo superarlos
        3. Recursos que podrían ser útiles
        """
    elif suggestion_type == SuggestionType.TIME_ESTIMATION:
        base_prompt += """
        Por favor, proporciona una estimación de tiempo detallada:
        1. Tiempo mínimo, promedio y máximo necesario
        2. Factores que podrían afectar la duración
        3. Sugerencias para completar la tarea más eficientemente
        """
    elif suggestion_type == SuggestionType.PRIORITY_RECOMMENDATION:
        base_prompt += """
        Por favor, analiza la prioridad de esta tarea:
        1. ¿Es adecuada la prioridad actual?
        2. Factores a considerar para priorizar
        3. Impacto de esta tarea en otras responsabilidades
        """
    elif suggestion_type == SuggestionType.SUBTASK_GENERATION:
        base_prompt += """
        Por favor, divide esta tarea en subtareas accionables:
        1. Lista de 3-7 subtareas específicas
        2. Orden lógico de ejecución
        3. Dependencias entre subtareas
        
        Formato JSON:
        ```json
        [
          {
            "title": "Título de la subtarea 1",
            "description": "Descripción detallada",
            "estimated_hours": 1.5
          },
          ...
        ]
        ```
        """
    else:  # Comprehensive
        base_prompt += """
        Por favor, proporciona un análisis completo:
        1. Posibles subtareas (3-5)
        2. Sugerencias de mejora
        3. Estimación de tiempo realista
        4. Prioridad recomendada
        5. Recursos útiles
        """
    
    return base_prompt

def generate_goal_prompt(goal: Dict[str, Any], suggestion_type: str, additional_context: Optional[Dict[str, Any]]) -> str:
    """Genera un prompt para una meta basado en el tipo de sugerencia"""
    base_prompt = f"""
    Analiza esta meta y proporciona sugerencias útiles:
    
    Título: {goal.get('title', 'No disponible')}
    Descripción: {goal.get('description', 'No hay descripción')}
    Área: {goal.get('area', 'No especificada')}
    Tipo: {goal.get('type', 'No especificado')}
    Fecha objetivo: {goal.get('target_date', 'No especificada')}
    Prioridad: {goal.get('priority', 'No especificada')}
    """
    
    if additional_context:
        base_prompt += f"\nContexto adicional: {json.dumps(additional_context, ensure_ascii=False)}\n"
    
    if suggestion_type == SuggestionType.GOAL_PLANNING:
        base_prompt += """
        Por favor, crea un plan detallado para alcanzar esta meta:
        1. Lista de 5-8 pasos específicos y accionables
        2. Orden lógico de ejecución
        3. Tiempo estimado para cada paso
        
        Formato JSON:
        ```json
        [
          {
            "title": "Título del paso 1",
            "description": "Descripción detallada",
            "estimated_days": 7
          },
          ...
        ]
        ```
        """
    else:  # Comprehensive
        base_prompt += """
        Por favor, proporciona un análisis completo:
        1. Evaluación de la claridad y especificidad de la meta
        2. Posibles obstáculos y cómo superarlos
        3. Recursos y habilidades necesarios
        4. Pasos recomendados (3-5)
        5. Métricas para medir el progreso
        """
    
    return base_prompt

def create_subtasks_from_suggestion(suggestion_content: str, parent_task_id: str, user_id: str, supabase):
    """Crea subtareas a partir del contenido de una sugerencia"""
    # Extraer el JSON de la respuesta
    json_str = suggestion_content.split("```json")[1].split("```")[0].strip()
    subtasks_data = json.loads(json_str)
    
    for i, subtask_data in enumerate(subtasks_data):
        subtask_id = str(uuid.uuid4())
        subtask = {
            "id": subtask_id,
            "title": subtask_data["title"],
            "description": subtask_data.get("description", ""),
            "status": "TODO",
            "priority": "MEDIUM",
            "estimated_hours": subtask_data.get("estimated_hours"),
            "parent_task_id": parent_task_id,
            "user_id": user_id,
            "order_index": i,
            "created_at": datetime.now().isoformat()
        }
        
        supabase.table("tasks").insert(subtask).execute()

def create_goal_steps_from_suggestion(suggestion_content: str, goal_id: str, user_id: str, supabase):
    """Crea pasos de meta a partir del contenido de una sugerencia"""
    # Extraer el JSON de la respuesta
    json_str = suggestion_content.split("```json")[1].split("```")[0].strip()
    steps_data = json.loads(json_str)
    
    for i, step_data in enumerate(steps_data):
        # Calcular fecha estimada basada en días estimados
        due_date = None
        if "estimated_days" in step_data:
            due_date = (datetime.utcnow() + timedelta(days=step_data["estimated_days"])).isoformat()
        
        step_id = str(uuid.uuid4())
        step = {
            "id": step_id,
            "goal_id": goal_id,
            "title": step_data["title"],
            "description": step_data.get("description", ""),
            "order_index": i,
            "status": "pending",
            "due_date": due_date,
            "ai_generated": True,
            "created_at": datetime.now().isoformat()
        }
        
        supabase.table("goal_steps").insert(step).execute() 