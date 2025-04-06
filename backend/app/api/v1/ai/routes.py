from fastapi import APIRouter, Depends, HTTPException
from app.schemas.ai import ChatRequest, ChatResponse, PlanRequest, PlanResponse, OpenRouterChatRequest, ChatMessage, MessageRole
from app.services.ai.ai_service import openrouter_service
from app.core.auth import get_current_user
from fastapi.responses import StreamingResponse
from jose import JWTError, jwt
from app.core.config import settings
import logging
import json
from typing import Optional, Dict, Any
import os

# Configuración del logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    current_user = Depends(get_current_user)
):
    """
    Endpoint para chat con IA
    """
    try:
        messages = [{"role": "user", "content": request.message}]
        if request.message_history:
            messages.extend([
                {"role": msg.role, "content": msg.content}
                for msg in request.message_history
            ])
            
        response = await openrouter_service.chat_stream(messages)
        metadata = None
        
        # Procesar la respuesta para detectar metas
        async for chunk in response:
            if chunk.content:
                metadata = openrouter_service._extract_goal_metadata(chunk.content)
                if metadata and metadata.get("has_goal", False):
                    break
        
        return ChatResponse(
            response=response,
            metadata=metadata
        )
    except Exception as e:
        logger.error(f"Error en chat_with_ai: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-plan", response_model=PlanResponse)
async def generate_personalized_plan(
    request: PlanRequest,
    current_user = Depends(get_current_user)
):
    """
    Endpoint para generar planes personalizados
    """
    try:
        plan_data = await openrouter_service.generate_goal_plan(request.dict())
        return PlanResponse(**plan_data)
    except Exception as e:
        logger.error(f"Error en generate_personalized_plan: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/openrouter-chat-stream")
@router.get("/openrouter-chat-stream")
async def openrouter_chat_stream(
    message: str,
    authorization: str = None,
    request: OpenRouterChatRequest = None,
    current_user = Depends(get_current_user)
):
    """
    Genera una respuesta de chat en streaming utilizando OpenRouter
    Soporta tanto GET (con query params) como POST (con body)
    """
    try:
        # Verificación de autenticación
        if not current_user:
            logger.error("No user found in request")
            raise HTTPException(
                status_code=401,
                detail="No se encontró información del usuario"
            )
            
        # Obtener el ID del usuario del token JWT
        user_id = current_user.get("sub")
        logger.info(f"User authenticated successfully: {user_id}")

        # Si es GET, crear el request object manualmente
        if request is None:
            request = OpenRouterChatRequest(message=message)
            
        # Convertir el mensaje a formato ChatMessage
        messages = [
            ChatMessage(role=MessageRole.USER, content=request.message)
        ]

        async def generate():
            try:
                response_buffer = ""
                # Obtener el generador de streaming
                async for chunk in openrouter_service.chat_stream(messages):
                    if chunk.is_complete:
                        # Analizar si hay una meta solo al final del streaming
                        if response_buffer:
                            goal_metadata = openrouter_service._extract_goal_metadata(response_buffer)
                            if goal_metadata and goal_metadata.get("has_goal", False):
                                yield f"data: {json.dumps({'goal_metadata': goal_metadata})}\n\n"
                        yield f"data: {json.dumps({'type': 'done'})}\n\n"
                        break
                    
                    if chunk.content:
                        # Acumular el contenido para análisis posterior
                        response_buffer += chunk.content
                        # Enviar el contenido del chunk
                        yield f"data: {json.dumps({'text': chunk.content})}\n\n"
                    
                    if chunk.is_error:
                        yield f"data: {json.dumps({'error': chunk.content})}\n\n"
                        break

            except Exception as e:
                logger.error(f"Error en stream generator: {str(e)}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                yield f"data: {json.dumps({'text': 'Lo siento, hubo un error en la comunicación.'})}\n\n"
                yield f"data: {json.dumps({'type': 'done'})}\n\n"

        # Determinar el origen permitido basado en el entorno
        allowed_origin = "http://localhost:3000" if os.environ.get("ENV", "development") == "development" else "https://presentandflow.cl"
        
        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream",
                "Access-Control-Allow-Origin": allowed_origin,
                "Access-Control-Allow-Headers": "Authorization, Content-Type",
                "Access-Control-Allow-Methods": "GET, POST",
                "Access-Control-Allow-Credentials": "true",
            }
        )
    except Exception as e:
        logger.error(f"Error en openrouter_chat_stream: {str(e)}")
        async def fallback_response():
            yield f"data: {json.dumps({'text': 'Lo siento, hubo un problema con el servicio.'})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            
        allowed_origin = "http://localhost:3000" if os.environ.get("ENV", "development") == "development" else "https://presentandflow.cl"
        
        return StreamingResponse(
            fallback_response(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream",
                "Access-Control-Allow-Origin": allowed_origin,
                "Access-Control-Allow-Headers": "Authorization, Content-Type",
                "Access-Control-Allow-Methods": "GET, POST",
                "Access-Control-Allow-Credentials": "true",
            }
        ) 