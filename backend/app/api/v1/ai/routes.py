from fastapi import APIRouter, Depends, HTTPException
from app.schemas.ai import ChatRequest, ChatResponse, PlanRequest, PlanResponse, OpenRouterChatRequest, ChatMessage, MessageRole
from app.services.ai.ai_service import openrouter_service
from app.core.auth import get_current_user
from fastapi.responses import StreamingResponse
from jose import JWTError, jwt
from app.core.config import settings
from app.core.ai_config import CHAT_SYSTEM_PROMPT
from app.db.supabase import supabase_client
import logging
import json
from typing import Optional, Dict, Any
import os
from datetime import datetime
import uuid

# Configuración del logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

router = APIRouter()

async def save_message(user_id: str, conversation_id: str, content: str, sender: str):
    """
    Guarda un mensaje en la base de datos
    """
    try:
        # Primero verificamos que la conversación existe y pertenece al usuario
        conversation = supabase_client.table('conversations')\
            .select('*')\
            .eq('id', conversation_id)\
            .eq('user_id', user_id)\
            .single()\
            .execute()
            
        if not conversation.data:
            logger.error(f"Conversación {conversation_id} no encontrada o no pertenece al usuario {user_id}")
            return None
            
        data = {
            "conversation_id": conversation_id,
            "content": content,
            "sender": sender,
            "created_at": datetime.utcnow().isoformat()
        }
        
        result = supabase_client.table('messages').insert(data).execute()
        
        if result.data:
            # Actualizar el timestamp de la conversación
            supabase_client.table('conversations')\
                .update({"updated_at": datetime.utcnow().isoformat()})\
                .eq('id', conversation_id)\
                .execute()
            return result.data[0]
        return None
    except Exception as e:
        logger.error(f"Error guardando mensaje: {str(e)}")
        return None

@router.post("/new-conversation")
async def create_conversation(current_user = Depends(get_current_user)):
    """
    Crea una nueva conversación para el usuario
    """
    try:
        if not current_user:
            logger.error("No se proporcionó usuario actual")
            raise HTTPException(
                status_code=401,
                detail="Usuario no autenticado"
            )
            
        logger.info(f"Current user data: {current_user}")
            
        user_id = current_user.get("sub")
        if not user_id:
            logger.error("No se encontró sub en el token")
            raise HTTPException(
                status_code=401,
                detail="ID de usuario no encontrado en el token"
            )
            
        # Verificar que el ID es un UUID válido
        try:
            from uuid import UUID
            UUID(user_id)
        except ValueError:
            logger.error(f"ID de usuario no es un UUID válido: {user_id}")
            raise HTTPException(
                status_code=400,
                detail="ID de usuario inválido"
            )
            
        data = {
            "user_id": user_id,
            "created_at": datetime.utcnow().isoformat(),
            "title": "Nueva conversación",
            "status": "active"
        }
        
        logger.info(f"Intentando crear conversación con datos: {data}")
        
        # Verificar la conexión con Supabase
        try:
            test_query = supabase_client.table('conversations').select("id").limit(1).execute()
            logger.info("Conexión con Supabase verificada")
        except Exception as e:
            logger.error(f"Error al verificar conexión con Supabase: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Error de conexión con la base de datos"
            )
        
        # Intentar crear la conversación
        result = supabase_client.table('conversations').insert(data).execute()
        
        if not result.data:
            logger.error("No se recibieron datos después de la inserción")
            raise HTTPException(
                status_code=500,
                detail="Error al crear la conversación en la base de datos"
            )
            
        conversation_id = result.data[0]["id"]
        logger.info(f"Conversación creada exitosamente con ID: {conversation_id}")
        return {"conversation_id": conversation_id}
        
    except Exception as e:
        logger.error(f"Error creando conversación: {str(e)}")
        if hasattr(e, 'status_code'):
            raise e
        raise HTTPException(
            status_code=500,
            detail=f"Error al crear la conversación: {str(e)}"
        )

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
async def openrouter_chat_stream(
    request: OpenRouterChatRequest,
    current_user = Depends(get_current_user)
):
    """
    Genera una respuesta de chat en streaming utilizando OpenRouter
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

        # Validar que tenemos un mensaje y conversation_id
        if not request.message:
            raise HTTPException(
                status_code=422,
                detail="El mensaje no puede estar vacío"
            )
            
        if not request.conversation_id:
            raise HTTPException(
                status_code=422,
                detail="Se requiere el ID de la conversación"
            )
            
        # Guardar el mensaje del usuario
        user_message = await save_message(user_id, request.conversation_id, request.message, "user")
        if not user_message:
            raise HTTPException(
                status_code=404,
                detail="No se encontró la conversación o no tienes permiso para acceder a ella"
            )
            
        # Convertir el mensaje a formato ChatMessage
        messages = [
            ChatMessage(role=MessageRole.SYSTEM, content=CHAT_SYSTEM_PROMPT),
            ChatMessage(role=MessageRole.USER, content=request.message)
        ]
        
        # Obtener historial de mensajes
        history_result = supabase_client.table('messages')\
            .select('*')\
            .eq('conversation_id', request.conversation_id)\
            .order('created_at', desc=False)\
            .limit(10)\
            .execute()
                
        if history_result.data:
            messages.extend([
                ChatMessage(
                    role=MessageRole.USER if msg["sender"] == "user" else MessageRole.ASSISTANT,
                    content=msg["content"]
                )
                for msg in history_result.data
            ])

        async def generate():
            try:
                response_buffer = ""
                async for chunk in openrouter_service.chat_stream(messages):
                    if chunk.is_error:
                        yield f"data: {json.dumps({'error': chunk.content})}\n\n"
                        continue
                        
                    response_buffer += chunk.content
                    yield f"data: {json.dumps({'text': chunk.content})}\n\n"
                    
                    if chunk.is_complete:
                        # Guardar la respuesta completa del asistente
                        if response_buffer:
                            await save_message(user_id, request.conversation_id, response_buffer, "assistant")
                            
                yield f"data: {json.dumps({'type': 'done'})}\n\n"
                
            except Exception as e:
                logger.error(f"Error en stream generator: {str(e)}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                yield f"data: {json.dumps({'type': 'done'})}\n\n"

        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Authorization, Content-Type",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Credentials": "true",
            }
        )
    except Exception as e:
        logger.error(f"Error en openrouter_chat_stream: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        ) 