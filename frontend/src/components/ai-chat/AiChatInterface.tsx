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
  Activity,
  PlusCircle,
  Loader2,
  MessageSquare,
  RefreshCw,
  CircleDollarSign,
  Heart,
  BrainCircuit,
  ArrowLeft,
  Trash2,
  Plus
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { GoalChatIntegration } from './GoalChatIntegration';
import { PersonalizedPlanGenerator } from './PersonalizedPlanGenerator';
import { PatternAnalyzer } from './PatternAnalyzer';
import { LearningAdaptation } from './LearningAdaptation';
import { Goal } from '@/types/goal';
import { useRouter } from 'next/navigation';
import { toast, useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Message, MessageStatus, MessageSender } from '@/types/message';
import { aiService } from '@/services/ai';
import { useAuth } from '@/hooks/useAuth';
import { Input } from "@/components/ui/input";
import { AuthUser } from '@/types/auth';
import { supabase } from '@/lib/supabase';
import { Task } from '@/types/task';
import { Checkbox } from "@/components/ui/checkbox";

// Types for personalized planning
interface PersonalizedPlan {
  title: string;
  summary: string;
  focus_areas: string[];
  duration_weeks: number;
  num_tasks: number;
  num_habits: number;
  num_milestones: number;
  productivity_style: string;
  preferences: string[];
  behavioral_insights: string[];
  adapted_steps: Array<{
    title: string;
    description: string;
  }>;
  reinforcement_mechanisms: string[];
}

interface Analysis {
  patterns: string[];
  insights: string[];
  improvement_factors: string[];
}

interface AISettings {
  suggestionsFrequency: number;
  detailLevel: number;
  aiPersonality: string;
  [key: string]: any;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ProcessedContent {
  goals: Partial<Goal>[];
  tasks: Task[];
}


// Función auxiliar para generar IDs únicos
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Tipos actualizados para alinearse con los tipos del sistema
interface AIStep {
  id: string;
  title: string;
  description: string;
  order: number;
  status: 'pending' | 'in_progress' | 'completed';
  goalId?: string;
}

interface AIGoal {
  id: string;
  title: string;
  description: string;
  type: 'personal' | 'financial' | 'health' | 'career' | 'other';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  progress: number;
  steps: AIStep[];  // Cambiado de string[] a AIStep[]
  userId?: string;
}

interface AITask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  goalId: string;
  order: number;
  tags: string[];  // Nunca undefined
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

// Componente para mostrar una meta detectada
const DetectedGoal = ({ goal, onCreateGoal, onDiscard }: { 
  goal: Partial<Goal>, 
  onCreateGoal: (goal: Partial<Goal>) => void,
  onDiscard: () => void 
}) => {
  const steps = goal.steps as AIStep[] || [];
  
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
            {goal.type === 'financial' ? 'Finanzas' : 
             goal.type === 'health' ? 'Salud' :
             goal.type === 'career' ? 'Carrera' :
             goal.type === 'other' ? 'Personal' : 'Educación'}
          </div>
          <div className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
            Alta
          </div>
          <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
            active
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onDiscard}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      <h3 className="text-xl font-semibold mb-2">{goal.title}</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-4">{goal.description}</p>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Progreso</span>
          <span>0 de {steps.length} pasos completados</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '0%' }}></div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium flex items-center gap-2">
          <CheckSquare className="h-4 w-4" />
          Pasos a seguir
        </h4>
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <Checkbox checked={false} />
            <div>
              <p className="font-medium">{step.title}</p>
              {step.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300">{step.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={() => onDiscard()}>
          Descartar
        </Button>
        <Button onClick={() => onCreateGoal(goal)}>
          Crear Meta
        </Button>
      </div>
    </Card>
  );
};

