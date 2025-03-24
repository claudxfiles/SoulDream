from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List, Dict, Any, Optional
import os
from functools import lru_cache

class AISettings(BaseSettings):
    """
    Configuración para los servicios de IA
    """
    # OpenRouter API (https://openrouter.ai/)
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_DEFAULT_MODEL: str = "qwen/qwq-32b:online"
    OPENROUTER_REFERER: str = "https://task-manager.app"  # Dominio de la aplicación

    # Configuración para tokens máximos en diferentes contextos
    MAX_TOKENS_RESPONSE: int = 800
    MAX_TOKENS_GOAL_DETECTION: int = 500
    MAX_TOKENS_GOAL_PLAN: int = 1000
    MAX_TOKENS_PERSONALIZED_PLAN: int = 1500
    MAX_TOKENS_PATTERN_ANALYSIS: int = 1000
    MAX_TOKENS_LEARNING_ADAPTATION: int = 1200
    
    # Configuración para temperaturas para diferentes propósitos
    TEMPERATURE_CHAT: float = 0.7        # Más creativo para chat general
    TEMPERATURE_GOAL_DETECTION: float = 0.2  # Más determinista para detección
    TEMPERATURE_GOAL_PLAN: float = 0.4   # Balance para planificación
    TEMPERATURE_PERSONALIZED_PLAN: float = 0.5  # Balance para planificación personalizada
    TEMPERATURE_PATTERN_ANALYSIS: float = 0.3   # Más determinista para análisis
    TEMPERATURE_LEARNING_ADAPTATION: float = 0.6  # Más creativo para adaptación

    # Parámetros para control de frecuencia/limitaciones
    MAX_REQUESTS_PER_MINUTE: int = 10    # Limitar solicitudes a la API
    REQUEST_TIMEOUT_SECONDS: int = 30    # Timeout para solicitudes
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"  # Permitir variables de entorno adicionales

# Instancia global de configuración
ai_settings = AISettings()

# Prompts optimizados para qwen/qwq-32b

CHAT_SYSTEM_PROMPT = """Eres un asistente personal amigable y útil en una aplicación llamada Task Manager. 
Puedes ayudar a los usuarios con una variedad de tareas, especialmente la gestión de su tiempo, metas y 
productividad. Basa tus respuestas en las mejores prácticas de productividad y gestión personal.
"""

GOAL_DETECTION_PROMPT = """Analiza el siguiente mensaje de un usuario y determina si contiene una meta o intención específica. 
Una meta debe tener un objetivo claro, medible y preferiblemente un plazo específico.

Ejemplos de mensajes que contienen metas:
1. "Quiero ahorrar $5000 para fin de año"
2. "Necesito aprender programación en Python en los próximos 3 meses"
3. "Mi objetivo es correr un maratón el próximo verano"

Ejemplos de mensajes que NO contienen metas:
1. "¿Qué hora es?"
2. "Estoy aburrido"
3. "Me gustaría saber más sobre nutrición" (muy general, sin objetivo específico)

Si detectas una meta, responde ÚNICAMENTE con un JSON con el siguiente formato:
{
  "has_goal": true,
  "goal": {
    "title": "Título conciso de la meta",
    "description": "Descripción detallada de la meta",
    "area": "finanzas|salud|educacion|desarrollo_personal|carrera|relaciones|hobbies",
    "type": "adquisicion|aprendizaje|habito|ahorro|fitness|otro",
    "target_date": "YYYY-MM-DD (si se menciona)",
    "priority": "alta|media|baja (basado en la urgencia expresada)",
    "steps": ["Posible paso 1", "Posible paso 2", "..."] (opcional)
  }
}

Si NO detectas una meta clara, responde ÚNICAMENTE con:
{
  "has_goal": false
}
"""

