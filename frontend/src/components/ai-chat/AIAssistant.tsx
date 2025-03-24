'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Send, 
  PlusCircle,
  RefreshCw,
  Calendar, 
  CircleDollarSign, 
  Dumbbell, 
  Goal,
  CheckSquare,
  Heart,
  BrainCircuit,
  ArrowLeft
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from '@/components/ui/use-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { aiService } from '@/services/ai';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Tipos para los mensajes
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  context?: 'general' | 'goals' | 'tasks' | 'habits' | 'finances' | 'workout' | 'calendar';
  metadata?: any;
}

// Componente principal
export function AIAssistant() {
  // Estado para los mensajes
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeContext, setActiveContext] = useState<'general' | 'goals' | 'tasks' | 'habits' | 'finances' | 'workout' | 'calendar'>('general');
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo');
  
  // Referencias
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Hooks y clientes
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Efecto para cargar historial de mensajes
  useEffect(() => {
    if (user?.id) {
      loadMessageHistory();
    }
  }, [user?.id]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cargar historial de mensajes
  const loadMessageHistory = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('ai_interactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('context', activeContext)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error al cargar historial de mensajes:', error);
        return;
      }

      // Convertir y ordenar mensajes
      if (data && data.length > 0) {
        const formattedMessages: Message[] = data.map(item => ({
          id: item.id,
          content: item.query,
          sender: 'user',
          timestamp: new Date(item.created_at),
          context: item.context || 'general',
          status: 'sent'
        })).concat(data.map(item => ({
          id: `response-${item.id}`,
          content: item.response,
          sender: 'ai',
          timestamp: new Date(item.created_at),
          context: item.context || 'general',
          status: 'sent',
          metadata: item.metadata
        }))).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error al cargar historial de mensajes:', error);
    }
  };

  // Manejar cambio de contexto
  const handleContextChange = (context: 'general' | 'goals' | 'tasks' | 'habits' | 'finances' | 'workout' | 'calendar') => {
    setActiveContext(context);
    // Cargar mensajes del nuevo contexto
    setMessages([]);
    setTimeout(() => {
      if (user?.id) {
        loadMessageHistory();
      }
    }, 100);
  };

  // Generar un ID único
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // Manejar envío de mensaje
  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !user?.id) return;
    
    const messageId = generateId();
    const newMessage: Message = {
      id: messageId,
      content: currentMessage,
      sender: 'user',
      timestamp: new Date(),
      status: 'sending',
      context: activeContext
    };
    
    setMessages(prev => [...prev, newMessage]);
    setCurrentMessage('');
    setIsLoading(true);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    try {
      // Preparar historial de mensajes para el contexto
      const messageHistory = messages
        .filter(m => m.context === activeContext)
        .map(m => ({
          content: m.content,
          sender: m.sender,
          timestamp: m.timestamp
        }));
      
      // Enviar mensaje a la IA
      const response = await aiService.sendChatMessage({
        message: currentMessage,
        model: selectedModel,
        messageHistory
      });
      
      // Registrar en la base de datos
      const { data: interaction, error: interactionError } = await supabase
        .from('ai_interactions')
        .insert({
          user_id: user.id,
          query: currentMessage,
          response: response.response,
          context: activeContext,
          model_used: selectedModel,
          tokens_used: Math.round((currentMessage.length + response.response.length) / 4),
          metadata: response.metadata || null,
          conversation_id: messageId
        })
        .select()
        .single();
        
      if (interactionError) {
        console.error('Error al guardar interacción:', interactionError);
        throw interactionError;
      }
      
      // Actualizar mensaje del usuario
      setMessages(prev => 
        prev.map(m => 
          m.id === messageId 
            ? { ...m, status: 'sent' } 
            : m
        )
      );
      
      // Agregar respuesta de la IA
      const aiResponse: Message = {
        id: `response-${messageId}`,
        content: response.response,
        sender: 'ai',
        timestamp: new Date(),
        status: 'sent',
        context: activeContext,
        metadata: response.metadata
      };
      
      setMessages(prev => [...prev, aiResponse]);
      
      // Manejar metas detectadas si las hay
      if (response.has_goal && response.metadata?.title) {
        handleGoalDetection(response.metadata);
      }
      
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      
      // Actualizar estado del mensaje a error
      setMessages(prev => 
        prev.map(m => 
          m.id === messageId 
            ? { ...m, status: 'error' } 
            : m
        )
      );
      
      toast({
        title: "Error",
        description: "No se pudo procesar tu mensaje. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Manejar detección de meta
  const handleGoalDetection = (goalMetadata: any) => {
    toast({
      title: "¡Meta detectada!",
      description: `¿Quieres crear una meta para: "${goalMetadata.title}"?`,
      action: (
        <Button 
          onClick={() => router.push(`/dashboard/goals/new?title=${encodeURIComponent(goalMetadata.title)}&area=${goalMetadata.area || ''}&description=${encodeURIComponent(goalMetadata.description || '')}`)}
          variant="outline"
          size="sm"
        >
          Crear meta
        </Button>
      ),
    });
  };
  
  // Manejar pulsación de tecla en textarea
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Auto-ajuste de altura de textarea
  const handleTextareaInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };
  
  // Componente de sugerencias para cada contexto
  const ContextSuggestions = () => {
    const suggestions = useMemo(() => {
      switch (activeContext) {
        case 'goals':
          return [
            "Ayúdame a definir una meta SMART para mi carrera",
            "¿Cómo puedo dividir mi meta en pasos más pequeños?",
            "Necesito establecer un plazo realista para mi meta"
          ];
        case 'tasks':
          return [
            "¿Cómo organizo mejor mis tareas del día?",
            "Ayúdame a priorizar estas tareas",
            "Técnicas para manejar muchas tareas a la vez"
          ];
        case 'habits':
          return [
            "Quiero desarrollar el hábito de levantarme temprano",
            "¿Cómo mantener consistencia con un nuevo hábito?",
            "Ayúdame a identificar disparadores para mis hábitos"
          ];
        case 'finances':
          return [
            "Necesito crear un presupuesto mensual",
            "Estrategias para ahorrar para un auto",
            "¿Cómo puedo reducir mis gastos recurrentes?"
          ];
        case 'workout':
          return [
            "Diseña una rutina de ejercicios para principiante",
            "Quiero mejorar mi resistencia cardiovascular",
            "Rutina de 30 minutos para hacer en casa"
          ];
        case 'calendar':
          return [
            "Ayúdame a organizar mi semana de trabajo",
            "¿Cómo equilibrar trabajo y tiempo personal?",
            "Técnicas para gestionar reuniones eficientemente"
          ];
        default:
          return [
            "¿Cómo puedo mejorar mi productividad?",
            "Dime más sobre las funciones de SoulDream",
            "Necesito ayuda con la planificación de mi semana"
          ];
      }
    }, [activeContext]);
    
    return (
      <div className="flex flex-wrap gap-2 mt-4 mb-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            onClick={() => setCurrentMessage(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
    );
  };
  
  // Componente para mensaje individual
  const ChatMessage = ({ message }: { message: Message }) => {
    const isUser = message.sender === 'user';
    
    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        {!isUser && (
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage src="/images/ai-avatar.png" alt="AI" />
            <AvatarFallback className="bg-indigo-600 text-white">AI</AvatarFallback>
          </Avatar>
        )}
        
        <div 
          className={`max-w-[80%] rounded-lg p-3 ${
            isUser 
              ? 'bg-indigo-600 text-white rounded-br-none' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none'
          }`}
        >
          {message.context && message.context !== 'general' && !isUser && (
            <Badge variant="outline" className="mb-2 text-xs bg-transparent">
              {getContextIcon(message.context)}
              <span className="ml-1">{getContextName(message.context)}</span>
            </Badge>
          )}
          
          <p className="whitespace-pre-wrap">{message.content}</p>
          
          <div className={`text-xs mt-1 ${isUser ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'}`}>
            {format(message.timestamp, 'hh:mm a', { locale: es })}
            {message.status === 'sending' && ' · Enviando...'}
            {message.status === 'error' && ' · Error al enviar'}
          </div>
          
          {message.metadata && !isUser && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              {message.metadata.steps && (
                <div className="text-sm mt-1">
                  <p className="font-medium">Pasos sugeridos:</p>
                  <ul className="list-disc pl-5 mt-1">
                    {message.metadata.steps.slice(0, 3).map((step: string, index: number) => (
                      <li key={index}>{step}</li>
                    ))}
                    {message.metadata.steps.length > 3 && (
                      <li>...y {message.metadata.steps.length - 3} pasos más</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        
        {isUser && (
          <Avatar className="h-8 w-8 ml-2">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt="User" />
            <AvatarFallback className="bg-green-600 text-white">
              {user?.user_metadata?.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  };

  // Obtener nombre del contexto
  const getContextName = (context: string) => {
    const contextNames: Record<string, string> = {
      'general': 'General',
      'goals': 'Metas',
      'tasks': 'Tareas',
      'habits': 'Hábitos',
      'finances': 'Finanzas',
      'workout': 'Entrenamiento',
      'calendar': 'Calendario'
    };
    
    return contextNames[context] || 'General';
  };
  
  // Obtener icono del contexto
  const getContextIcon = (context: string) => {
    switch (context) {
      case 'goals':
        return <Goal className="h-3 w-3" />;
      case 'tasks':
        return <CheckSquare className="h-3 w-3" />;
      case 'habits':
        return <Heart className="h-3 w-3" />;
      case 'finances':
        return <CircleDollarSign className="h-3 w-3" />;
      case 'workout':
        return <Dumbbell className="h-3 w-3" />;
      case 'calendar':
        return <Calendar className="h-3 w-3" />;
      default:
        return <BrainCircuit className="h-3 w-3" />;
    }
  };
  
  // Ver si estamos al inicio de la conversación
  const isConversationStart = useMemo(() => {
    return messages.filter(m => m.context === activeContext).length === 0;
  }, [messages, activeContext]);
  
  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <Card className="flex flex-col h-full">
        <CardHeader className="px-4 py-3 border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl flex items-center">
              <BrainCircuit className="mr-2 h-5 w-5 text-indigo-500" />
              SoulDream AI
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Select 
                value={selectedModel} 
                onValueChange={setSelectedModel}
              >
                <SelectTrigger className="w-[180px] h-8">
                  <SelectValue placeholder="Modelo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="claude-3-sonnet">Claude Sonnet</SelectItem>
                  <SelectItem value="qwen-72b-chat">Qwen 72B</SelectItem>
                  <SelectItem value="llama3-70b-8192">Llama 3 70B</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="ghost" size="icon" onClick={() => loadMessageHistory()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <TabsList className="w-full justify-start border-b rounded-none px-4 py-0 h-12">
          <TabsTrigger 
            value="general" 
            className={`data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 data-[state=active]:shadow-none rounded-none px-3 py-2 ${activeContext === 'general' ? 'border-b-2 border-indigo-500' : ''}`}
            onClick={() => handleContextChange('general')}
          >
            <BrainCircuit className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          
          <TabsTrigger 
            value="goals" 
            className={`data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 data-[state=active]:shadow-none rounded-none px-3 py-2 ${activeContext === 'goals' ? 'border-b-2 border-indigo-500' : ''}`}
            onClick={() => handleContextChange('goals')}
          >
            <Goal className="mr-2 h-4 w-4" />
            Metas
          </TabsTrigger>
          
          <TabsTrigger 
            value="tasks" 
            className={`data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 data-[state=active]:shadow-none rounded-none px-3 py-2 ${activeContext === 'tasks' ? 'border-b-2 border-indigo-500' : ''}`}
            onClick={() => handleContextChange('tasks')}
          >
            <CheckSquare className="mr-2 h-4 w-4" />
            Tareas
          </TabsTrigger>
          
          <TabsTrigger 
            value="habits" 
            className={`data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 data-[state=active]:shadow-none rounded-none px-3 py-2 ${activeContext === 'habits' ? 'border-b-2 border-indigo-500' : ''}`}
            onClick={() => handleContextChange('habits')}
          >
            <Heart className="mr-2 h-4 w-4" />
            Hábitos
          </TabsTrigger>
          
          <TabsTrigger 
            value="finances" 
            className={`data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 data-[state=active]:shadow-none rounded-none px-3 py-2 ${activeContext === 'finances' ? 'border-b-2 border-indigo-500' : ''}`}
            onClick={() => handleContextChange('finances')}
          >
            <CircleDollarSign className="mr-2 h-4 w-4" />
            Finanzas
          </TabsTrigger>
          
          <TabsTrigger 
            value="workout" 
            className={`data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 data-[state=active]:shadow-none rounded-none px-3 py-2 ${activeContext === 'workout' ? 'border-b-2 border-indigo-500' : ''}`}
            onClick={() => handleContextChange('workout')}
          >
            <Dumbbell className="mr-2 h-4 w-4" />
            Entrenamiento
          </TabsTrigger>
          
          <TabsTrigger 
            value="calendar" 
            className={`data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 data-[state=active]:shadow-none rounded-none px-3 py-2 ${activeContext === 'calendar' ? 'border-b-2 border-indigo-500' : ''}`}
            onClick={() => handleContextChange('calendar')}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Calendario
          </TabsTrigger>
        </TabsList>
        
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Mensaje de bienvenida o pantalla vacía */}
          {isConversationStart && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
              <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mb-4">
                {getContextIcon(activeContext)}
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Asistente de {getContextName(activeContext)}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                {activeContext === 'general' 
                  ? 'Soy tu asistente personal en SoulDream. ¿En qué puedo ayudarte hoy?' 
                  : `Estoy especializado en ayudarte con todo lo relacionado con ${getContextName(activeContext).toLowerCase()}. ¿Qué necesitas?`}
              </p>
              <ContextSuggestions />
            </div>
          )}
          
          {/* Mensajes de la conversación */}
          {!isConversationStart && (
            <div className="space-y-4">
              {messages
                .filter(m => m.context === activeContext)
                .map(message => (
                  <ChatMessage key={message.id} message={message} />
                ))}
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarFallback className="bg-indigo-600 text-white">AI</AvatarFallback>
                  </Avatar>
                  <div className="rounded-lg p-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none max-w-[80%]">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </CardContent>
        
        <CardFooter className="p-4 border-t">
          <div className="w-full space-y-2">
            {!isConversationStart && <ContextSuggestions />}
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                placeholder={`Escribe un mensaje (contexto: ${getContextName(activeContext)})...`}
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                onInput={handleTextareaInput}
                className="min-h-[60px] max-h-[200px] flex-1 resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || isLoading}
                size="icon"
                className="h-[60px] w-[60px]"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            <div className="text-xs text-gray-500">
              Presiona Enter para enviar. Usa Shift+Enter para nueva línea.
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 