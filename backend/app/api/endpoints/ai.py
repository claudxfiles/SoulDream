from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any, List, Optional, Dict
from datetime import datetime
import uuid
from pydantic import BaseModel
import logging
import json
from fastapi.responses import StreamingResponse

from app.api.deps import get_current_user
from app.schemas.ai import AIChatRequest, AIChatResponse, ChatResponse
from app.services.ai import generate_ai_response
from app.services.ai.ai_service import openrouter_service

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(tags=["ai"])

# Modelo de datos para las solicitudes
class OpenRouterChatRequest(BaseModel):
    message: str
    model: str = "qwen/qwq-32b:online"

class UserDataRequest(BaseModel):
    """Datos del usuario para análisis y generación de planes"""
    user_data: Dict[str, Any]
    
class PersonalizedPlanRequest(BaseModel):
    """Datos para solicitar un plan personalizado"""
    user_data: Dict[str, Any]
    goal_type: str
    preferences: Optional[Dict[str, Any]] = None

class LearningAdaptationRequest(BaseModel):
    """Datos para solicitar adaptaciones de aprendizaje"""
    user_data: Dict[str, Any]
    interaction_history: List[Dict[str, Any]]

@router.post("/openrouter-chat", response_model=ChatResponse)
async def openrouter_chat(
    request: OpenRouterChatRequest, 
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user)
):
    """
    Genera una respuesta de chat utilizando OpenRouter
    """
    try:
        messages = [
            {"role": "user", "content": request.message}
        ]
        
        # Generar respuesta
        response_text = await openrouter_service.generate_chat_response(
            messages=messages,
            model=request.model
        )
        
        # Verificar si hay una meta en la respuesta
        goal_metadata = openrouter_service._extract_goal_metadata(response_text)
        has_goal = goal_metadata is not None and goal_metadata.get("has_goal", False)
        
        return {
            "message": response_text,
            "has_goal": has_goal,
            "goal_metadata": goal_metadata.get("goal") if has_goal else None
        }
    except Exception as e:
        logger.error(f"Error en openrouter_chat: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generando respuesta: {str(e)}"
        )

@router.post("/openrouter-chat-stream")
async def openrouter_chat_stream(
    request: OpenRouterChatRequest, 
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user)
):
    """
    Genera una respuesta de chat en streaming utilizando OpenRouter
    """
    try:
        messages = [
            {"role": "user", "content": request.message}
        ]
        
        # Generar respuesta en streaming
        stream_generator = await openrouter_service.generate_chat_response(
            messages=messages,
            model=request.model,
            stream=True
        )
        
        async def generate():
            try:
                response_buffer = ""
                async for chunk in stream_generator:
                    if chunk.is_complete:
                        # Evento final
                        yield f"data: [DONE]\n\n"
                        break
                    
                    # Acumular texto para análisis posterior
                    response_buffer += chunk.text
                    
                    # Enviar chunk
                    yield f"data: {json.dumps({'text': chunk.text})}\n\n"
                
                # Analizar si hay una meta después de completar
                if response_buffer:
                    goal_metadata = openrouter_service._extract_goal_metadata(response_buffer)
                    if goal_metadata and goal_metadata.get("has_goal", False):
                        # Enviar metadatos de la meta como evento separado
                        yield f"data: {json.dumps({'goal_metadata': goal_metadata})}\n\n"
            except Exception as e:
                logger.error(f"Error en stream generator: {str(e)}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                yield f"data: [DONE]\n\n"
        
        return StreamingResponse(
            generate(), 
            media_type="text/event-stream"
        )
    except Exception as e:
        logger.error(f"Error en openrouter_chat_stream: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generando respuesta en streaming: {str(e)}"
        )

@router.post("/detect-goal", response_model=Dict[str, Any])
async def detect_goal(
    message: str, 
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Detecta si un mensaje contiene una meta
    """
    try:
        goal_data = await openrouter_service.detect_goal_from_message(message)
        return goal_data or {"has_goal": False}
    except Exception as e:
        logger.error(f"Error detectando meta: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error detectando meta: {str(e)}"
        )

@router.post("/generate-goal-plan", response_model=Dict[str, Any])
async def generate_goal_plan(
    goal_metadata: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Genera un plan detallado para una meta
    """
    try:
        plan = await openrouter_service.generate_goal_plan(goal_metadata)
        return plan
    except Exception as e:
        logger.error(f"Error generando plan: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generando plan: {str(e)}"
        )

@router.post("/generate-personalized-plan", response_model=Dict[str, Any])
async def generate_personalized_plan(
    request: PersonalizedPlanRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Genera un plan personalizado basado en datos históricos del usuario
    """
    try:
        plan = await openrouter_service.generate_personalized_plan(
            user_data=request.user_data,
            goal_type=request.goal_type,
            preferences=request.preferences
        )
        return plan
    except Exception as e:
        logger.error(f"Error generando plan personalizado: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generando plan personalizado: {str(e)}"
        )

@router.post("/analyze-patterns", response_model=Dict[str, Any])
async def analyze_patterns(
    request: UserDataRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Analiza patrones avanzados en los datos históricos del usuario
    """
    try:
        analysis = await openrouter_service.analyze_patterns(request.user_data)
        return analysis
    except Exception as e:
        logger.error(f"Error analizando patrones: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error analizando patrones: {str(e)}"
        )

@router.post("/learning-adaptation", response_model=Dict[str, Any])
async def learning_adaptation(
    request: LearningAdaptationRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Genera adaptaciones basadas en aprendizaje continuo
    """
    try:
        adaptation = await openrouter_service.generate_learning_adaptation(
            user_data=request.user_data,
            interaction_history=request.interaction_history
        )
        return adaptation
    except Exception as e:
        logger.error(f"Error generando adaptación de aprendizaje: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generando adaptación de aprendizaje: {str(e)}"
        )