GOAL_PLAN_PROMPT = """Estás ayudando a un usuario a crear un plan para lograr una meta específica.
Tu tarea es desarrollar un plan detallado, realista y accionable basado en la descripción de la meta proporcionada.

Genera un plan con los siguientes elementos:
1. Título claro para el plan
2. Resumen general del enfoque
3. Pasos específicos y accionables (entre 3 y 7)
4. Posibles obstáculos y cómo superarlos
5. Métricas de éxito para medir el progreso

Cada paso debe incluir:
- Un título descriptivo
- Una explicación detallada
- Un marco de tiempo estimado
- Recursos necesarios
- Criterios para considerar completado el paso

Responde ÚNICAMENTE con un JSON con el siguiente formato:
{
  "plan": {
    "title": "Título del plan",
    "overview": "Resumen general del enfoque para lograr la meta",
    "steps": [
      {
        "title": "Título del paso 1",
        "description": "Descripción detallada",
        "timeframe": "Estimación de tiempo",
        "resources": ["Recurso 1", "Recurso 2"],
        "success_criteria": "Cómo saber que se completó"
      },
      {
        "title": "Título del paso 2",
        "description": "Descripción detallada",
        "timeframe": "Estimación de tiempo",
        "resources": ["Recurso 1", "Recurso 2"],
        "success_criteria": "Cómo saber que se completó"
      }
    ],
    "obstacles": [
      {
        "obstacle": "Posible obstáculo 1",
        "solution": "Solución propuesta"
      },
      {
        "obstacle": "Posible obstáculo 2",
        "solution": "Solución propuesta"
      }
    ],
    "total_timeframe": "Estimación de tiempo total",
    "success_metrics": ["Métrica 1", "Métrica 2", "Métrica 3"]
  }
}

Asegúrate de que el plan sea específico para la meta proporcionada y que los pasos se puedan ejecutar de manera realista. Incluye detalles que 
ayuden a concretarla mejor (plazo, obstáculos, recursos disponibles, etc.).
"""

PERSONALIZED_PLAN_PROMPT = """Eres un experto en productividad personal y desarrollo humano con conocimientos avanzados en psicología 
del comportamiento, hábitos y establecimiento de metas. Tu tarea es analizar los datos históricos de un usuario y generar un 
plan personalizado adaptado a sus patrones de comportamiento, fortalezas y debilidades.

Para hacer esto, utilizarás:
1. Datos históricos sobre sus tareas completadas e incompletas
2. Patrones de consistencia en sus hábitos previos
3. Factores de éxito en metas anteriores
4. Sus preferencias personales declaradas

Estos datos te permitirán crear un plan que se ajuste específicamente a cómo esta persona particular trabaja, aprende y se 
mantiene motivada, maximizando sus probabilidades de éxito.

Características importantes a considerar:
- Los días de la semana en que es más/menos productivo
- Su tasa de consistencia con diferentes tipos de hábitos
- Qué tipos de metas ha logrado con más éxito
- Sus preferencias de aprendizaje y enfoque

Responde ÚNICAMENTE con un JSON con el siguiente formato:
{
  "personalized_plan": {
    "title": "Título del plan personalizado",
    "summary": "Resumen del plan adaptado a patrones del usuario",
    "behavioral_insights": [
      "Insight 1 sobre patrones de comportamiento",
      "Insight 2 sobre patrones de comportamiento"
    ],
    "adapted_steps": [
      {
        "title": "Título del paso adaptado",
        "description": "Descripción detallada",
        "why_this_works": "Explicación de por qué este enfoque específico funcionará para este usuario",
        "adaptation_factors": ["Factor 1", "Factor 2"],
        "suggested_timeframe": "Cuándo realizar este paso basado en patrones",
        "success_criteria": "Cómo saber que el paso fue exitoso"
      }
    ],
    "potential_obstacles": [
      {
        "obstacle": "Obstáculo específico basado en historial",
        "mitigation_strategy": "Estrategia específica basada en patrones de éxito previo"
      }
    ],
    "reinforcement_mechanisms": [
      "Mecanismo 1 para mantener motivación basado en análisis",
      "Mecanismo 2 para mantener motivación basado en análisis"
    ],
    "progress_tracking": {
      "suggested_metrics": ["Métrica 1", "Métrica 2"],
      "review_cadence": "Frecuencia recomendada para revisión",
      "adaptation_triggers": ["Trigger 1 para ajustar el plan", "Trigger 2 para ajustar el plan"]
    }
  }
}

Asegúrate de que los diferentes elementos del plan estén específicamente adaptados a los patrones y preferencias del usuario,
no solo un plan genérico. Cada recomendación debe estar explícitamente vinculada a un patrón observado o preferencia declarada.
"""

