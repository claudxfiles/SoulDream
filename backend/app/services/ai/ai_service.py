import json
import logging
import os
from typing import Dict, List, Any, Optional, AsyncGenerator, Tuple
from datetime import datetime
from pydantic import BaseModel
from openai import AsyncOpenAI
from app.core.ai_config import (
    get_ai_settings,
    GOAL_DETECTION_PROMPT,
    GOAL_PLAN_PROMPT,
    CHAT_SYSTEM_PROMPT,
    PERSONALIZED_PLAN_PROMPT,
    PATTERN_ANALYSIS_PROMPT,
    LEARNING_ADAPTATION_PROMPT
)
from app.schemas.ai import ChatMessage, MessageRole, StreamingResponse
from app.schemas.goal import GoalMetadata
import dotenv

# Configuración mejorada del logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Crear un formateador para los logs
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Crear y configurar el manejador para archivo
log_file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'logs', 'ai_assistant.log')
os.makedirs(os.path.dirname(log_file_path), exist_ok=True)

file_handler = logging.FileHandler(log_file_path)
file_handler.setLevel(logging.INFO)
file_handler.setFormatter(formatter)

# Crear y configurar el manejador para consola
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_handler.setFormatter(formatter)

# Agregar los manejadores al logger
logger.addHandler(file_handler)
logger.addHandler(console_handler)

