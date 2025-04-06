from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from uuid import uuid4
from datetime import datetime

from app.api.deps import get_current_user
from app.schemas.ai import MessageRole, ChatMessage as AIChatMessage, ChatResponse as AIChatResponse
from app.utils.logger import logger
from app.utils.supabase_client import supabase_client

router = APIRouter()

@router.post("/chat", response_model=AIChatResponse)
async def chat_with_ai(
    message: AIChatMessage,
    current_user=Depends(get_current_user)
):
    """
    Envía un mensaje al asistente IA y recibe una respuesta.
    """
    try:
        # Aquí iría la lógica para comunicarse con el modelo de IA
        # Por ahora, devolvemos una respuesta simulada
        return {
            "message": f"Respuesta simulada a: {message.content}",
            "has_goal": False,
            "goal_metadata": None
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar la solicitud: {str(e)}"
        )

@router.get("/conversations", response_model=List[Dict[str, Any]])
async def get_conversations(
    current_user=Depends(get_current_user),
    skip: int = 0,
    limit: int = 10
):
    """
    Obtiene el historial de conversaciones del usuario.
    """
    try:
        if not current_user:
            raise HTTPException(
                status_code=401,
                detail="Usuario no autenticado"
            )
            
        user_id = current_user.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="ID de usuario no encontrado en el token"
            )

        # Obtener conversaciones desde Supabase
        result = supabase_client.table('conversations')\
            .select('*')\
            .eq('user_id', user_id)\
            .order('updated_at', desc=True)\
            .range(skip, skip + limit - 1)\
            .execute()

        if result.data is None:
            return []

        return result.data

    except Exception as e:
        logger.error(f"Error al obtener conversaciones: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener conversaciones: {str(e)}"
        )

@router.get("/conversations/{conversation_id}", response_model=List[Dict[str, Any]])
async def get_conversation_messages(
    conversation_id: str,
    current_user=Depends(get_current_user)
):
    """
    Obtiene los mensajes de una conversación específica.
    """
    try:
        if not current_user:
            raise HTTPException(
                status_code=401,
                detail="Usuario no autenticado"
            )
            
        user_id = current_user.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="ID de usuario no encontrado en el token"
            )

        # Verificar que la conversación pertenece al usuario
        conversation = supabase_client.table('conversations')\
            .select('*')\
            .eq('id', conversation_id)\
            .eq('user_id', user_id)\
            .single()\
            .execute()

        if not conversation.data:
            raise HTTPException(
                status_code=404,
                detail="Conversación no encontrada"
            )

        # Obtener mensajes de la conversación
        messages = supabase_client.table('messages')\
            .select('*')\
            .eq('conversation_id', conversation_id)\
            .order('created_at')\
            .execute()

        return messages.data or []

    except Exception as e:
        logger.error(f"Error al obtener mensajes: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener mensajes: {str(e)}"
        )

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
            "title": "Nueva conversación",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        logger.info(f"Intentando crear conversación con datos: {data}")
        
        # Crear la conversación
        result = supabase_client.table('conversations').insert(data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=500,
                detail="Error al crear la conversación"
            )
            
        conversation_id = result.data[0]['id']
        
        return {
            "conversation_id": conversation_id,
            "message": "Conversación creada exitosamente"
        }

    except Exception as e:
        logger.error(f"Error al crear conversación: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al crear conversación: {str(e)}"
        )

@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str,
    current_user=Depends(get_current_user)
):
    """
    Elimina una conversación específica.
    """
    # Aquí iría la lógica para eliminar la conversación en Supabase
    pass 