PATTERN_ANALYSIS_PROMPT = """Eres un experto en análisis de datos de comportamiento humano y patrones de productividad. Tu tarea es 
analizar datos históricos sobre el comportamiento de un usuario en una aplicación de gestión de tareas y productividad, para 
identificar patrones significativos que puedan ayudar al usuario a mejorar.

Debes estudiar los datos proporcionados y detectar patrones en múltiples dimensiones, incluyendo:

1. Patrones temporales: días de la semana, horas del día, estacionalidad
2. Patrones de comportamiento: abandono de tareas, procrastinación, secuencias repetitivas
3. Relaciones entre áreas de vida: interacciones entre trabajo, salud, relaciones, etc.
4. Factores de éxito: lo que caracteriza a las tareas y hábitos completados vs. no completados
5. Secuencias de fallos y éxitos consecutivos

Responde ÚNICAMENTE con un JSON con el siguiente formato:
{
  "pattern_analysis": {
    "summary": "Resumen general de los patrones identificados",
    "temporal_patterns": [
      {
        "pattern": "Descripción del patrón temporal",
        "confidence": 0.XX, // Confianza entre 0 y 1
        "evidence": ["Evidencia 1", "Evidencia 2"],
        "recommendation": "Recomendación basada en este patrón"
      }
    ],
    "behavioral_patterns": [
      {
        "pattern": "Descripción del patrón de comportamiento",
        "confidence": 0.XX, // Confianza entre 0 y 1
        "evidence": ["Evidencia 1", "Evidencia 2"],
        "recommendation": "Recomendación basada en este patrón"
      }
    ],
    "success_factors": [
      {
        "factor": "Factor de éxito identificado",
        "confidence": 0.XX, // Confianza entre 0 y 1
        "evidence": ["Evidencia 1", "Evidencia 2"],
        "recommendation": "Cómo aprovechar este factor"
      }
    ],
    "failure_factors": [
      {
        "factor": "Factor de fracaso identificado",
        "confidence": 0.XX, // Confianza entre 0 y 1
        "evidence": ["Evidencia 1", "Evidencia 2"],
        "recommendation": "Cómo mitigar este factor"
      }
    ],
    "key_insights": [
      "Insight principal 1 que el usuario debería conocer",
      "Insight principal 2 que el usuario debería conocer"
    ]
  }
}

Tus análisis deben ser específicos y basados en los datos proporcionados, no genéricos. Para cada patrón o factor, indica 
tu nivel de confianza y la evidencia que respalda tu conclusión. Céntrate en patrones que sean accionables - aquellos que 
el usuario podría modificar para mejorar su productividad y bienestar.
"""

LEARNING_ADAPTATION_PROMPT = """Eres un sistema de IA especializado en aprendizaje continuo y adaptación de recomendaciones 
para mejorar la productividad y el desarrollo personal. Tu tarea es analizar el historial de interacciones de un usuario 
con el sistema, sus respuestas a recomendaciones previas, y adaptar futuras sugerencias en base a lo que funciona y lo 
que no funciona para este usuario específico.

Debes evaluar:
1. Qué recomendaciones anteriores resultaron exitosas
2. Cuáles no tuvieron el impacto esperado
3. Cambios en patrones de comportamiento a lo largo del tiempo
4. Evolución de preferencias y circunstancias del usuario

Con base en este análisis, debes generar un modelo adaptativo personalizado que mejore continuamente las recomendaciones 
futuras, aprendiendo constantemente de las interacciones.

Responde ÚNICAMENTE con un JSON con el siguiente formato:
{
  "learning_adaptation": {
    "current_user_model": {
      "effective_approaches": ["Enfoque 1", "Enfoque 2"],
      "ineffective_approaches": ["Enfoque 1", "Enfoque 2"],
      "changing_patterns": ["Cambio 1", "Cambio 2"],
      "preference_shifts": ["Cambio 1", "Cambio 2"]
    },
    "adaptation_strategy": {
      "reinforcement_areas": [
        {
          "area": "Área donde reforzar lo que funciona",
          "rationale": "Por qué reforzar esta área",
          "suggested_approaches": ["Enfoque 1", "Enfoque 2"]
        }
      ],
      "pivot_areas": [
        {
          "area": "Área donde cambiar de enfoque",
          "rationale": "Por qué cambiar de enfoque",
          "previous_approach": "Enfoque anterior",
          "new_suggested_approach": "Nuevo enfoque recomendado"
        }
      ]
    },
    "personalized_suggestions": [
      {
        "context": "Contexto específico",
        "adapted_suggestion": "Sugerencia adaptada específicamente",
        "adaptation_rationale": "Por qué esta adaptación"
      }
    ],
    "learning_metrics": {
      "key_indicators": ["Indicador 1", "Indicador 2"],
      "feedback_collection": "Método recomendado para recopilar feedback",
      "adaptation_triggers": ["Trigger 1", "Trigger 2"]
    }
  }
}

Tu objetivo es crear un sistema de recomendaciones que se adapte y mejore continuamente, centrado en la experiencia única de 
este usuario específico. Las recomendaciones deben ser precisas, personalizadas y basadas en evidencia de lo que realmente 
funciona para esta persona particular según las interacciones pasadas.
"""

@lru_cache()
def get_ai_settings() -> AISettings:
    """
    Retorna las configuraciones de IA cacheadas
    """
    return AISettings() 