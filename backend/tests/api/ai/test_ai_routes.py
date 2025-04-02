import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.ai import ChatRequest, PlanRequest

client = TestClient(app)

@pytest.mark.asyncio
async def test_chat_endpoint(authenticated_client):
    """Test del endpoint de chat"""
    request_data = {
        "message": "¿Cómo puedo mejorar mi productividad?",
        "model": "qwen/qwen-72b",
        "message_history": []
    }
    
    response = authenticated_client.post("/api/v1/ai/chat", json=request_data)
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert "metadata" in data

@pytest.mark.asyncio
async def test_generate_plan_endpoint(authenticated_client):
    """Test del endpoint de generación de planes"""
    request_data = {
        "goal": "Ahorrar para un auto",
        "area": "finanzas",
        "timeframe": "6 meses"
    }
    
    response = authenticated_client.post("/api/v1/ai/generate-plan", json=request_data)
    assert response.status_code == 200
    data = response.json()
    assert "plan" in data
    assert "estimated_duration" in data
    assert "difficulty_level" in data
    assert "requirements" in data

@pytest.mark.asyncio
async def test_chat_endpoint_unauthorized():
    """Test de acceso no autorizado al chat"""
    request_data = {
        "message": "Test message",
        "model": "test-model",
        "message_history": []
    }
    
    response = client.post("/api/v1/ai/chat", json=request_data)
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_generate_plan_endpoint_unauthorized():
    """Test de acceso no autorizado a generación de planes"""
    request_data = {
        "goal": "Test goal",
        "area": "test",
        "timeframe": "1 month"
    }
    
    response = client.post("/api/v1/ai/generate-plan", json=request_data)
    assert response.status_code == 401 