export function AiChatInterface() {
  const { user, signInWithGoogle } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [createdGoals, setCreatedGoals] = useState<Partial<Goal>[]>([]);
  const [createdTasks, setCreatedTasks] = useState<string[]>([]);
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
  const [processedContent, setProcessedContent] = useState<ProcessedContent>({ goals: [], tasks: [] });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cargar conversaciones existentes
  const loadConversations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error al cargar conversaciones:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las conversaciones",
        variant: "destructive"
      });
    }
  };

  // Cargar mensajes de una conversación específica
  const loadConversationMessages = async (conversationId: string) => {
    setIsLoadingConversation(true);
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      
      setMessages(messagesData?.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender as MessageSender,
        timestamp: new Date(msg.created_at),
        status: msg.status as MessageStatus,
        conversation_id: msg.conversation_id
      })) || []);
      
      setCurrentConversationId(conversationId);
      
      // Procesar mensajes existentes
      const assistantMessages = messagesData?.filter(msg => msg.sender === 'assistant') || [];
      const allProcessedContent: ProcessedContent = {
        goals: [],
        tasks: []
      };
      
      for (const msg of assistantMessages) {
        try {
          const processed = processAIMessage(msg.content) as ProcessedContent;
          if (processed.goals && Array.isArray(processed.goals)) {
            const validGoals = processed.goals
              .filter((item): item is Goal => {
                if (!item || typeof item !== 'object') return false;
                
                return (
                  typeof item.title === 'string' &&
                  item.title.trim() !== '' &&
                  typeof item.description === 'string' &&
                  item.description.trim() !== '' &&
                  typeof item.type === 'string' &&
                  ['financial', 'health', 'career', 'personal', 'other'].includes(item.type) &&
                  typeof item.priority === 'string' &&
                  ['low', 'medium', 'high'].includes(item.priority) &&
                  typeof item.status === 'string' &&
                  ['pending', 'in_progress', 'completed', 'cancelled'].includes(item.status) &&
                  typeof item.progress === 'number' &&
                  typeof item.userId === 'string'
                );
              });
            if (validGoals.length > 0) {
              allProcessedContent.goals = [...allProcessedContent.goals, ...validGoals];
            }
          }
          if (processed.tasks && Array.isArray(processed.tasks)) {
            const validTasks = processed.tasks
              .filter((item): item is Task => {
                if (!item || typeof item !== 'object') return false;
                
                return (
                  typeof item.id === 'string' &&
                  item.id.trim() !== '' &&
                  typeof item.related_goal_id === 'string' &&
                  item.related_goal_id.trim() !== '' &&
                  typeof item.title === 'string' &&
                  item.title.trim() !== '' &&
                  (item.description === undefined || 
                   (typeof item.description === 'string' && item.description.trim() !== '')) &&
                  typeof item.status === 'string' &&
                  ['pending', 'in_progress', 'completed'].includes(item.status) &&
                  typeof item.created_at === 'string'
                );
              });
            if (validTasks.length > 0) {
              allProcessedContent.tasks = [...allProcessedContent.tasks, ...validTasks];
            }
          }
        } catch (error) {
          console.error('Error al procesar mensaje histórico:', error);
        }
      }
      
      // Actualizar estado con contenido procesado
      setProcessedContent(allProcessedContent);
      
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error de carga",
        description: "No se pudo cargar la conversación. Por favor, intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingConversation(false);
    }
  };

  const createNewConversation = async () => {
    if (!user?.access_token) {
      toast({
        title: "Error de autenticación",
        description: "Por favor, inicia sesión nuevamente",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/ai/new-conversation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error al crear nueva conversación: ${response.status}`);
      }

      const data = await response.json();
      setCurrentConversationId(data.conversation_id);
      setMessages([]); // Limpiar mensajes al iniciar nueva conversación
      // Limpiar el contenido procesado al iniciar nueva conversación
      setProcessedContent({
        goals: [],
        tasks: []
      });
      loadConversations(); // Recargar lista de conversaciones
      
      toast({
        title: "Nueva conversación iniciada",
        description: "Puedes empezar a chatear",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "No se pudo crear una nueva conversación",
        variant: "destructive"
      });
    }
  };

  // Cargar conversaciones al iniciar
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user?.access_token || !currentConversationId) {
      if (!currentConversationId) {
        toast({
          title: "Error",
          description: "Por favor, crea o selecciona una conversación primero",
          variant: "destructive"
        });
      }
      return;
    }

    const userMessage = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user' as const,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Asegurar que la URL usa HTTPS en producción
      let baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
      if (process.env.NODE_ENV === 'production' && baseUrl.startsWith('http://')) {
        baseUrl = baseUrl.replace('http://', 'https://');
      }
      
      // Enviar el mensaje al backend
      const response = await fetch(`${baseUrl}/api/v1/ai/openrouter-chat-stream`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: inputValue,
          conversation_id: currentConversationId
        })
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      let aiResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const text = new TextDecoder().decode(value);
          const lines = text.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.error) {
                  console.error('Error from server:', data.error);
                  continue;
                }
                
                if (data.text) {
                  aiResponse += data.text;
                  setMessages(prev => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage && lastMessage.sender === 'assistant') {
                      return [...prev.slice(0, -1), { ...lastMessage, content: aiResponse }];
                    } else {
                      return [...prev, {
                        id: Date.now().toString(),
                        content: aiResponse,
                        sender: 'assistant',
                        timestamp: new Date()
                      }];
                    }
                  });
                }
                
                if (data.type === 'done') {
                  break;
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      }

      // Recargar la lista de conversaciones para actualizar los timestamps
      loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje. Por favor, intenta de nuevo.",
        variant: "destructive"
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
      id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'personal' as const,
      status: 'pending' as const,
      priority: 'medium' as const,
      progress: 0,
      steps: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'pending-user-id' // Se actualizará cuando se guarde
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
      sender: 'assistant',
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
      sender: 'assistant',
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
  
  // Manejador para la creación de un plan personalizado
  const handlePlanCreated = (plan: PersonalizedPlan) => {
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
    
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      content: planSummary,
      sender: 'assistant',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setShowPlanGenerator(false);
  };
  
  // Manejador para cuando se completa el análisis de patrones
  const handleAnalysisComplete = (analysis: Analysis) => {
    const analysisMessage = `
He completado el análisis de tus patrones:

**Patrones Identificados:**
${analysis.patterns.join('\n')}

**Insights Clave:**
${analysis.insights.join('\n')}

**Factores de Mejora:**
${analysis.improvement_factors.join('\n')}
    `;
    
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      content: analysisMessage,
      sender: 'assistant',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setShowPatternAnalyzer(false);
  };
  
  // Manejador para cuando se actualizan los ajustes de IA
  const handleSettingsUpdated = (newSettings: AISettings) => {
    setAiSettings(newSettings);
    
    const settingsMessage = `
He actualizado mis ajustes según tus preferencias:
- Frecuencia de sugerencias: ${newSettings.suggestionsFrequency}
- Nivel de detalle: ${newSettings.detailLevel}
- Personalidad: ${newSettings.aiPersonality}
    `;
    
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      content: settingsMessage,
      sender: 'assistant',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setShowLearningSystem(false);
  };

  const handleGoalDetection = (goalMetadata: any) => {
    // Implementar lógica para manejar metas detectadas
    console.log('Meta detectada:', goalMetadata);
  };

  // Añadir función para eliminar conversación
  const handleDeleteConversation = async (conversationId: string) => {
    if (!user) return;

    try {
      // Primero eliminar los mensajes asociados
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);

      if (messagesError) throw messagesError;

      // Luego eliminar la conversación
      const { error: conversationError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (conversationError) throw conversationError;

      // Actualizar el estado local
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
        setMessages([]);
      }

      toast({
        title: "Conversación eliminada",
        description: "La conversación ha sido eliminada exitosamente",
      });
    } catch (error) {
      console.error('Error al eliminar la conversación:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la conversación",
        variant: "destructive"
      });
    }
  };


// Función para procesar mensajes de la IA
const processAIMessage = (message: string): ProcessedContent => {
  // Patrones ampliados para detectar diversos tipos de metas
  const goalPatterns = [
    // Patrones educativos originales
    /^¡Claro!\s+.*?\s+para\s+(aprender|dominar|estudiar)\s+\*\*(.*?)\*\*/i,
    /^Aquí\s+tienes\s+.*?\s+para\s+(aprender|dominar|estudiar)\s+\*\*(.*?)\*\*/i,
    /^#{1,3}\s*Objetivo\s*\d*:?\s*\*?(.*?)\*?$/im,
    /^#{1,3}\s*Meta\s*\d*:?\s*\*?(.*?)\*?$/im,
    
    // Patrones para cualquier tipo de meta
    /^(?:Te\s+ayudo\s+a|Aquí\s+tienes\s+un\s+plan\s+para|Plan\s+para|Objetivo:\s+|Meta:\s+)(.*?)(?:\.|$)/i,
    /^(?:Para|Vamos\s+a|Podemos|Quieres)\s+(.*?)(?:\.|$)/i,
    /^(?:Tu\s+objetivo\s+de|Tu\s+meta\s+de|Para\s+lograr)\s+(.*?)(?:\.|$)/i,
    
    // Patrones para metas de salud y fitness
    /^(?:quiero|necesito|me gustaría)?\s*(?:bajar|perder|reducir)\s+(?:de\s+)?peso/i,
    /^(?:plan|rutina|programa)\s+(?:de|para)\s+(?:adelgazar|bajar de peso|ejercicios|entrenamiento|fitness)/i,
    /^(?:ayuda|ayúdame)\s+(?:a|para)\s+(?:bajar|perder|reducir)\s+(?:de\s+)?peso/i,
    
    // Patrones para metas de aprendizaje musical y otras habilidades
    /^(?:quiero|me gustaría)?\s*aprender\s+(?:a\s+)?tocar\s+(?:la\s+)?(?:batería|guitarra|piano|bajo|violín)/i,
    /^(?:busco|necesito)\s+(?:clases|lecciones|curso)\s+de\s+(?:batería|guitarra|piano|bajo|violín)/i,
    /^(?:ayuda|ayúdame)\s+(?:a|para)\s+aprender\s+(?:a\s+)?tocar\s+(?:la\s+)?(?:batería|guitarra|piano|bajo|violín)/i,
    
    // Patrones para metas financieras
    /^(?:plan|estrategia)\s+(?:de|para)\s+(?:ahorro|inversión|finanzas|presupuesto)/i,
    /^(?:quiero|necesito|busco)\s+(?:mejorar|administrar)\s+(?:mis\s+)?(?:finanzas|ahorros|dinero|gastos)/i,
    
    // Patrones para metas profesionales
    /^(?:quiero|necesito|busco)\s+(?:mejorar|cambiar|encontrar)\s+(?:mi\s+)?(?:trabajo|carrera|empleo|profesión)/i,
    
    // Detectar verbos de acción comunes (genérico)
    /(?:quieres|necesitas|buscas|deseas)\s+(.*?)(?:\.|$)/i
  ];

  // Definición de patrones para tipos de metas específicas
  const goalTypePatterns = {
    health: /(?:salud|peso|ejercicio|dieta|nutrición|entrenamiento|fitness|adelgazar|perder peso)/i,
    financial: /(?:dinero|ahorro|inversión|finanzas|presupuesto|gastos|economía)/i,
    education: /(?:aprender|estudiar|practicar|dominar|curso|clases|lecciones)/i,
    career: /(?:trabajo|profesional|carrera|empleo|negocio|profesión|laboral)/i,
    hobbies: /(?:hobby|pasatiempo|personal|vida|relación|hábito|rutina)/i
  };

  const sectionPatterns = [
    /^#{1,3}\s*\d+\.\s*\*\*(.*?)\*\*$/m,  // ### 1. **Section Title**
    /^#{1,3}\s*\d+\.\s*([^*\n]+)$/m,      // ### 1. Section Title
    /^\d+\.\s*\*\*(.*?)\*\*$/m,           // 1. **Section Title** (sin #)
    /^\d+\.\s*([^*\n]+)$/m                // 1. Section Title (sin #)
  ];

    const taskPatterns = [
      /^[-\*•]\s*\*\*(.*?)\*\*:?\s*(.+)$/m,  // - **Task Title**: Description
      /^[-\*•]\s*([^:\n]+?):\s*(.+)$/m,      // - Task Title: Description
      /^[-\*•]\s*([^:\n]+?)\s*$/m,           // - Task Title
      /^\d+\.\s*([^:\n]+?):\s*(.+)$/m,       // 1. Task Title: Description
      /^\d+\.\s*([^:\n]+?)\s*$/m,            // 1. Task Title
      /^#{1,3}\s*([^*\n]+)$/m,              // ### Section Title (sin número)
      /^[-\*•]\s*(?:Día|Semana|Mes)\s+\d+:\s*(.*?)(?::|$)/m,  // - Día 1: Tarea
      /^[-\*•]\s*\((\d+\s*(?:min|minutos|hrs|horas))\)\s*(.*?)(?::|$)/m  // - (30 min) Tarea
    ];

    const skipPatterns = [
      /^(\s*--+\s*)$/,                    // Separator lines
      /^\s*$/,                            // Empty lines
      /^#{1,3}\s*$/,                      // Header markers
      /^[-\*•]\s*$/,                      // List markers
      /^(\d+\.?\s*)$/,                    // Numbered list markers
      /^---$/,                            // Horizontal rules
      /^.*?\?$/,                          // Questions
      /^.*?gracias.*?$/i,                 // Thank you messages
      /^.*?perfecto.*?$/i,                // Confirmation messages
      /^.*?excelente.*?$/i,              // Praise messages
      /^.*?genial.*?$/i                   // Praise messages
    ];

    const lines = message.split('\n');
    const processed: ProcessedContent = {
      goals: [],
      tasks: []
    };

    // Detectar la meta principal
    let mainGoalTitle = '';
    let mainGoalDescription = '';

      // Función para determinar el tipo de meta
  function determineGoalType(title: string, description: string): 'personal' | 'financial' | 'health' | 'career' | 'other' {
    const text = `${title} ${description}`.toLowerCase();
    
    // Patrones específicos para metas financieras
    const financialPatterns = /casa|hipoteca|préstamo|dinero|ahorro|inversión|finanzas|presupuesto|gastos|economía|comprar|propiedad|vivienda|inmueble|departamento/i;
    
    // Patrones para otros tipos de metas
    const healthPatterns = /salud|peso|ejercicio|dieta|nutrición|entrenamiento|fitness|adelgazar|perder peso/i;
    const careerPatterns = /trabajo|profesional|carrera|empleo|negocio|profesión|laboral/i;
    const educationPatterns = /aprender|estudiar|practicar|dominar|curso|clases|lecciones/i;
    
    if (financialPatterns.test(text)) return 'financial';
    if (healthPatterns.test(text)) return 'health';
    if (careerPatterns.test(text)) return 'career';
    if (educationPatterns.test(text)) return 'other';
    
    return 'personal';
  }


  // Buscar una meta principal al inicio del mensaje (ampliado a más líneas)
  const firstParagraphs = lines.slice(0, 5).join(' ');
  for (const pattern of goalPatterns) {
    const match = firstParagraphs.match(pattern);
    if (match) {
      mainGoalTitle = match[1]?.trim() || '';
      
      // Si el título está vacío pero hay un segundo grupo
      if (!mainGoalTitle && match[2]) {
        mainGoalTitle = match[2].trim();
      }
      
      break;
    }
  }

  // Si no encontramos una meta explícita en los patrones, buscar en el contenido
  if (!mainGoalTitle) {
    for (const line of lines) {
      // Generalizado para detectar cualquier verbo de acción, no solo los educativos
      const actionVerbs = /(mejorar|lograr|conseguir|alcanzar|desarrollar|crear|establecer|mantener|aprender|estudiar|dominar|bajar|perder|ganar|incrementar|organizar)/i;
      if (actionVerbs.test(line)) {
        const cleanLine = line.replace(/[¡!¿?]/g, '').trim();
        const verbMatch = cleanLine.match(actionVerbs);
        if (verbMatch) {
          const verbIndex = cleanLine.indexOf(verbMatch[0]);
          if (verbIndex > -1 && verbIndex + verbMatch[0].length < cleanLine.length) {
            mainGoalTitle = cleanLine.substring(verbIndex + verbMatch[0].length).trim();
            // Limpiar conectores al inicio
            mainGoalTitle = mainGoalTitle.replace(/^(a|de|el|la|los|las|en|con|para|por)\s+/i, '').trim();
            break;
          }
        }
      }
    }
  }

// Crear la meta principal
if (mainGoalTitle) {
  // Buscar una posible descripción en las siguientes líneas
  for (let i = 0; i < 10 && i < lines.length; i++) {
    if (lines[i].trim() && !lines[i].match(/#/) && !lines[i].match(/^[-\*•]/) && 
        !goalPatterns.some(pattern => pattern.test(lines[i]))) {
      if (!mainGoalDescription) {
        mainGoalDescription = lines[i].trim();
      }
    }
  }

  // Determinar el tipo de meta basado en el contenido
  let goalType = determineGoalType(mainGoalTitle, mainGoalDescription);
  
  const goal: AIGoal = {
    id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: mainGoalTitle,
    description: mainGoalDescription || "Objetivo personal",
    type: goalType,
    status: 'pending',
    priority: 'high',
    progress: 0,
    userId: 'pending-user-id',
    steps: [] as AIStep[]
  };


    // Procesar secciones como pasos de la meta
    let currentSection = '';
    let currentDescription = '';
    let stepOrder = 1;

    lines.forEach((line, index) => {
      // Saltar líneas que no aportan
      if (skipPatterns.some(pattern => pattern.test(line))) {
        return;
      }

      // Detectar secciones principales como pasos
      for (const pattern of sectionPatterns) {
        const match = line.match(pattern);
        if (match) {
          const stepTitle = match[1]?.trim();
          if (stepTitle) {
            const step: AIStep = {
              id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: stepTitle,
              description: '',
              order: stepOrder++,
              status: 'pending',
              goalId: goal.id
            };
            goal.steps.push(step);
          }
          currentSection = stepTitle || '';
          currentDescription = '';
          return;
        }
      }

      // Detectar tareas como subtareas del paso actual
      for (const pattern of taskPatterns) {
        const match = line.match(pattern);
        if (match) {
          const title = match[1]?.trim();
          const description = match[2]?.trim() || '';

          if (title && title.length > 3) {
            const task: AITask = {
              id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title,
              description: description || currentDescription,
              status: 'pending',
              stepId: goal.steps?.[goal.steps.length - 1]?.id,
              goalId: goal.id,
              order: stepOrder++
            };
            processed.tasks.push(task);
          }
          return;
        }
      }

      // Acumular descripción si no es una tarea
      if (line.trim() && !line.startsWith('#')) {
        currentDescription = (currentDescription + ' ' + line.trim()).trim();
        // Actualizar la descripción del paso actual si existe
        if (goal.steps?.length && currentDescription) {
          goal.steps[goal.steps.length - 1].description = currentDescription;
        }
      }
    });

    processed.goals.push(goal);
  }

  return processed;
};

  // Efecto para procesar mensajes de la IA
  useEffect(() => {
    const assistantMessages = messages.filter(msg => msg.sender === 'assistant');
    if (assistantMessages.length > 0) {
      const lastMessage = assistantMessages[assistantMessages.length - 1];
      
      // Solo procesar cuando el mensaje está completo y no está cargando
      if (!isLoading && lastMessage.content.length > 0) {
        console.log('Procesando mensaje completo del asistente');
        
        setIsProcessing(true);
        try {
          // Limpiar el contenido procesado antes de procesar el nuevo mensaje
          setProcessedContent({
            goals: [],
            tasks: []
          });
          
          const processed = processAIMessage(lastMessage.content);
          
          // Verificar si se encontró contenido válido
          const hasValidContent = 
            (processed.goals && processed.goals.length > 0) || 
            (processed.tasks && processed.tasks.length > 0);

          if (hasValidContent) {
            console.log('Contenido detectado:', processed);
            setProcessedContent(processed);

            // Notificar al usuario solo si se encontró contenido
            if (processed.goals.length > 0 || processed.tasks.length > 0) {
              const notifications = [];
              
              if (processed.goals.length > 0) {
                notifications.push(`${processed.goals.length} objetivo${processed.goals.length > 1 ? 's' : ''}`);
              }
              
              if (processed.tasks.length > 0) {
                notifications.push(`${processed.tasks.length} tarea${processed.tasks.length > 1 ? 's' : ''}`);
              }

              toast({
                title: "Contenido detectado",
                description: `Se ${notifications.length > 1 ? 'detectaron' : 'detectó'} ${notifications.join(' y ')}.`,
              });
            }
          }
        } catch (error) {
          console.error('Error al procesar mensaje:', error);
          toast({
            title: "Error de procesamiento",
            description: "Hubo un error al procesar el contenido del mensaje.",
            variant: "destructive"
          });
        } finally {
          setIsProcessing(false);
        }
      }
    }
  }, [messages, isLoading]);

  // Función auxiliar para limpiar el contenido procesado
  const clearProcessedContent = () => {
    setProcessedContent({
      goals: [],
      tasks: []
    });
  };

  // Función para manejar el cambio de conversación
  const handleConversationChange = async (conversationId: string) => {
    // Guardar el estado actual si es necesario
    if (currentConversationId && processedContent.goals.length > 0) {
      // Aquí podrías implementar la lógica para guardar el estado actual
      console.log('Guardando estado de la conversación actual...');
    }

    // Limpiar el estado actual
    clearProcessedContent();
    
    // Cargar la nueva conversación
    await loadConversationMessages(conversationId);
  };

  return (
    <div className="flex h-full">
      {/* Lista de conversaciones */}
      <div className="w-64 border-r p-4 overflow-y-auto">
        <Button 
          onClick={createNewConversation}
          variant="outline"
          className="w-full mb-4 flex items-center gap-2"
          disabled={isLoadingConversation}
        >
          <Plus className="w-4 h-4" />
          Nueva Conversación
        </Button>

        <div className="space-y-2">
          {conversations.map((conv) => (
            <div key={conv.id} className="flex items-center gap-2">
              <Button
                variant={currentConversationId === conv.id ? "default" : "ghost"}
                className="flex-1 justify-start text-left"
                onClick={() => handleConversationChange(conv.id)}
                disabled={isLoadingConversation}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                <div className="truncate">
                  <div className="font-medium truncate">{conv.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(conv.updated_at), 'dd MMM yyyy', { locale: es })}
                  </div>
                </div>
                {isLoadingConversation && currentConversationId === conv.id && (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleDeleteConversation(conv.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Área de chat */}
      <div className="flex-1 flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder="Escribe tu mensaje..."
              disabled={isLoading || !currentConversationId}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim() || !currentConversationId}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Panel lateral derecho para objetivos y tareas detectados */}
      <div className="w-80 border-l p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <div className="space-y-6">
          {/* Sección de Objetivos */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-600" />
              Objetivos Detectados
            </h3>
            {processedContent.goals.length > 0 ? (
              <div className="space-y-4">
                {processedContent.goals.map((goal, index) => (
                  <DetectedGoal
                    key={goal.id || index}
                    goal={goal}
                    onCreateGoal={handleCreateGoal}
                    onDiscard={() => {
                      setProcessedContent(prev => ({
                        ...prev,
                        goals: prev.goals.filter((_, i) => i !== index)
                      }));
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay objetivos detectados</p>
                <p className="text-sm mt-1">Los objetivos detectados aparecerán aquí</p>
              </div>
            )}
          </div>

          {/* Sección de Tareas */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-green-600" />
              Tareas Detectadas
            </h3>
            {processedContent.tasks.length > 0 ? (
              <div className="space-y-2">
                {processedContent.tasks.map((task, index) => (
                  <Card key={task.id || index} className="p-3">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {task.description}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-xs"
                            onClick={() => handleCreateTask(task.title, task.related_goal_id !== undefined ? task.related_goal_id : '')}
                          >
                            Crear Tarea
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                              setProcessedContent(prev => ({
                                ...prev,
                                tasks: prev.tasks.filter((t, i) => i !== index)
                              }));
                            }}
                          >
                            Descartar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay tareas detectadas</p>
                <p className="text-sm mt-1">Las tareas detectadas aparecerán aquí</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 