class AIService:
    """
    Servicio para interactuar con la API de OpenRouter
    """
    def __init__(self):
        """
        Inicializa el servicio con la configuración desde variables de entorno
        """
        self.api_key = None
        self.api_key_source = None
        self._initialize_api_key()
        
        self.base_url = get_ai_settings().OPENROUTER_BASE_URL
        self.model = get_ai_settings().OPENROUTER_DEFAULT_MODEL
        self.referer = get_ai_settings().OPENROUTER_REFERER
            
    def _initialize_api_key(self) -> None:
        """
        Inicializa la API key intentando diferentes fuentes
        """
        # 1. Intentar desde .env
        env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), '.env')
        logger.info(f"Intentando cargar API key desde: {env_path}")
        dotenv.load_dotenv(env_path)
        
        try:
            with open(env_path, 'r') as f:
                env_content = f.read()
                for line in env_content.split('\n'):
                    if line.startswith('OPENROUTER_API_KEY='):
                        self.api_key = line.split('=', 1)[1].strip()
                        self.api_key_source = '.env file'
                        logger.info("API key encontrada en archivo .env")
                        return
        except Exception as e:
            logger.error(f"Error leyendo archivo .env: {str(e)}")

        # 2. Intentar desde settings
        try:
            settings_key = get_ai_settings().OPENROUTER_API_KEY
            if settings_key:
                self.api_key = settings_key
                self.api_key_source = 'settings'
                logger.info("API key encontrada en settings")
                return
        except Exception as e:
            logger.error(f"Error obteniendo API key desde settings: {str(e)}")

        logger.error("No se encontró API key en ninguna fuente")

    def check_api_key_status(self) -> Tuple[bool, str]:
        """
        Verifica el estado de la API key
        
        Returns:
            Tuple[bool, str]: (está_configurada, mensaje_de_estado)
        """
        if not self.api_key:
            return False, "API key no configurada"
        
        return True, f"API key configurada (fuente: {self.api_key_source})"

    async def _create_client(self) -> AsyncOpenAI:
        """
        Crea un cliente de OpenAI con la configuración correcta
        """
        is_configured, status = self.check_api_key_status()
        if not is_configured:
            raise ValueError(status)
            
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": self.referer,
            "X-Title": "SoulDream AI Assistant"
        }
        
        return AsyncOpenAI(
            api_key="ANON",
            base_url=self.base_url,
            default_headers=headers
        )

    async def _send_request(self, messages: List[Dict[str, str]], temperature: float = 0.7, max_tokens: int = 800, stream: bool = False) -> Any:
        """
        Envía una solicitud a la API de OpenRouter
        """
        if not self.api_key:
            raise ValueError("OpenRouter API key no configurada")
            
        client = await self._create_client()
        
        try:
            response = await client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=stream,
                extra_body={
                    "provider": {
                        "order": ["Groq", "Fireworks"],
                        "allow_fallbacks": False
                    }
                }
            )
            
            return response
        except Exception as e:
            logger.error(f"Error en OpenRouter API: {str(e)}")
            raise
        finally:
            await client.close()

    async def detect_goal_from_message(self, message: str) -> Optional[Dict[str, Any]]:
        """
        Detecta si un mensaje contiene una meta
        """
        try:
            messages = [
                {"role": "system", "content": GOAL_DETECTION_PROMPT},
                {"role": "user", "content": message}
            ]
            
            response = await self._send_request(
                messages=messages,
                temperature=get_ai_settings().TEMPERATURE_GOAL_DETECTION,
                max_tokens=get_ai_settings().MAX_TOKENS_GOAL_DETECTION
            )
            
            if response and response.choices:
                content = response.choices[0].message.content.strip()
                
                try:
                    data = json.loads(content)
                    logger.info("Meta detectada y parseada correctamente")
                    return data
                except json.JSONDecodeError as e:
                    logger.error(f"Error parseando respuesta JSON: {str(e)}")
                    return None
            
            return None
        except Exception as e:
            logger.error(f"Error detectando meta: {str(e)}")
            return None

    async def generate_goal_plan(self, goal_metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Genera un plan detallado para una meta
        """
        try:
            if not goal_metadata.get("has_goal", False) or "goal" not in goal_metadata:
                logger.error("No hay información de meta válida para generar un plan")
                return {"error": "No hay información de meta válida"}
                
            goal = goal_metadata["goal"]
            
            messages = [
                {"role": "system", "content": GOAL_PLAN_PROMPT},
                {"role": "user", "content": json.dumps(goal)}
            ]
            
            response = await self._send_request(
                messages=messages,
                temperature=get_ai_settings().TEMPERATURE_GOAL_PLAN,
                max_tokens=get_ai_settings().MAX_TOKENS_GOAL_PLAN
            )
            
            if response and response.choices:
                content = response.choices[0].message.content.strip()
                
                try:
                    data = json.loads(content)
                    logger.info("Plan generado correctamente")
                    return data
                except json.JSONDecodeError as e:
                    logger.error(f"Error parseando respuesta JSON: {str(e)}")
                    return {"error": f"Error procesando respuesta: {str(e)}"}
            
            return {"error": "No se pudo generar el plan"}
        except Exception as e:
            logger.error(f"Error generando plan: {str(e)}")
            return {"error": f"Error generando plan: {str(e)}"}

    async def chat_stream(self, messages: List[ChatMessage]):
        """
        Genera respuestas en streaming para el chat
        """
        try:
            # Verificar la API key
            if not self.api_key:
                yield StreamingResponse(
                    content="Error: API key no configurada",
                    role=MessageRole.ASSISTANT,
                    is_error=True,
                    is_complete=True
                )
                return

            # Formatear mensajes
            formatted_messages = [
                {"role": "system", "content": CHAT_SYSTEM_PROMPT}
            ] + [
                {"role": msg.role, "content": msg.content}
                for msg in messages
            ]
            
            # Crear cliente
            client = await self._create_client()
            
            try:
                # Obtener respuesta streaming
                response = await client.chat.completions.create(
                    model=self.model,
                    messages=formatted_messages,
                    temperature=get_ai_settings().TEMPERATURE_CHAT,
                    max_tokens=get_ai_settings().MAX_TOKENS_RESPONSE,
                    stream=True,
                    extra_body={
                        "provider": {
                            "order": ["Groq", "Fireworks"],
                            "allow_fallbacks": False
                        }
                    }
                )
                
                async for chunk in response:
                    if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                        yield StreamingResponse(
                            content=chunk.choices[0].delta.content,
                            role=MessageRole.ASSISTANT,
                            is_error=False,
                            is_complete=False
                        )
                
                # Señalar fin del streaming
                yield StreamingResponse(
                    content="",
                    role=MessageRole.ASSISTANT,
                    is_error=False,
                    is_complete=True
                )
                
            except Exception as e:
                logger.error(f"Error en streaming de chat: {str(e)}")
                yield StreamingResponse(
                    content=f"Error en la comunicación: {str(e)}",
                    role=MessageRole.ASSISTANT,
                    is_error=True,
                    is_complete=True
                )
            finally:
                await client.close()
                
        except Exception as e:
            logger.error(f"Error general en chat_stream: {str(e)}")
            yield StreamingResponse(
                content=f"Error en el servicio: {str(e)}",
                role=MessageRole.ASSISTANT,
                is_error=True,
                is_complete=True
            )

    def _format_messages(self, messages: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """
        Formatea los mensajes para la API de OpenRouter
        
        Args:
            messages: Lista de mensajes
            
        Returns:
            Lista de mensajes formateada
        """
        # Asegurarse que el primer mensaje es del sistema si no hay uno
        has_system = any(msg.get("role") == "system" for msg in messages)
        
        if not has_system:
            formatted = [{"role": "system", "content": CHAT_SYSTEM_PROMPT}]
            formatted.extend(messages)
            return formatted
            
        return messages

    async def generate_personalized_plan(self, 
                                        user_data: Dict[str, Any], 
                                        goal_type: str, 
                                        preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Genera un plan personalizado basado en datos históricos del usuario y sus preferencias
        
        Args:
            user_data: Datos históricos del usuario (tareas, hábitos, metas)
            goal_type: Tipo de meta para la que se generará el plan
            preferences: Preferencias específicas del usuario
            
        Returns:
            Plan personalizado adaptado al usuario
        """
        try:
            # Preparar análisis de los datos históricos
            task_history = user_data.get("tasks", [])
            habit_history = user_data.get("habits", [])
            goal_history = user_data.get("goals", [])
            
            # Analizar patrones de comportamiento
            completion_patterns = self._analyze_completion_patterns(task_history)
            habit_consistency = self._analyze_habit_consistency(habit_history)
            success_factors = self._analyze_goal_success_factors(goal_history)
            
            # Considerar preferencias del usuario
            user_preferences = {
                "preferred_time_blocks": preferences.get("preferred_time_blocks", []),
                "difficulty_preference": preferences.get("difficulty_preference", "balanced"),
                "priority_areas": preferences.get("priority_areas", []),
                "learning_style": preferences.get("learning_style", "balanced")
            }
            
            # Construir contexto para la IA
            context = f"""
            # Análisis de usuario para generación de plan personalizado
            
            ## Tipo de meta
            {goal_type}
            
            ## Patrones de cumplimiento de tareas
            {json.dumps(completion_patterns, indent=2)}
            
            ## Consistencia de hábitos
            {json.dumps(habit_consistency, indent=2)}
            
            ## Factores de éxito en metas previas
            {json.dumps(success_factors, indent=2)}
            
            ## Preferencias del usuario
            {json.dumps(user_preferences, indent=2)}
            """
            
            # Preparar mensaje para la IA
            messages = [
                {"role": "system", "content": PERSONALIZED_PLAN_PROMPT},
                {"role": "user", "content": context}
            ]
            
            # Configuración específica para planificación personalizada
            payload = {
                "model": self.model,
                "messages": messages,
                "temperature": get_ai_settings().TEMPERATURE_PERSONALIZED_PLAN,
                "max_tokens": get_ai_settings().MAX_TOKENS_PERSONALIZED_PLAN,
                "stream": False
            }
            
            # Enviar solicitud
            response = await self._send_request(payload)
            
            if "choices" in response and len(response["choices"]) > 0:
                response_text = response["choices"][0]["message"]["content"]
                
                # Extraer JSON del texto
                try:
                    start_idx = response_text.find('{')
                    end_idx = response_text.rfind('}')
                    
                    if start_idx >= 0 and end_idx > start_idx:
                        json_text = response_text[start_idx:end_idx+1]
                        data = json.loads(json_text)
                        
                        if "personalized_plan" in data:
                            logger.info(f"Plan personalizado generado para {goal_type}")
                            return data
                    
                    logger.warning("No se pudo encontrar un JSON válido en la respuesta del plan personalizado")
                    return {"error": "Formato de respuesta inválido"}
                except (json.JSONDecodeError, ValueError) as e:
                    logger.warning(f"Error decodificando JSON del plan personalizado: {e}")
                    return {"error": f"Error procesando respuesta: {str(e)}"}
            else:
                logger.error(f"Respuesta inválida de la API: {response}")
                return {"error": "No se pudo generar el plan personalizado"}
        except Exception as e:
            logger.error(f"Error generando plan personalizado: {str(e)}")
            return {"error": f"Error generando plan personalizado: {str(e)}"}

    def _analyze_completion_patterns(self, task_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analiza patrones en la completitud de tareas
        
        Args:
            task_history: Historial de tareas del usuario
            
        Returns:
            Análisis de patrones de completitud
        """
        if not task_history:
            return {"no_data": True}
            
        total_tasks = len(task_history)
        completed_tasks = sum(1 for task in task_history if task.get("completed", False))
        completion_rate = (completed_tasks / total_tasks) if total_tasks > 0 else 0
        
        # Análisis por días de la semana
        days_analysis = {
            "monday": {"total": 0, "completed": 0},
            "tuesday": {"total": 0, "completed": 0},
            "wednesday": {"total": 0, "completed": 0},
            "thursday": {"total": 0, "completed": 0},
            "friday": {"total": 0, "completed": 0},
            "saturday": {"total": 0, "completed": 0},
            "sunday": {"total": 0, "completed": 0}
        }
        
        for task in task_history:
            if "due_date" in task:
                try:
                    due_date = datetime.fromisoformat(task["due_date"].replace("Z", "+00:00"))
                    day_name = due_date.strftime("%A").lower()
                    if day_name in days_analysis:
                        days_analysis[day_name]["total"] += 1
                        if task.get("completed", False):
                            days_analysis[day_name]["completed"] += 1
                except (ValueError, TypeError):
                    pass
        
        # Calcular tasa de completitud por día
        for day, counts in days_analysis.items():
            if counts["total"] > 0:
                counts["completion_rate"] = counts["completed"] / counts["total"]
            else:
                counts["completion_rate"] = 0
        
        # Encontrar mejor día y peor día
        best_day = max(days_analysis.items(), key=lambda x: x[1].get("completion_rate", 0))
        worst_day = min(days_analysis.items(), key=lambda x: x[1].get("completion_rate", 0) if x[1].get("total", 0) > 0 else 1)
        
        return {
            "overall_completion_rate": completion_rate,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "days_analysis": days_analysis,
            "best_day": best_day[0],
            "worst_day": worst_day[0]
        }
        
    def _analyze_habit_consistency(self, habit_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analiza la consistencia en hábitos
        
        Args:
            habit_history: Historial de hábitos del usuario
            
        Returns:
            Análisis de consistencia
        """
        if not habit_history:
            return {"no_data": True}
            
        habits_analysis = {}
        
        # Agrupar registros por hábito
        for habit_log in habit_history:
            habit_id = habit_log.get("habit_id", "unknown")
            if habit_id not in habits_analysis:
                habits_analysis[habit_id] = {
                    "name": habit_log.get("habit_name", "Hábito desconocido"),
                    "total_logs": 0,
                    "completed_logs": 0,
                    "streak": habit_log.get("current_streak", 0),
                    "best_streak": habit_log.get("best_streak", 0)
                }
            
            habits_analysis[habit_id]["total_logs"] += 1
            if habit_log.get("completed", False):
                habits_analysis[habit_id]["completed_logs"] += 1
        
        # Calcular consistencia por hábito
        for habit_id, analysis in habits_analysis.items():
            if analysis["total_logs"] > 0:
                analysis["consistency_rate"] = analysis["completed_logs"] / analysis["total_logs"]
            else:
                analysis["consistency_rate"] = 0
        
        # Identificar hábitos más y menos consistentes
        if habits_analysis:
            most_consistent = max(habits_analysis.items(), key=lambda x: x[1].get("consistency_rate", 0))
            least_consistent = min(habits_analysis.items(), key=lambda x: x[1].get("consistency_rate", 0))
            
            return {
                "habits_count": len(habits_analysis),
                "habits_details": habits_analysis,
                "most_consistent_habit": {
                    "id": most_consistent[0],
                    "name": most_consistent[1]["name"],
                    "consistency_rate": most_consistent[1]["consistency_rate"]
                },
                "least_consistent_habit": {
                    "id": least_consistent[0],
                    "name": least_consistent[1]["name"],
                    "consistency_rate": least_consistent[1]["consistency_rate"]
                }
            }
        else:
            return {"no_data": True}
    
    def _analyze_goal_success_factors(self, goal_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analiza factores de éxito en metas previas
        
        Args:
            goal_history: Historial de metas del usuario
            
        Returns:
            Análisis de factores de éxito
        """
        if not goal_history:
            return {"no_data": True}
            
        total_goals = len(goal_history)
        completed_goals = sum(1 for goal in goal_history if goal.get("status", "") == "completed")
        success_rate = (completed_goals / total_goals) if total_goals > 0 else 0
        
        # Análisis por tipo de meta
        types_analysis = {}
        for goal in goal_history:
            goal_type = goal.get("type", "unknown")
            
            if goal_type not in types_analysis:
                types_analysis[goal_type] = {"total": 0, "completed": 0}
            
            types_analysis[goal_type]["total"] += 1
            if goal.get("status", "") == "completed":
                types_analysis[goal_type]["completed"] += 1
        
        # Calcular tasa de éxito por tipo
        for goal_type, counts in types_analysis.items():
            if counts["total"] > 0:
                counts["success_rate"] = counts["completed"] / counts["total"]
            else:
                counts["success_rate"] = 0
        
        # Identificar tipos más y menos exitosos
        if types_analysis:
            most_successful = max(types_analysis.items(), key=lambda x: x[1].get("success_rate", 0))
            least_successful = min(types_analysis.items(), key=lambda x: x[1].get("success_rate", 0) 
                                 if x[1].get("total", 0) > 0 else 1)
        else:
            most_successful = ("unknown", {"success_rate": 0})
            least_successful = ("unknown", {"success_rate": 0})
        
        return {
            "overall_success_rate": success_rate,
            "total_goals": total_goals,
            "completed_goals": completed_goals,
            "types_analysis": types_analysis,
            "most_successful_type": most_successful[0],
            "least_successful_type": least_successful[0]
        }

    async def _analyze_patterns(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analiza patrones avanzados en los datos históricos del usuario
        
        Args:
            user_data: Datos históricos del usuario
            
        Returns:
            Análisis de patrones
        """
        try:
            # Preparar los datos para el análisis
            data_context = json.dumps(user_data, indent=2)
            
            # Preparar mensaje para la IA
            messages = [
                {"role": "system", "content": PATTERN_ANALYSIS_PROMPT},
                {"role": "user", "content": f"Analiza los siguientes datos de usuario para identificar patrones:\n\n{data_context}"}
            ]
            
            # Configuración específica para análisis de patrones
            payload = {
                "model": self.model,
                "messages": messages,
                "temperature": get_ai_settings().TEMPERATURE_PATTERN_ANALYSIS,
                "max_tokens": get_ai_settings().MAX_TOKENS_PATTERN_ANALYSIS,
                "stream": False
            }
            
            # Enviar solicitud
            response = await self._send_request(payload)
            
            if "choices" in response and len(response["choices"]) > 0:
                response_text = response["choices"][0]["message"]["content"]
                
                # Extraer JSON del texto
                try:
                    start_idx = response_text.find('{')
                    end_idx = response_text.rfind('}')
                    
                    if start_idx >= 0 and end_idx > start_idx:
                        json_text = response_text[start_idx:end_idx+1]
                        data = json.loads(json_text)
                        
                        if "pattern_analysis" in data:
                            logger.info("Análisis de patrones completado")
                            return data
                    
                    logger.warning("No se pudo encontrar un JSON válido en la respuesta de análisis de patrones")
                    return {"error": "Formato de respuesta inválido"}
                except (json.JSONDecodeError, ValueError) as e:
                    logger.warning(f"Error decodificando JSON del análisis de patrones: {e}")
                    return {"error": f"Error procesando respuesta: {str(e)}"}
            else:
                logger.error(f"Respuesta inválida de la API: {response}")
                return {"error": "No se pudo generar el análisis de patrones"}
        except Exception as e:
            logger.error(f"Error en análisis de patrones: {str(e)}")
            return {"error": f"Error en análisis de patrones: {str(e)}"}
    
    async def analyze_patterns(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Interfaz pública para analizar patrones avanzados
        
        Args:
            user_data: Datos históricos del usuario
            
        Returns:
            Análisis de patrones
        """
        return await self._analyze_patterns(user_data)
    
    async def generate_learning_adaptation(self, 
                                         user_data: Dict[str, Any], 
                                         interaction_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Genera adaptaciones basadas en aprendizaje continuo sobre las interacciones del usuario
        
        Args:
            user_data: Datos históricos del usuario
            interaction_history: Historial de interacciones y respuestas a recomendaciones previas
            
        Returns:
            Modelo adaptativo personalizado
        """
        try:
            # Preparar los datos para el análisis
            context_data = {
                "user_data": user_data,
                "interaction_history": interaction_history
            }
            
            data_context = json.dumps(context_data, indent=2)
            
            # Preparar mensaje para la IA
            messages = [
                {"role": "system", "content": LEARNING_ADAPTATION_PROMPT},
                {"role": "user", "content": f"Analiza estos datos de interacciones de usuario para generar adaptaciones:\n\n{data_context}"}
            ]
            
            # Configuración específica para adaptación de aprendizaje
            payload = {
                "model": self.model,
                "messages": messages,
                "temperature": get_ai_settings().TEMPERATURE_LEARNING_ADAPTATION,
                "max_tokens": get_ai_settings().MAX_TOKENS_LEARNING_ADAPTATION,
                "stream": False
            }
            
            # Enviar solicitud
            response = await self._send_request(payload)
            
            if "choices" in response and len(response["choices"]) > 0:
                response_text = response["choices"][0]["message"]["content"]
                
                # Extraer JSON del texto
                try:
                    start_idx = response_text.find('{')
                    end_idx = response_text.rfind('}')
                    
                    if start_idx >= 0 and end_idx > start_idx:
                        json_text = response_text[start_idx:end_idx+1]
                        data = json.loads(json_text)
                        
                        if "learning_adaptation" in data:
                            logger.info("Adaptación de aprendizaje generada")
                            return data
                    
                    logger.warning("No se pudo encontrar un JSON válido en la respuesta de adaptación")
                    return {"error": "Formato de respuesta inválido"}
                except (json.JSONDecodeError, ValueError) as e:
                    logger.warning(f"Error decodificando JSON de la adaptación: {e}")
                    return {"error": f"Error procesando respuesta: {str(e)}"}
            else:
                logger.error(f"Respuesta inválida de la API: {response}")
                return {"error": "No se pudo generar la adaptación de aprendizaje"}
        except Exception as e:
            logger.error(f"Error generando adaptación de aprendizaje: {str(e)}")
            return {"error": f"Error generando adaptación de aprendizaje: {str(e)}"}

    def _extract_goal_metadata(self, text: str) -> Optional[Dict[str, Any]]:
        """
        Extrae metadatos de metas del texto de respuesta
        
        Args:
            text: Texto de respuesta a analizar
            
        Returns:
            Diccionario con metadatos de la meta o None si no se encuentra
        """
        try:
            # Buscar patrones comunes de metas financieras
            financial_keywords = [
                "ahorrar", "invertir", "presupuesto", "gastos", "ingresos",
                "dinero", "finanzas", "comprar", "pagar", "deuda"
            ]
            
            # Buscar patrones comunes de metas de salud
            health_keywords = [
                "ejercicio", "dieta", "nutrición", "peso", "dormir",
                "meditar", "yoga", "correr", "gimnasio", "salud"
            ]
            
            # Buscar patrones comunes de metas de aprendizaje
            learning_keywords = [
                "estudiar", "aprender", "curso", "certificación", "carrera",
                "educación", "desarrollo", "habilidades", "conocimiento", "práctica"
            ]
            
            # Detectar tipo de meta basado en keywords
            text_lower = text.lower()
            
            if any(keyword in text_lower for keyword in financial_keywords):
                goal_type = "financial"
            elif any(keyword in text_lower for keyword in health_keywords):
                goal_type = "health"
            elif any(keyword in text_lower for keyword in learning_keywords):
                goal_type = "learning"
            else:
                goal_type = "other"
            
            # Extraer detalles básicos
            goal_data = {
                "has_goal": True,
                "goal": {
                    "type": goal_type,
                    "description": text.strip(),
                    "detected_keywords": [
                        keyword for keyword in financial_keywords + health_keywords + learning_keywords
                        if keyword in text_lower
                    ]
                }
            }
            
            return goal_data
            
        except Exception as e:
            logger.error(f"Error extrayendo metadatos de meta: {str(e)}")
            return None

# Instancia global del servicio
openrouter_service = AIService() 