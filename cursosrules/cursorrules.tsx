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
  steps: string[];  // Almacena solo los IDs de los pasos
  userId?: string;
  stepDetails?: AIStep[];  // Campo adicional para mantener los detalles de los pasos
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
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
            {goal.type}
          </div>
          <div className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
            {goal.priority}
          </div>
          <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
            {goal.status}
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
          <span>0 de {goal.stepDetails?.length || 0} pasos completados</span>
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
        {goal.stepDetails?.map((step, index) => (
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
    
He generado un plan personalizado con ${goalData.stepDetails?.length || 0} pasos a seguir para alcanzar esta meta. Puedes verlo en la sección de Metas o gestionar los pasos directamente desde el chat.

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

  interface ProcessedContent {
    goals: {
      id: string;          // Identificador único para la meta
      title: string;
      description?: string;
      area?: string;
      subarea?: string;
      status?: string;     // Estado de la meta (ej: "active", "completed")
    }[];
    tasks: {
      id: string;          // Identificador único para la tarea
      goalId: string;      // Referencia a la meta asociada
      title: string;
      description?: string;
      section?: string;
      area?: string;
      subarea?: string;
      completed?: boolean; // Estado de completado
      priority?: number;   // Prioridad (opcional)
    }[];
    sections: {
      id: string;          // Identificador único para la sección
      goalId: string;      // Meta asociada
      title: string;
      area?: string;
      subarea?: string;
    }[];
  }
  
  // Función para generar un ID único
  const generateId = (): string => {
    return Math.random().toString(36).substring(2, 15);
  };
  
  // Función para procesar mensajes de la IA
  const processAIMessage = (message: string): ProcessedContent => {
    // Definir las áreas y subáreas de interés con palabras clave relacionadas
    const areas = {
      "Desarrollo Personal": {
        "Crecimiento Personal": [
          "crecimiento personal", "autoconocimiento", "autoestima", "confianza", 
          "autoreflexión", "superación personal", "desarrollo interior"
        ],
        "Productividad": [
          "productividad", "gestión del tiempo", "organización personal", "eficiencia",
          "hábitos productivos", "pomodoro", "planificación", "tareas", "priorización"
        ],
        "Hábitos": [
          "hábitos", "rutinas", "disciplina", "autodisciplina", "constancia",
          "desarrollo de hábitos", "buenos hábitos", "eliminación de hábitos"
        ],
        "Motivación": [
          "motivación", "inspiración", "propósito", "metas personales", "objetivos",
          "autodeterminación", "impulso", "pasión", "voluntad"
        ],
        "Inteligencia Emocional": [
          "inteligencia emocional", "gestión emocional", "emociones", "autoregulación",
          "empatía", "habilidades interpersonales", "autocontrol emocional"
        ],
        "Mindfulness": [
          "mindfulness", "atención plena", "meditación", "presencia", "consciencia",
          "respiración consciente", "relajación", "atención", "zen"
        ],
        "Liderazgo": [
          "liderazgo", "influencia", "carisma", "gestión de equipos", "dirigir",
          "inspirar", "motivar equipos", "habilidades directivas"
        ]
      },
      "Salud y Bienestar": {
        "Ejercicio y Fitness": [
          "ejercicio", "entrenamiento", "fitness", "deporte", "actividad física",
          "gimnasio", "fuerza", "resistencia", "cardio", "entrenamiento funcional"
        ],
        "Nutrición": [
          "nutrición", "alimentación", "dieta", "hábitos alimenticios", "nutrientes",
          "vitaminas", "minerales", "macronutrientes", "proteínas", "carbohidratos"
        ],
        "Salud Mental": [
          "salud mental", "bienestar psicológico", "terapia", "psicología", "ansiedad",
          "estrés", "depresión", "autoayuda", "equilibrio mental"
        ],
        "Descanso": [
          "descanso", "sueño", "dormir", "calidad del sueño", "siesta", "higiene del sueño",
          "relajación", "recuperación", "insomnio", "desconexión"
        ],
        "Medicina Preventiva": [
          "medicina preventiva", "chequeos", "prevención", "salud integral", "sistema inmune",
          "vacunas", "revisiones médicas", "cuidado médico"
        ],
        "Terapias Alternativas": [
          "terapias alternativas", "acupuntura", "homeopatía", "naturopatía", "medicina tradicional",
          "medicina china", "ayurveda", "reiki", "terapias holísticas"
        ],
        "Bienestar Emocional": [
          "bienestar emocional", "equilibrio", "armonía", "felicidad", "alegría",
          "satisfacción", "plenitud", "bienestar general"
        ]
      },
      "Educación": {
        "Aprendizaje": [
          "aprendizaje", "educación", "estudio", "formación", "aprender", "estudiar",
          "conocimiento", "instrucción", "pedagogía", "didáctica"
        ],
        "Idiomas": [
          "idiomas", "aprendizaje de idiomas", "lenguas", "bilingüe", "multilingüe",
          "inglés", "español", "francés", "alemán", "chino", "japonés"
        ],
        "Habilidades Académicas": [
          "habilidades académicas", "técnicas de estudio", "memoria", "concentración",
          "toma de notas", "comprensión lectora", "exámenes", "tests"
        ],
        "Tecnología": [
          "tecnología", "informática", "computación", "programación", "desarrollo web",
          "inteligencia artificial", "ciencia de datos", "ciberseguridad", "revit",
          "autocad", "autodesk", "diseño asistido", "modelado 3d", "bim", "cad",
          "software técnico", "diseño técnico", "renderizado"
        ],
        "Ciencias": [
          "ciencias", "física", "química", "biología", "matemáticas", "estadística",
          "geometría", "álgebra", "cálculo", "astronomía", "geología"
        ],
        "Humanidades": [
          "humanidades", "historia", "filosofía", "literatura", "arte", "música",
          "antropología", "sociología", "psicología", "lingüística"
        ],
        "Profesional": [
          "educación profesional", "certificaciones", "diplomas", "máster", "doctorado",
          "MBA", "desarrollo profesional", "carrera", "universidad", "postgrado"
        ]
      },
      "Finanzas": {
        "Ahorro": [
          "ahorro", "ahorrar", "guardar dinero", "fondo de emergencia", "cuenta de ahorro",
          "acumular capital", "reservas financieras"
        ],
        "Inversión": [
          "inversión", "invertir", "bolsa", "acciones", "bonos", "fondos", "renta fija",
          "renta variable", "dividendos", "rendimiento", "diversificación"
        ],
        "Presupuesto": [
          "presupuesto", "control de gastos", "gestión financiera", "finanzas personales",
          "plan financiero", "balance", "ingresos y gastos"
        ],
        "Deudas": [
          "deudas", "crédito", "préstamos", "hipotecas", "financiación", "intereses",
          "reducción de deuda", "refinanciación", "pagar deudas"
        ],
        "Impuestos": [
          "impuestos", "declaración de la renta", "fiscalidad", "deducciones", "IRPF",
          "IVA", "obligaciones fiscales", "hacienda", "impositivo"
        ],
        "Emprendimiento": [
          "emprendimiento", "negocio propio", "startup", "autónomo", "empresa",
          "modelo de negocio", "plan de negocio", "emprender"
        ],
        "Jubilación": [
          "jubilación", "retiro", "pensión", "plan de pensiones", "ahorro para la jubilación",
          "independencia financiera", "FIRE"
        ]
      },
      "Hobbies": {
        "Arte y Manualidades": [
          "arte", "manualidades", "pintura", "dibujo", "escultura", "cerámica",
          "artesanía", "scrapbooking", "crochet", "tejido", "costura"
        ],
        "Música": [
          "música", "tocar instrumento", "canto", "composición", "piano", "guitarra",
          "batería", "violín", "instrumento musical", "teoría musical"
        ],
        "Cocina y Gastronomía": [
          "cocina", "gastronomía", "recetas", "repostería", "panadería", "chef",
          "comida", "culinario", "pastelería", "cocinar"
        ],
        "Jardinería": [
          "jardinería", "plantas", "huerto", "cultivo", "flores", "árboles",
          "horticultura", "paisajismo", "botánica", "agricultura urbana"
        ],
        "Fotografía": [
          "fotografía", "foto", "cámara", "fotógrafo", "composición", "retoque",
          "revelado", "digital", "analógica", "edición fotográfica"
        ],
        "Viajes": [
          "viajes", "viajar", "turismo", "mochilero", "excursiones", "aventura",
          "destinos", "itinerarios", "vuelos", "hoteles", "airbnb"
        ],
        "Lectura": [
          "lectura", "libros", "leer", "novelas", "literatura", "relatos", "poesía",
          "ensayos", "autor", "biblioteca", "kindle", "audiolibros"
        ],
        "Juegos y Videojuegos": [
          "juegos", "videojuegos", "gaming", "juegos de mesa", "rol", "puzzles",
          "ajedrez", "cartas", "consola", "pc gaming", "juegos online"
        ],
        "Coleccionismo": [
          "coleccionismo", "coleccionar", "colección", "monedas", "sellos", "figuras",
          "antigüedades", "cómics", "vinilos", "memorabilia"
        ],
        "Deportes": [
          "deportes", "fútbol", "baloncesto", "tenis", "natación", "ciclismo",
          "running", "yoga", "artes marciales", "escalada", "senderismo"
        ]
      },
      "Relaciones": {
        "Familia": [
          "familia", "padres", "hijos", "hermanos", "crianza", "relaciones familiares",
          "paternidad", "maternidad", "vínculos familiares"
        ],
        "Pareja": [
          "pareja", "relación de pareja", "matrimonio", "noviazgo", "romance",
          "intimidad", "sexualidad", "compromiso", "comunicación en pareja"
        ],
        "Amistad": [
          "amistad", "amigos", "círculo social", "relaciones sociales", "hacer amigos",
          "mantener amistades", "conexiones", "relaciones personales"
        ],
        "Comunicación": [
          "comunicación interpersonal", "asertividad", "escucha activa", "expresión",
          "diálogo", "resolución de conflictos", "habilidades sociales"
        ],
        "Redes Sociales": [
          "redes sociales", "conexiones digitales", "social media", "comunidad online",
          "networking", "contactos profesionales"
        ]
      },
      "Tecnología": {
        "Programación": [
          "programación", "código", "desarrollo de software", "aplicaciones", "apps",
          "web development", "backend", "frontend", "frameworks", "lenguajes de programación"
        ],
        "Hardware": [
          "hardware", "ordenadores", "computadoras", "PCs", "portátiles", "componentes",
          "reparación", "montaje", "configuración", "dispositivos"
        ],
        "Software": [
          "software", "programas", "apps", "aplicaciones", "sistemas operativos",
          "windows", "mac", "linux", "android", "ios", "herramientas digitales", "revit",
          "autocad", "autodesk", "diseño asistido", "modelado 3d", "bim", "cad"
        ],
        "Inteligencia Artificial": [
          "inteligencia artificial", "IA", "machine learning", "deep learning", "NLP",
          "redes neuronales", "algoritmos", "modelos predictivos", "data science"
        ],
        "Redes e Internet": [
          "redes", "internet", "wifi", "ethernet", "protocoles", "conexión", "servidores",
          "hosting", "dominios", "routers", "seguridad en redes"
        ],
        "Ciberseguridad": [
          "ciberseguridad", "seguridad informática", "protección de datos", "hacking ético",
          "privacidad", "antivirus", "encriptación", "firewalls"
        ]
      },
      "Medioambiente": {
        "Sostenibilidad": [
          "sostenibilidad", "desarrollo sostenible", "ecológico", "eco-friendly",
          "impacto ambiental", "huella de carbono", "economía circular"
        ],
        "Reciclaje": [
          "reciclaje", "reciclar", "reutilización", "residuos", "basura", "compostaje",
          "zero waste", "reducción de plásticos", "separación de residuos"
        ],
        "Conservación": [
          "conservación", "biodiversidad", "fauna", "flora", "espacios naturales",
          "áreas protegidas", "parques nacionales", "ecosistemas"
        ],
        "Energías Renovables": [
          "energías renovables", "solar", "eólica", "hidráulica", "geotérmica",
          "biomasa", "eficiencia energética", "energía limpia"
        ],
        "Cambio Climático": [
          "cambio climático", "calentamiento global", "emisiones", "gases de efecto invernadero",
          "crisis climática", "adaptación", "mitigación"
        ]
      },
      "Trabajo": {
        "Carrera Profesional": [
          "carrera profesional", "desarrollo profesional", "promoción", "ascenso",
          "crecimiento laboral", "plan de carrera", "objetivos profesionales"
        ],
        "Búsqueda de Empleo": [
          "búsqueda de empleo", "trabajo", "CV", "currículum", "entrevista", "selección",
          "aplicación", "ofertas", "portal de empleo", "linkedin"
        ],
        "Habilidades Profesionales": [
          "habilidades profesionales", "competencias", "soft skills", "hard skills",
          "formación continua", "actualización profesional", "capacitación"
        ],
        "Emprendimiento": [
          "emprendimiento laboral", "autónomo", "freelance", "negocio propio",
          "startup", "empresa", "emprender", "autoempleo"
        ],
        "Liderazgo y Gestión": [
          "liderazgo laboral", "gestión de equipos", "management", "recursos humanos",
          "dirección", "supervisión", "coordinación", "delegación"
        ],
        "Teletrabajo": [
          "teletrabajo", "trabajo remoto", "home office", "trabajo a distancia",
          "trabajo híbrido", "conciliación", "nómada digital"
        ]
      },
      "Vivienda": {
        "Compra": [
          "compra de vivienda", "hipoteca", "inmobiliaria", "propiedades", "real estate",
          "adquisición", "inversión inmobiliaria", "piso", "casa"
        ],
        "Alquiler": [
          "alquiler", "arrendamiento", "contrato de alquiler", "fianza", "inquilino",
          "arrendatario", "arrendador", "casero", "renta"
        ],
        "Decoración": [
          "decoración", "interiorismo", "diseño de interiores", "muebles", "estilo",
          "renovación", "ambientación", "decorar"
        ],
        "Mantenimiento": [
          "mantenimiento", "reparación", "bricolaje", "DIY", "reformas", "fontanería",
          "electricidad", "carpintería", "jardinería doméstica"
        ],
        "Mudanza": [
          "mudanza", "traslado", "embalaje", "cajas", "transporte", "organización",
          "reubicación", "cambio de residencia"
        ]
      }
    };
  
    // Patrones mejorados para detectar metas/objetivos
    const goalPatterns = [
      // Patrones explícitos con o sin negritas
      /^¡Claro!\s+.*?\s+para\s+(aprender|dominar|estudiar|mejorar|desarrollar)\s+\*\*(.*?)\*\*/i,
      /^¡Claro!\s+.*?\s+para\s+(aprender|dominar|estudiar|mejorar|desarrollar)\s+(.*?)(?=\.|\n|$)/i,
      /^Aquí\s+tienes\s+.*?\s+para\s+(aprender|dominar|estudiar|mejorar|desarrollar)\s+\*\*(.*?)\*\*/i,
      /^Aquí\s+tienes\s+.*?\s+para\s+(aprender|dominar|estudiar|mejorar|desarrollar)\s+(.*?)(?=\.|\n|$)/i,
      /^#{1,3}\s*Objetivo\s*\d*:?\s*\*?(.*?)\*?$/im,
      /^#{1,3}\s*Meta\s*\d*:?\s*\*?(.*?)\*?$/im,
      /^Plan\s+para\s+(aprender|dominar|estudiar|mejorar|desarrollar)\s+\*\*(.*?)\*\*/i,
      /^Plan\s+para\s+(aprender|dominar|estudiar|mejorar|desarrollar)\s+(.*?)(?=\.|\n|$)/i,
      // Patrones directos de título (buscamos en las primeras líneas)
      /^\s*\*\*(.*?)\*\*\s*$/m,
      /^\s*#\s+(.*?)\s*$/m,
      /^\s*##\s+(.*?)\s*$/m
    ];
  
    // Patrones mejorados para detectar secciones
    const sectionPatterns = [
      /^#{1,3}\s*\d+\.\s*\*\*(.*?)\*\*$/m,  // ### 1. **Section Title**
      /^#{1,3}\s*\d+\.\s*([^*\n]+)$/m,      // ### 1. Section Title
      /^#{1,3}\s*(.*?)$/m,                  // ### Section Title
      /^\d+\.\s*\*\*(.*?)\*\*$/m,           // 1. **Section Title**
      /^\d+\.\s*([^*\n]+)$/m,               // 1. Section Title
      /^PASO\s+\d+:?\s*(.*?)$/im,           // PASO 1: Section Title
      /^ETAPA\s+\d+:?\s*(.*?)$/im,          // ETAPA 1: Section Title
      /^MÓDULO\s+\d+:?\s*(.*?)$/im,         // MÓDULO 1: Section Title
      /^FASE\s+\d+:?\s*(.*?)$/im            // FASE 1: Section Title
    ];
  
    // Patrones mejorados para detectar tareas
    const taskPatterns = [
      // Tareas con viñetas
      /^[-\*•]\s*\*\*(.*?)\*\*:?\s*(.+)$/m,  // - **Task Title**: Description
      /^[-\*•]\s*([^:\n]+?):\s*(.+)$/m,      // - Task Title: Description
      /^[-\*•]\s*([^:\n]+?)\s*$/m,           // - Task Title
      /^[-\*•]\s*(.*?)$/m,                   // - Task con o sin formato específico
      
      // Tareas numeradas
      /^\d+\.\s*\*\*(.*?)\*\*:?\s*(.+)$/m,   // 1. **Task Title**: Description
      /^\d+\.\s*([^:\n]+?):\s*(.+)$/m,       // 1. Task Title: Description
      /^\d+\.\s*([^:\n]+?)\s*$/m,            // 1. Task Title
      /^\d+\.\s*(.*?)$/m,                    // 1. Task con o sin formato específico
      
      // Tareas con palabras clave comunes
      /^(Instala|Descarga|Aprende|Practica|Estudia|Configura|Crea|Desarrolla|Implementa|Analiza|Diseña|Construye|Realiza|Explora|Utiliza|Investiga)\s+(.*?)$/im,
      /^(Instalar|Descargar|Aprender|Practicar|Estudiar|Configurar|Crear|Desarrollar|Implementar|Analizar|Diseñar|Construir|Realizar|Explorar|Utilizar|Investigar)\s+(.*?)$/im
    ];
  
    // Patrones a ignorar
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
      /^.*?excelente.*?$/i,               // Praise messages
      /^.*?genial.*?$/i                   // Praise messages
    ];
  
    const lines = message.split('\n');
    const processed: ProcessedContent = {
      goals: [],
      tasks: [],
      sections: []
    };
  
    // Función mejorada para detectar el área y subárea de un texto
    const detectArea = (text: string): {area?: string, subarea?: string} => {
      if (!text) return { area: undefined, subarea: undefined };
      
      text = text.toLowerCase();
      
      // Casos especiales
      if (text.includes("revit") || text.includes("autodesk") || text.includes("autocad") || 
          text.includes("bim") || text.includes("modelado 3d") || text.includes("diseño asistido")) {
        return { area: "Educación", subarea: "Tecnología" };
      }
      
      for (const [area, subareas] of Object.entries(areas)) {
        for (const [subarea, keywords] of Object.entries(subareas)) {
          for (const keyword of keywords as string[]) {
            if (text.includes(keyword.toLowerCase())) {
              return { area, subarea };
            }
          }
        }
      }
      return { area: undefined, subarea: undefined };
    };
  
    // Buscar título principal
    let mainTitle = '';
    let mainDescription = '';
    
    // Intentamos buscar primero en el título explícito del mensaje
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      
      // Buscar en los primeros párrafos algo que parezca un título
      if (line.includes("**") && !mainTitle) {
        const boldMatch = line.match(/\*\*(.*?)\*\*/);
        if (boldMatch) {
          mainTitle = boldMatch[1].trim();
          continue;
        }
      }
      
      // Si hay un encabezado (#) en las primeras líneas, puede ser el título
      if (line.startsWith("#") && !mainTitle) {
        const headingMatch = line.match(/#+\s+(.*?)$/);
        if (headingMatch) {
          mainTitle = headingMatch[1].trim();
          continue;
        }
      }
      
      // Si encontramos un patrón de meta explícito
      for (const pattern of goalPatterns) {
        const match = line.match(pattern);
        if (match) {
          mainTitle = match[2]?.trim() || match[1]?.trim();
          break;
        }
      }
      
      if (mainTitle) break;
    }
    
    // Si no encontramos un título, buscamos en el texto completo
    if (!mainTitle) {
      const fullText = lines.slice(0, 10).join(" ");
      
      // Buscar frases como "aprender X" o "Curso de X"
      const learningMatch = fullText.match(/(aprender|estudiar|dominar|curso de|guía para|tutorial de)\s+(.*?)(?=\s+para|\.|\,|\:|\n|$)/i);
      if (learningMatch) {
        mainTitle = learningMatch[2].trim();
      }
      
      // Si todavía no hay título, buscar palabras clave específicas
      if (!mainTitle) {
        const softwareMatch = fullText.match(/(Revit|AutoCAD|Autodesk|BIM|modelado 3D|diseño asistido|CAD)/i);
        if (softwareMatch) {
          mainTitle = softwareMatch[1].trim();
        }
      }
    }
    
    // Si tenemos un título principal, creamos la meta
    if (mainTitle) {
      const { area, subarea } = detectArea(mainTitle);
      const goalId = generateId();
      
      processed.goals.push({
        id: goalId,
        title: mainTitle,
        description: mainDescription,
        area: area || "Educación", // Por defecto asignamos Educación si no se detecta
        subarea: subarea,
        status: "active"
      });
      
      // Procesar línea por línea para encontrar secciones y tareas
      let currentSection = '';
      let currentSectionId = '';
      let currentGoalId = goalId;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (!line) continue;
        
        // Comprobar si la línea debe ser ignorada
        let shouldSkip = false;
        for (const pattern of skipPatterns) {
          if (pattern.test(line)) {
            shouldSkip = true;
            break;
          }
        }
        if (shouldSkip) continue;
        
        // Detectar secciones
        let isSectionFound = false;
        for (const pattern of sectionPatterns) {
          const match = line.match(pattern);
          if (match) {
            currentSection = match[1].trim();
            currentSectionId = generateId();
            const { area, subarea } = detectArea(currentSection);
            
            processed.sections.push({
              id: currentSectionId,
              goalId: currentGoalId,
              title: currentSection,
              area: area || processed.goals[0].area,
              subarea: subarea || processed.goals[0].subarea
            });
            
            isSectionFound = true;
            break;
          }
        }
        if (isSectionFound) continue;
        
        // Detectar tareas
        let isTaskFound = false;
        for (const pattern of taskPatterns) {
          const match = line.match(pattern);
          if (match) {
            // El título de la tarea puede estar en diferentes grupos según el patrón
            const taskTitle = (match[2] && match[1].includes("Task")) ? match[2].trim() : match[1].trim();
            const taskDescription = (match[2] && !match[1].includes("Task")) ? match[2].trim() : '';
            
            const fullTaskText = taskTitle + ' ' + taskDescription;
            const { area, subarea } = detectArea(fullTaskText);
            
            processed.tasks.push({
              id: generateId(),
              goalId: currentGoalId,
              title: taskTitle,
              description: taskDescription,
              section: currentSection,
              area: area || (currentSection ? processed.sections.find(s => s.id === currentSectionId)?.area : processed.goals[0].area),
              subarea: subarea || (currentSection ? processed.sections.find(s => s.id === currentSectionId)?.subarea : processed.goals[0].subarea),
              completed: false,
              priority: 1
            });
            
            isTaskFound = true;
            break;
          }
        }
      // Acumular descripción si no es una tarea ni sección
      if (line.trim() && !line.startsWith('#')) {
        currentDescription = (currentDescription + ' ' + line.trim()).trim();
        
        // Actualizar la descripción del paso actual si existe
        if (mainGoal.steps.length > 0) {
          const lastStepId = mainGoal.steps[mainGoal.steps.length - 1];
          const lastStep = stepsMap.get(lastStepId);
          
          if (lastStep) {
            lastStep.description = currentDescription;
            stepsMap.set(lastStepId, lastStep);
          }
        }
      }
    });

    // Añadir los detalles de los pasos al objetivo principal
    mainGoal.stepDetails = Array.from(stepsMap.values());
    processed.goals.push(mainGoal);
  }

  // Detectar secciones como subobjetivos
  const sections = message.split(/(?:#{3}|#{2}|#{1})\s*\d+\.\s*/);
  sections.forEach((section, index) => {
    if (!section.trim() || index === 0) return;

    const sectionLines = section.split('\n');
    const sectionTitle = sectionLines[0].replace(/[#*]/g, '').trim();
    
    if (sectionTitle && sectionTitle.length > 3 && mainGoal) {
      // Buscar si esta sección ya fue procesada como paso
      let alreadyProcessed = false;
      for (const stepId of mainGoal.steps) {
        const step = mainGoal.stepDetails?.find(s => s.id === stepId);
        if (step && step.title === sectionTitle) {
          alreadyProcessed = true;
          break;
        }
      }

      // Si no fue procesada, crear un subobjetivo
      if (!alreadyProcessed) {
        const subGoalId = generateId();
        const description = sectionLines.slice(1).find(line => line.trim() && !line.match(/^[-•*\d.]|^\s*$/))?.trim() || '';
        const goalType = determineGoalType(sectionTitle, section);

        const subGoal: AIGoal = {
          id: subGoalId,
          title: sectionTitle,
          description: description || "Subobjetivo detectado",
          type: goalType,
          priority: 'medium',
          status: 'pending',
          progress: 0,
          steps: [],
          userId: 'pending-user-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 3 meses por defecto
        };

        // Procesar tareas dentro de esta sección
        let stepOrder = 1;
        const stepsMap = new Map<string, AIStep>();
        const sectionTaskPatterns = [...taskPatterns];
        
        for (const line of sectionLines) {
          for (const pattern of sectionTaskPatterns) {
            const match = line.match(pattern);
            if (match) {
              const title = match[1]?.trim();
              const description = match[2]?.trim() || '';

              if (title && title.length > 2) {
                const stepId = generateId();
                const step: AIStep = {
                  id: stepId,
                  title: title,
                  order: stepOrder++,
                  status: 'pending',
                  description: description,
                  goalId: subGoalId
                };
                
                stepsMap.set(stepId, step);
                subGoal.steps.push(stepId);
                
                // Crear tarea asociada
                const task: AITask = {
                  id: generateId(),
                  title,
                  description,
                  status: 'pending',
                  priority: 'medium',
                  goalId: subGoalId,
                  stepId: stepId,
                  order: stepOrder - 1
                };
                processed.tasks.push(task);
              }
              break;
            }
          }
        }

        // Añadir detalles de pasos al subobjetivo
        subGoal.stepDetails = Array.from(stepsMap.values());
        
        // Solo agregar el subobjetivo si tiene pasos o tareas
        if (subGoal.steps.length > 0) {
          processed.goals.push(subGoal);
        }
      }
    }
  });

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