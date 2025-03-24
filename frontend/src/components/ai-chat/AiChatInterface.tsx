'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { 
  Send, 
  Mic, 
  Image as ImageIcon, 
  Paperclip, 
  MoreVertical, 
  Sparkles, 
  Clock, 
  Calendar, 
  DollarSign, 
  Dumbbell, 
  Target,
  CheckSquare,
  User,
  MessageCircle,
  Activity
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { GoalChatIntegration } from './GoalChatIntegration';
import { PersonalizedPlanGenerator } from './PersonalizedPlanGenerator';
import { PatternAnalyzer } from './PatternAnalyzer';
import { LearningAdaptation } from './LearningAdaptation';
import { Goal } from '@/types/goal';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Tipos para los mensajes
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
}

// Componente para un mensaje individual
const ChatMessage = ({ message }: { message: Message }) => {
  const isUser = message.sender === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div 
        className={`max-w-[80%] rounded-lg p-3 ${
          isUser 
            ? 'bg-indigo-600 text-white rounded-br-none' 
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <div className={`text-xs mt-1 ${isUser ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'}`}>
          {format(message.timestamp, 'hh:mm a', { locale: es })}
          {message.status === 'sending' && ' · Enviando...'}
          {message.status === 'error' && ' · Error al enviar'}
        </div>
      </div>
    </div>
  );
};

// Componente para sugerencias de chat
const ChatSuggestions = ({ onSelectSuggestion }: { onSelectSuggestion: (suggestion: string) => void }) => {
  const suggestions = [
    {
      icon: <Target className="h-4 w-4" />,
      text: "Ayúdame a establecer una meta financiera"
    },
    {
      icon: <Clock className="h-4 w-4" />,
      text: "¿Cómo puedo organizar mejor mi tiempo?"
    },
    {
      icon: <Calendar className="h-4 w-4" />,
      text: "Necesito planificar mi semana"
    },
    {
      icon: <DollarSign className="h-4 w-4" />,
      text: "Quiero ahorrar para comprar una moto"
    },
    {
      icon: <Dumbbell className="h-4 w-4" />,
      text: "Ayúdame con una rutina de ejercicios"
    }
  ];
  
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          onClick={() => onSelectSuggestion(suggestion.text)}
        >
          <span className="mr-2 text-indigo-600 dark:text-indigo-400">{suggestion.icon}</span>
          {suggestion.text}
        </button>
      ))}
    </div>
  );
};

