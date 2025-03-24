# Paquete para servicios de IA 

import logging
from typing import List, Dict, Any, Optional
import aiohttp
import json
import os
from app.core.ai_config import ai_settings

logger = logging.getLogger(__name__)

async def generate_ai_response(messages: List[Dict[str, Any]], 
                              model: str = None,
                              temperature: float = 0.7,
                              max_tokens: int = 800,
                              system_prompt: str = None) -> str:
    """
    Genera una respuesta utilizando el modelo de OpenRouter
    
    Args:
        messages: Lista de mensajes en formato role/content
        model: Modelo a utilizar (opcional, por defecto usa el configurado)
        temperature: Temperatura para la generación (creatividad)
        max_tokens: Número máximo de tokens a generar
        system_prompt: Prompt del sistema (opcional)
        
    Returns:
        Texto de la respuesta generada
    """
    try:
        # Configuración del modelo
        api_key = ai_settings.OPENROUTER_API_KEY
        if not api_key:
            logger.error("No se ha configurado la API key de OpenRouter")
            return "Error: No se ha configurado la API key de OpenRouter"
            
        base_url = ai_settings.OPENROUTER_BASE_URL
        model = model or ai_settings.OPENROUTER_DEFAULT_MODEL
        
        # Preparar los mensajes para la API
        formatted_messages = []
        
        # Agregar el system prompt si se proporciona
        if system_prompt:
            formatted_messages.append({"role": "system", "content": system_prompt})
            
        # Agregar el resto de mensajes
        formatted_messages.extend(messages)
        
        # Preparar la solicitud
        payload = {
            "model": model,
            "messages": formatted_messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": ai_settings.OPENROUTER_REFERER,
            "Content-Type": "application/json"
        }
        
        # Realizar la solicitud
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{base_url}/chat/completions", 
                json=payload,
                headers=headers,
                timeout=ai_settings.REQUEST_TIMEOUT_SECONDS
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"Error en la API de OpenRouter: {error_text}")
                    return f"Error en la generación de respuesta: {response.status}"
                
                result = await response.json()
                
                # Extraer la respuesta
                if "choices" in result and len(result["choices"]) > 0:
                    return result["choices"][0]["message"]["content"]
                else:
                    logger.error(f"Respuesta incompleta: {result}")
                    return "Error: No se pudo generar una respuesta"
                
    except Exception as e:
        logger.error(f"Error al generar respuesta: {str(e)}")
        return f"Error al generar respuesta: {str(e)}" 