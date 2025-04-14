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
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { GoalsService } from '@/lib/services/goalsService';
import { taskService } from '@/services/tasks';
import { 
  Goal as DBGoal,
  GoalArea, 
  GoalType, 
  GoalPriority, 
  GoalStatus, 
  GoalProgressType, 
  GoalStepStatus 
} from '@/types/goals';

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
  description?: string;
  completed: boolean;
  order?: number;
  goalId?: string;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  type: 'Desarrollo_Personal' | 'Salud_Bienestar' | 'Educacion' | 'Finanzas' | 'Hobbies';
  progress: number;
  steps: AIStep[];
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
  tags: string[];
  stepId?: string;
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
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-3 mb-2" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-lg font-bold mt-2 mb-1" {...props} />,
              h4: ({node, ...props}) => <h4 className="text-base font-bold mt-2 mb-1" {...props} />,
              p: ({node, ...props}) => <p className="mb-2" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2" {...props} />,
              li: ({node, ...props}) => <li className="mb-1" {...props} />,
              a: ({node, ...props}) => (
                <a 
                  className={`underline ${isUser ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  {...props}
                />
              ),
              strong: ({node, ...props}) => (
                <strong className="font-bold" {...props} />
              ),
              em: ({node, ...props}) => (
                <em className="italic" {...props} />
              ),
              code: ({node, inline, className, children, ...props}) => {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus as { [key: string]: React.CSSProperties }}
                    language={match[1]}
                    PreTag="div"
                    className="rounded-md my-2"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={`${inline ? 'bg-gray-200 dark:bg-gray-700 rounded px-1' : ''}`} {...props}>
                    {children}
                  </code>
                )
              },
              blockquote: ({node, ...props}) => (
                <blockquote 
                  className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-2"
                  {...props}
                />
              ),
              hr: ({node, ...props}) => (
                <hr className="my-4 border-gray-300 dark:border-gray-600" {...props} />
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
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
      text: "Ayúdame a establecer una meta de desarrollo personal"
    },
    {
      icon: <Heart className="h-4 w-4" />,
      text: "Quiero mejorar mi salud y bienestar"
    },
    {
      icon: <BrainCircuit className="h-4 w-4" />,
      text: "Necesito un plan de educación"
    },
    {
      icon: <CircleDollarSign className="h-4 w-4" />,
      text: "Ayúdame con mis Finanzas personales"
    },
    {
      icon: <Activity className="h-4 w-4" />,
      text: "Quiero desarrollar un nuevo hobby"
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

// Componente para mostrar una meta detectada con soporte Markdown
const DetectedGoal: React.FC<{ 
  goal: Partial<Goal>; 
  onCreateGoal: (goal: Partial<Goal>) => void 
}> = ({ goal, onCreateGoal }) => {
  const getTypeColor = (type?: Goal['type']) => {
    if (!type) return 'bg-gray-100 text-gray-800';
    const colors = {
      Desarrollo_Personal: 'bg-purple-100 text-purple-800',
      Salud_Bienestar: 'bg-green-100 text-green-800',
      Finanzas: 'bg-blue-100 text-blue-800',
      Educacion: 'bg-orange-100 text-orange-800',
      Hobbies: 'bg-pink-100 text-pink-800',
    };
    return colors[type];
  };

  return (
    <Card className="p-4 mb-4">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex gap-2 items-center mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(goal.type)}`}>
              {goal.type?.replace('_', ' ') || 'Sin tipo'}
            </span>
          </div>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {goal.title || ''}
            </ReactMarkdown>
          </div>
          <div className="prose prose-sm max-w-none mt-2 text-gray-600 dark:text-gray-300">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {goal.description || ''}
            </ReactMarkdown>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onCreateGoal(goal)}
            className="text-xs"
          >
            Crear Meta
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Progreso</span>
          <span className="text-sm text-gray-600">{goal.progress || 0}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${goal.progress || 0}%` }}
          />
        </div>
      </div>

      {goal.steps && goal.steps.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Pasos a seguir</h4>
          <div className="space-y-3">
            {goal.steps.map((step, index) => (
              <div key={step.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <div className="min-w-[24px] h-6 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {`**${step.title}**`}
                      </ReactMarkdown>
                    </div>
                    {step.description && (
                      <div className="prose prose-sm max-w-none mt-1 text-gray-600 dark:text-gray-400">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {step.description}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                  <Checkbox
                    id={step.id}
                    checked={step.completed}
                    className="mt-1"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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

  const handleViewGoals = () => {
    // Navegar a la página de metas
    router.push('/dashboard/goals');
  };
  
  const handleViewTasks = () => {
    // Navegar a la página de tareas
    router.push('/dashboard/tasks');
  };

  const handleCreateGoal = async (goalData: Partial<Goal>) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para crear una meta",
        variant: "destructive"
      });
      return;
    }
  
    try {
      // Mapear el tipo de meta al formato esperado por el servicio
      const mapGoalType = (type: string | undefined): GoalType => {
        switch(type) {
          case 'Desarrollo_Personal':
            return 'Proyecto';
          case 'Salud_Bienestar':
            return 'Hábito';
          case 'Educacion':
            return 'Aprendizaje';
          case 'Finanzas':
            return 'Financiero';
          case 'Hobbies':
          default:
            return 'Otro';
        }
      };

      // Mapear el área de la meta
      const mapGoalArea = (type: string | undefined): GoalArea => {
        switch(type) {
          case 'Desarrollo_Personal':
            return 'Desarrollo Personal';
          case 'Salud_Bienestar':
            return 'Salud y Bienestar';
          case 'Educacion':
            return 'Educación';
          case 'Finanzas':
            return 'Finanzas';
          case 'Hobbies':
          default:
            return 'Hobbies';
        }
      };

      // Preparar los datos de la meta según el esquema de la base de datos
      const newGoal: Omit<DBGoal, 'id' | 'created_at' | 'updated_at'> = {
        title: goalData.title || '',
        description: goalData.description || '',
        area: mapGoalArea(goalData.type),
        type: mapGoalType(goalData.type),
        priority: 'Media',
        status: 'active',
        progress_type: 'percentage',
        user_id: user.id,
        target_value: 100,
        current_value: 0,
        start_date: new Date().toISOString(),
        target_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
        image_url: null
      };
  
      // Crear la meta usando el servicio
      const createdGoal = await GoalsService.createGoal(newGoal);
  
      if (createdGoal) {
        // Si hay pasos definidos, crearlos también
        if (goalData.steps && goalData.steps.length > 0) {
          const steps = goalData.steps.map((step, index) => ({
            title: step.title,
            description: step.description || '',
            status: 'pending' as GoalStepStatus,
            goal_id: createdGoal.id,
            ai_generated: true,
            orderindex: index + 1
          }));
  
          // Crear los pasos en la base de datos
          const { data: createdSteps, error: stepsError } = await supabase
            .from('goal_steps')
            .insert(steps)
            .select();
  
          if (stepsError) {
            console.error('Error al crear los pasos:', stepsError);
            throw stepsError;
          }

          // Actualizar el estado local con los pasos creados
          const updatedGoal = {
            ...createdGoal,
            steps: createdSteps?.map(step => ({ ...step, id: step.id.toString() })) || []
          };
          setCreatedGoals(prev => [...prev, updatedGoal]);
        }
  
        toast({
          title: "Meta creada",
          description: "La meta se ha creado exitosamente"
        });
  
        // Generar una respuesta más detallada que incluya los pasos
        const stepsDescription = goalData.steps?.map((step, index) => 
          `${index + 1}. **${step.title}**${step.description ? `\n   ${step.description}` : ''}`
        ).join('\n') || '';

        const aiResponse = `¡Excelente! He creado una meta para **${goalData.title}**. 
        
