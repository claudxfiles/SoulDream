from fastapi import APIRouter, Depends, HTTPException
from app.schemas.ai import ChatRequest, ChatResponse, PlanRequest, PlanResponse
from app.services.ai import AIService
from app.core.auth import get_current_user

router = APIRouter()
ai_service = AIService()

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    current_user = Depends(get_current_user)
):
    """
    Endpoint para chat con IA
    """
    try:
        response, metadata = await ai_service.chat(request)
        return ChatResponse(
            response=response,
            metadata=metadata
        )
    except Exception as e:
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
        plan_data = await ai_service.generate_plan(request)
        return PlanResponse(**plan_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 