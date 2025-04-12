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
                  ['pending', 'in-progress', 'completed'].includes(item.status) &&
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

  // Función para procesar mensajes de la IA
  const processAIMessage = (message: string): ProcessedContent => {
    const lines = message.split('\n');
    const processed: ProcessedContent = {
      goals: [],
      tasks: []
    };

    let currentGoal: Partial<Goal> | null = null;
    let isCollectingTasks = false;
    let currentTaskGroup: string[] = [];

    const goalPatterns = [
      /^(\d+[\.\)]|\*)\s*(Objetivo|Meta|Paso):\s*(.+)$/i,
      /^(Objetivo|Meta|Paso)\s*(\d+[\.\)])?\s*:\s*(.+)$/i,
      /^#{1,3}\s*\d*\.\s*(.+)$/i,
      /^#{1,3}\s*\d+\.\s*\*\*(.*?)\*\*$/i,
      /^#{1,3}\s*\d+\.\s*(.+)$/i
    ];

    const taskStartPatterns = [
      /^[-\*•]\s*(.+)$/,
      /^\d+\.\s*(.+)$/,
      /^#{1,3}\s*(.+?):$/i,
      /^[-\*•]\s*\*\*(.*?):\*\*\s*(.+)$/,
      /^[-\*•]\s*\*\*(.*?)\*\*\s*(.+)$/
    ];

    const skipPatterns = [
      /^(\s*--+\s*)$/,  // Separator lines
      /^(\s*\*\*\s*)$/,  // Bold markers
      /^\s*$/,  // Empty lines
      /^#{1,3}\s*$/,  // Header markers
      /^[-\*•]\s*$/,  // List markers
      /^(\d+\.?\s*)$/,  // Numbered list markers
      /^---$/  // Horizontal rules
    ];

    console.log('Procesando mensaje:', message);

    lines.forEach((line, index) => {
      // Skip formatting lines
      if (skipPatterns.some(pattern => pattern.test(line))) {
        return;
      }

      // Clean up the line
      const cleanLine = line.trim();
      if (!cleanLine) return;

      // Detect goals
      for (const pattern of goalPatterns) {
        const match = cleanLine.match(pattern);
        if (match) {
          const title = match[match.length - 1]?.trim();
          if (title) {
            console.log('Objetivo detectado:', title);
            const newGoal: Partial<Goal> = {
              id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title,
              description: '',
              type: 'personal' as const,
              status: 'pending' as const,
              priority: 'medium' as const,
              progress: 0,
              userId: 'pending-user-id',
              createdAt: new Date(),
              updatedAt: new Date(),
              steps: []
            };
            processed.goals.push(newGoal);
            currentGoal = newGoal;
            isCollectingTasks = false;
          }
          return;
        }
      }

      // Detect task sections
      for (const pattern of taskStartPatterns) {
        const match = cleanLine.match(pattern);
        if (match) {
          isCollectingTasks = true;
          if (match[2]) { // Si hay un grupo de captura adicional para el título después de los asteriscos
            currentTaskGroup = [match[2]];
          } else if (match[1]) {
            currentTaskGroup = [match[1]];
          }
          return;
        }
      }

      // Collect task content
      if (isCollectingTasks && cleanLine.length > 5) {
        currentTaskGroup.push(cleanLine);
        
        // If next line is empty or we're at the end, process the task
        if (!lines[index + 1]?.trim() || index === lines.length - 1) {
          const taskTitle = currentTaskGroup.join(' ').trim();
          if (taskTitle && !taskTitle.startsWith('**') && !taskTitle.endsWith('**')) {
            console.log('Tarea detectada:', taskTitle);
            const task: Task = {
              id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: taskTitle,
              description: '',
              status: 'pending',
              priority: 'medium',
              tags: [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            if (currentGoal?.id) {
              task.related_goal_id = currentGoal.id;
            }
            processed.tasks.push(task);
          }
          currentTaskGroup = [];
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
      console.log('Procesando nuevo mensaje del asistente');
      
      setIsProcessing(true);
      try {
        const processed = processAIMessage(lastMessage.content);
        
        if (processed.goals.length > 0 || processed.tasks.length > 0) {
          setProcessedContent(prev => {
            // Evitar duplicados usando un Map
            const goalsMap = new Map(prev.goals.map(g => [g.id, g]));
            const tasksMap = new Map(prev.tasks.map(t => [t.id, t]));
            
            processed.goals.forEach(g => goalsMap.set(g.id, g));
            processed.tasks.forEach(t => tasksMap.set(t.id, t));
            
            return {
              goals: Array.from(goalsMap.values()),
              tasks: Array.from(tasksMap.values())
            };
          });

          // Notificar al usuario de manera más específica
          if (processed.goals.length > 0 && processed.tasks.length > 0) {
            toast({
              title: "Contenido detectado",
              description: `Se detectaron ${processed.goals.length} objetivos y ${processed.tasks.length} tareas relacionadas.`,
            });
          } else if (processed.goals.length > 0) {
            toast({
              title: "Objetivos detectados",
              description: `Se detectaron ${processed.goals.length} nuevos objetivos.`,
            });
          } else if (processed.tasks.length > 0) {
            toast({
              title: "Tareas detectadas",
              description: `Se detectaron ${processed.tasks.length} nuevas tareas.`,
            });
          }
        }
      } catch (error) {
        console.error('Error al procesar mensaje:', error);
        toast({
          title: "Error de procesamiento",
          description: "Hubo un error al procesar el contenido del mensaje. Por favor, intenta de nuevo.",
          variant: "destructive"
        });
      } finally {
        setIsProcessing(false);
      }
    }
  }, [messages]);

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
              <div className="space-y-3">
                {processedContent.goals.map((goal, index) => (
                  <Card key={goal.id || index} className="p-3">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{goal.title}</h4>
                        {goal.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {goal.description}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-xs"
                            onClick={() => handleCreateGoal(goal)}
                          >
                            Crear Meta
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                              setProcessedContent(prev => ({
                                ...prev,
                                goals: prev.goals.filter((g, i) => i !== index)
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