He generado un plan personalizado con ${goalData.steps?.length || 0} pasos a seguir:

${stepsDescription}

¿Te gustaría que te ayude a establecer recordatorios para los pasos más importantes?`;
  
        const aiMessage: Message = {
          id: `msg-${Date.now()}`,
          content: aiResponse,
          sender: 'assistant',
          timestamp: new Date()
        };
  
        setMessages(prevMessages => [...prevMessages, aiMessage]);
      }
    } catch (error) {
      console.error('Error al crear la meta:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la meta. Por favor, intenta de nuevo.",
        variant: "destructive"
      });
    }
  };
  
  const handleCreateTask = async (taskTitle: string, goalId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para crear una tarea",
        variant: "destructive"
      });
      return;
    }
  
    try {
      // Preparar los datos de la tarea
      const newTask = {
        title: taskTitle,
        description: '',
        status: 'pending' as const,
        priority: 'medium' as const,
        related_goal_id: goalId,
        tags: [],
        user_id: user.id
      };
  
      // Crear la tarea usando el servicio
      const createdTask = await taskService.createTask(newTask);
      
      if (createdTask) {
        toast({
          title: "Tarea creada",
          description: "La tarea se ha creado exitosamente"
        });
        
        // Actualizar el estado local
        setCreatedTasks(prev => [...prev, createdTask.title]);
        
        // Encontrar la meta relacionada
        const relatedGoal = createdGoals.find(goal => goal.id === goalId);
        
        const aiResponse = `He creado una tarea para "${taskTitle}"${
          relatedGoal ? ` relacionada con tu meta "${relatedGoal.title}"` : ''
        }.
        
  Puedes ver y gestionar esta tarea en tu tablero de tareas. ¿Quieres que establezca una fecha límite para esta tarea?`;
        
        const aiMessage: Message = {
          id: `msg-${Date.now()}`,
          content: aiResponse,
          sender: 'assistant',
          timestamp: new Date()
        };
        
        setMessages(prevMessages => [...prevMessages, aiMessage]);
      }
    } catch (error) {
      console.error('Error al crear la tarea:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la tarea. Por favor, intenta de nuevo.",
        variant: "destructive"
      });
    }
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
  // Patrones para detectar tipos de metas en español
  const goalPatterns = [
    // Desarrollo Personal
    /desarrollo\s+(?:personal|profesional)|emprendimiento|negocio|empresa|servicio\s+técnico/i,
    // Salud y Bienestar
    /salud|bienestar|ejercicio|nutrición|deporte|yoga|meditación/i,
    // Educación
    /educación|aprender|estudiar|curso|carrera|universidad|formación|capacitación/i,
    // Finanzas
    /finanzas|ahorro|inversión|presupuesto|dinero|gastos|ingresos/i,
    // Hobbies
    /hobby|pasatiempo|música|arte|pintura|fotografía|jardinería/i
  ];

  const sectionPatterns = [
    /^#{1,3}\s*\d+\.\s*\*\*(.*?)\*\*$/m,  // ### 1. **Section Title**
    /^#{1,3}\s*\d+\.\s*([^*\n]+)$/m,      // ### 1. Section Title
    /^#{1,3}\s*([^*\n]+)$/m,              // ### Section Title (sin número)
    /^\d+\.\s*\*\*(.*?)\*\*$/m,           // 1. **Section Title** (sin #)
    /^\d+\.\s*([^*\n]+)$/m                // 1. Section Title (sin #)
  ];

  const taskPatterns = [
    /^[-\*•]\s*\*\*(.*?)\*\*:?\s*(.+)$/m,  // - **Task Title**: Description
    /^[-\*•]\s*([^:\n]+?):\s*(.+)$/m,      // - Task Title: Description
    /^[-\*•]\s*([^:\n]+?)\s*$/m,           // - Task Title
    /^\d+\.\s*([^:\n]+?):\s*(.+)$/m,       // 1. Task Title: Description
    /^\d+\.\s*([^:\n]+?)\s*$/m,            // 1. Task Title
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
    /^.*?excelente.*?$/i,               // Praise messages
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
  let goalType: Goal['type'] = 'Desarrollo_Personal';

  // Buscar una meta principal al inicio del mensaje
  const firstParagraphs = lines.slice(0, 5).join(' ');
  

// Determinar el tipo de meta basado en el contenido
const combinedText = lines.slice(0, 10).join(' ').toLowerCase();

// Desarrollo Personal
if (combinedText.includes('desarrollo personal') || combinedText.includes('organización') || 
    combinedText.includes('disciplina') || combinedText.includes('motivación') ||
    combinedText.includes('servicio técnico') || combinedText.includes('negocio') || 
    combinedText.includes('empresa')) {
  goalType = 'Desarrollo_Personal';
} 
// Salud y Bienestar
else if (combinedText.includes('salud') || combinedText.includes('ejercicio') || 
         combinedText.includes('dieta') || combinedText.includes('fitness') || 
         combinedText.includes('nutrición') || combinedText.includes('entrenamiento') ||
         combinedText.includes('bienestar') || combinedText.includes('meditación')) {
  goalType = 'Salud_Bienestar';
} 
// Educación
else if (combinedText.includes('educación') || combinedText.includes('aprendizaje') || 
         combinedText.includes('estudio') || combinedText.includes('curso') || 
         combinedText.includes('formación') || combinedText.includes('capacitación') ||
         combinedText.includes('idioma') || combinedText.includes('certificación')) {
  goalType = 'Educacion';
} 
// Finanzas
else if (combinedText.includes('finanzas') || combinedText.includes('dinero') || 
         combinedText.includes('ahorro') || combinedText.includes('inversión') || 
         combinedText.includes('presupuesto') || combinedText.includes('deuda') ||
         combinedText.includes('economía') || combinedText.includes('gastos')) {
  goalType = 'Finanzas';
} 
// Hobbies
else if (combinedText.includes('hobby') || combinedText.includes('pasatiempo') || 
         combinedText.includes('arte') || combinedText.includes('música') || 
         combinedText.includes('pintura') || combinedText.includes('viaje') ||
         combinedText.includes('juego') || combinedText.includes('colección')) {
  goalType = 'Hobbies';
}

  // Buscar una meta principal al inicio del mensaje (ampliado a más líneas)
  const firstParagraphsExpanded = lines.slice(0, 10).join(' ');
  for (const pattern of goalPatterns) {
    const match = firstParagraphsExpanded.match(pattern);
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
    const actionVerbs = /(mejorar|lograr|conseguir|alcanzar|desarrollar|crear|establecer|mantener|aprender|estudiar|dominar|bajar|perder|ganar|incrementar|organizar)/i;
    for (const line of lines) {
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

    // PASO CLAVE: Determinar el tipo de meta basado en el contenido
    console.log("Tipo de meta detectado:", goalType);
    console.log("Descripción asignada:", mainGoalDescription || "Objetivo personal");

    const goal: Goal = {
      id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: mainGoalTitle,
      description: mainGoalDescription || "Objetivo personal",
      type: goalType, // Aquí se asigna el tipo detectado
      progress: 0,
      steps: []
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
          order: stepOrder++,
          description: '',
          completed: false,
          goalId: goal.id
        };
        goal.steps = goal.steps || [];
        goal.steps.push(step);
      }
      currentSection = stepTitle || '';
      currentDescription = '';
      return;
    }
  }

  // Detectar pasos numerados (como en el primer ejemplo)
  const stepMatch = line.match(/^\d+\.\s+(.*?)(?:\s+\(|$)/);
  if (stepMatch) {
    const stepTitle = stepMatch[1].trim();
    if (stepTitle) {
      const step: AIStep = {
        id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: stepTitle,
        order: stepOrder++,
        description: '',
        completed: false,
        goalId: goal.id
      };
      goal.steps = goal.steps || [];
      goal.steps.push(step);
    }
    currentSection = stepTitle || '';
    currentDescription = '';
    return;
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
          description: description || currentDescription || '',
          status: 'pending',
          priority: 'medium',
          goalId: goal.id,
          order: stepOrder++,
          tags: [],
          stepId: goal.steps?.[goal.steps.length - 1]?.id
        };
        processed.tasks.push(task);
      }
      return;
    }
  }

  // Detectar tareas específicas según palabras clave (del primer código)
  if (line.includes('checklist') || line.includes('sistema') || line.includes('calendario')) {
    const taskTitle = line.trim();
    // Verificar si la tarea ya existe para evitar duplicados
    const taskExists = processed.tasks.some(task => task.title === taskTitle);
    if (!taskExists) {
      const task: AITask = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: taskTitle,
        description: currentDescription || '',
        status: 'pending',
        priority: 'medium',
        goalId: goal.id,
        order: stepOrder++,
        tags: [],
        stepId: goal.steps?.[goal.steps.length - 1]?.id
      };
      processed.tasks.push(task);
    }
    return;
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
                    goal={goal as Partial<Goal>}
                    onCreateGoal={handleCreateGoal}
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
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {task.title}
                          </ReactMarkdown>
                        </div>
                        {task.description && (
                          <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 prose prose-sm max-w-none dark:prose-invert">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {task.description}
                            </ReactMarkdown>
                          </div>
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