export function AiChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "¡Hola! Soy tu asistente personal en SoulDream. ¿En qué puedo ayudarte hoy?",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [lastUserMessage, setLastUserMessage] = useState('');
  const [createdGoals, setCreatedGoals] = useState<Partial<Goal>[]>([]);
  const [createdTasks, setCreatedTasks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [messageMetadata, setMessageMetadata] = useState<any>(null);
  const [showPlanGenerator, setShowPlanGenerator] = useState(false);
  const [showPatternAnalyzer, setShowPatternAnalyzer] = useState(false);
  const [showLearningSystem, setShowLearningSystem] = useState(false);
  const [aiSettings, setAiSettings] = useState({
    suggestionsFrequency: 2,
    detailLevel: 1,
    aiPersonality: 'balanced',
    // Otros ajustes configurables
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  // Scroll al final de los mensajes cuando se añade uno nuevo
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    // Crear un nuevo mensaje del usuario
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
      status: 'sending'
    };
    
    // Actualizar el estado con el mensaje del usuario
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setLastUserMessage(inputValue);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Preparar el historial de mensajes para enviar al backend
      const messageHistory = messages.map(msg => ({
        content: msg.content,
        sender: msg.sender,
        timestamp: msg.timestamp
      }));
      
      // Enviar solicitud a la API
      const response = await fetch('/api/v1/ai/openrouter-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          model: "qwen/qwq-32b:online",
          messageHistory
        }),
      });
      
      if (!response.ok) {
        throw new Error('Error al comunicarse con la API');
      }
      
      const data = await response.json();
      
      // Actualizar el estado del mensaje a enviado
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg
        )
      );
      
      // Guardar los metadatos para la detección de metas
      if (data.metadata) {
        setMessageMetadata(data.metadata);
      }
      
      // Crear mensaje de respuesta de la IA
      const aiMessage: Message = {
        id: `msg-${Date.now()}`,
        content: data.response,
        sender: 'ai',
        timestamp: new Date()
      };
      
      // Añadir mensaje de la IA a la conversación
      setMessages(prevMessages => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      
      // Actualizar el estado del mensaje a error
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === userMessage.id ? { ...msg, status: 'error' } : msg
        )
      );
      
      // Mostrar mensaje de error
      toast({
        title: 'Error',
        description: 'No se pudo enviar el mensaje. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSelectSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const handleCreateGoal = (goalData: Partial<Goal>) => {
    // Añadir la meta a la lista de metas creadas
    const newGoal = {
      ...goalData,
      id: `goal-${Date.now()}` // Generar un ID temporal
    };
    
    setCreatedGoals(prev => [...prev, newGoal]);
    
    // Generar respuesta de la IA confirmando la creación de la meta
    const aiResponse = `¡Excelente! He creado una meta para "${goalData.title}". 
    
He generado un plan personalizado con ${goalData.steps?.length || 0} pasos a seguir para alcanzar esta meta. Puedes verlo en la sección de Metas o gestionar los pasos directamente desde el chat.

¿Te gustaría que te ayude a establecer recordatorios para los pasos más importantes?`;
    
    // Añadir respuesta de la IA
    const aiMessage: Message = {
      id: `msg-${Date.now()}`,
      content: aiResponse,
      sender: 'ai',
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, aiMessage]);
    
    // En una implementación real, aquí se enviaría la meta al backend
    // para guardarla en la base de datos
  };
  
  const handleCreateTask = (taskTitle: string, goalId: string) => {
    // Añadir la tarea a la lista de tareas creadas
    setCreatedTasks(prev => [...prev, taskTitle]);
    
    // Encontrar la meta relacionada
    const relatedGoal = createdGoals.find(goal => goal.id === goalId);
    
    // Generar respuesta de la IA confirmando la creación de la tarea
    const aiResponse = `He creado una tarea para "${taskTitle}"${relatedGoal ? ` relacionada con tu meta "${relatedGoal.title}"` : ''}.
    
Puedes ver y gestionar esta tarea en tu tablero de tareas. ¿Quieres que establezca una fecha límite para esta tarea?`;
    
    // Añadir respuesta de la IA
    const aiMessage: Message = {
      id: `msg-${Date.now()}`,
      content: aiResponse,
      sender: 'ai',
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, aiMessage]);
    
    // En una implementación real, aquí se enviaría la tarea al backend
    // para guardarla en la base de datos
  };

  const handleViewGoals = () => {
    // Navegar a la página de metas
    router.push('/dashboard/goals');
  };
  
  const handleViewTasks = () => {
    // Navegar a la página de tareas
    router.push('/dashboard/tasks');
  };
  
  // Mock de datos de usuario para los componentes
  const mockUserData = {
    tasks: [
      { id: 1, title: "Completar informe trimestral", status: "completed", due_date: "2023-06-10", priority: "high", completed_on: "2023-06-09" },
      { id: 2, title: "Reunión con el equipo de marketing", status: "completed", due_date: "2023-06-12", priority: "medium", completed_on: "2023-06-12" },
      { id: 3, title: "Revisar propuesta de proyecto", status: "pending", due_date: "2023-06-15", priority: "high" },
      { id: 4, title: "Actualizar documentación técnica", status: "pending", due_date: "2023-06-17", priority: "medium" },
      { id: 5, title: "Preparar presentación para cliente", status: "completed", due_date: "2023-06-08", priority: "high", completed_on: "2023-06-07" }
    ],
    habits: [
      { id: 1, title: "Ejercicio matutino", frequency: "daily", streak: 15, last_checked: "2023-06-14" },
      { id: 2, title: "Lectura", frequency: "daily", streak: 8, last_checked: "2023-06-14" },
      { id: 3, title: "Meditación", frequency: "daily", streak: 5, last_checked: "2023-06-14" },
      { id: 4, title: "Aprender algo nuevo", frequency: "weekly", streak: 3, last_checked: "2023-06-11" }
    ],
    goals: [
      { id: 1, title: "Completar curso de desarrollo web", progress: 75, target_date: "2023-07-30", category: "learning" },
      { id: 2, title: "Ahorrar para vacaciones", progress: 50, target_date: "2023-12-15", category: "finance" },
      { id: 3, title: "Correr un medio maratón", progress: 60, target_date: "2023-09-10", category: "fitness" }
    ],
    completionStats: {
      tasks: { completed: 25, total: 35 },
      habits: { consistency: 0.85 },
      goals: { achieved: 4, inProgress: 3, total: 8 }
    },
    preferences: {
      workHours: { start: "08:00", end: "17:00" },
      focusTime: { morning: true, afternoon: false, evening: true },
      preferredCategories: ["productivity", "learning", "fitness"]
    }
  };
  
  // Mock para el historial de interacciones
  const mockInteractionHistory = [
    { 
      timestamp: "2023-06-10T09:15:00", 
      type: "goal_creation", 
      details: { goal: "Completar curso de desarrollo web" } 
    },
    { 
      timestamp: "2023-06-11T14:30:00", 
      type: "task_completion", 
      details: { task: "Revisar módulo 3 del curso" } 
    },
    { 
      timestamp: "2023-06-12T08:45:00", 
      type: "chat_interaction", 
      details: { query: "¿Cómo puedo mejorar mi productividad?", satisfaction: 0.9 } 
    },
    { 
      timestamp: "2023-06-13T16:20:00", 
      type: "habit_streak", 
      details: { habit: "Ejercicio matutino", streak: 10 } 
    }
  ];
  
  // Manejador para la creación de un plan personalizado
  const handlePlanCreated = (plan) => {
    // Crear un mensaje que resume el plan generado
    const planSummary = `
      He generado un plan personalizado para ti:
      
      **${plan.title}**
      
      Este plan se enfoca en ${plan.focus_areas.join(', ')} y tiene una duración de ${plan.duration_weeks} semanas.
      
      Incluye:
      - ${plan.num_tasks} tareas
      - ${plan.num_habits} hábitos recomendados
      - ${plan.num_milestones} hitos principales
      
      El plan está diseñado considerando tu estilo de productividad ${plan.productivity_style} y tus preferencias de ${plan.preferences.join(', ')}.
    `;
    
    // Añadir mensaje a la conversación
    setMessages(prev => [
      ...prev, 
      { role: 'assistant', content: planSummary }
    ]);
    
    // Cerrar el generador de planes
    setShowPlanGenerator(false);
  };
  
  // Manejador para cuando se completa el análisis de patrones
  const handleAnalysisComplete = (analysis) => {
    // Crear un mensaje con los insights principales del análisis
    const analysisSummary = `
      He analizado tus patrones de actividad y estos son los principales insights:
      
      **Resumen:**
      ${analysis.summary}
      
      **Patrones Clave:**
      ${analysis.key_insights.slice(0, 3).map(insight => `- ${insight}`).join('\n')}
      
      **Factores de Éxito:**
      ${analysis.success_factors.slice(0, 2).map(factor => `- ${factor.factor}: ${factor.recommendation}`).join('\n')}
    `;
    
    // Añadir mensaje a la conversación
    setMessages(prev => [
      ...prev, 
      { role: 'assistant', content: analysisSummary }
    ]);
    
    // Cerrar el analizador de patrones
    setShowPatternAnalyzer(false);
  };
  
  // Manejador para cuando se actualizan los ajustes de IA
  const handleSettingsUpdated = (newSettings) => {
    setAiSettings(prev => ({
      ...prev,
      ...newSettings
    }));
    
    // Mensaje de confirmación opcional
    setMessages(prev => [
      ...prev, 
      { 
        role: 'assistant', 
        content: `He actualizado mis preferencias de interacción según tus necesidades. Ahora te proporcionaré ${['menos', 'pocas', 'algunas', 'más'][newSettings.suggestionsFrequency || 2]} sugerencias y respuestas ${['concisas', 'balanceadas', 'detalladas'][newSettings.detailLevel || 1]}.` 
      }
    ]);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col rounded-md border bg-background shadow">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <h2 className="font-semibold">Asistente de IA</h2>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1"
            onClick={() => setShowPlanGenerator(true)}
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Plan Personalizado</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1"
            onClick={() => setShowPatternAnalyzer(true)}
          >
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Análisis de Patrones</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1"
            onClick={() => setShowLearningSystem(true)}
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Aprendizaje</span>
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col h-[calc(100vh-12rem)]">
        <Card className="flex-1 flex flex-col p-4 overflow-hidden">
          {showPlanGenerator ? (
            <div className="flex-1 overflow-y-auto p-2">
              <PersonalizedPlanGenerator 
                userData={mockUserData}
                onClose={() => setShowPlanGenerator(false)}
                onPlanCreated={handlePlanCreated}
              />
            </div>
          ) : showPatternAnalyzer ? (
            <div className="flex-1 overflow-y-auto p-2">
              <PatternAnalyzer
                userData={mockUserData}
                onClose={() => setShowPatternAnalyzer(false)}
                onAnalysisComplete={handleAnalysisComplete}
              />
            </div>
          ) : showLearningSystem ? (
            <div className="flex-1 overflow-y-auto p-2">
              <LearningAdaptation
                userData={mockUserData}
                interactionHistory={mockInteractionHistory}
                onClose={() => setShowLearningSystem(false)}
                onSettingsUpdated={handleSettingsUpdated}
              />
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto mb-4 pr-2">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                
                {/* Componente de integración de metas */}
                {lastUserMessage && messageMetadata && (
                  <GoalChatIntegration 
                    message={lastUserMessage}
                    metadata={messageMetadata}
                    onCreateGoal={handleCreateGoal}
                    onCreateTask={handleCreateTask}
                  />
                )}
                
                {/* Mostrar botones para ver metas y tareas creadas */}
                {(createdGoals.length > 0 || createdTasks.length > 0) && (
                  <div className="flex justify-center my-4 gap-3">
                    {createdGoals.length > 0 && (
                      <button 
                        className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-sm flex items-center hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                        onClick={handleViewGoals}
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Ver {createdGoals.length} {createdGoals.length === 1 ? 'meta creada' : 'metas creadas'}
                      </button>
                    )}
                    
                    {createdTasks.length > 0 && (
                      <button 
                        className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full text-sm flex items-center hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors"
                        onClick={handleViewTasks}
                      >
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Ver {createdTasks.length} {createdTasks.length === 1 ? 'tarea creada' : 'tareas creadas'}
                      </button>
                    )}
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
              
              {messages.length === 1 && (
                <>
                  <ChatSuggestions onSelectSuggestion={handleSelectSuggestion} />
                  
                  <div className="mt-3 mb-2">
                    <button 
                      className="w-full px-4 py-3 bg-primary/10 hover:bg-primary/20 transition-colors rounded-lg text-sm flex items-center justify-center gap-2"
                      onClick={() => setShowPlanGenerator(true)}
                    >
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span>Generar un plan personalizado con IA</span>
                    </button>
                  </div>
                </>
              )}
              
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="p-2 rounded-full bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
} 