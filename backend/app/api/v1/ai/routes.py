from fastapi import APIRouter, Depends, HTTPException
from app.schemas.ai import ChatRequest, ChatResponse, PlanRequest, PlanResponse
from app.services.ai.ai_service import openrouter_service
from app.core.auth import get_current_user
import logging

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