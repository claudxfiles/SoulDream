# Ejemplos prácticos de uso de CursorRules en el proyecto Souldream

Este documento proporciona ejemplos concretos de cómo utilizar CursorRules mientras trabajas en diferentes componentes del proyecto.

## Ejemplo 1: Mejorando el componente Souldream

Supongamos que quieres añadir una función para guardar las conversaciones con el asistente.

### Paso 1: Abre el componente Souldream.tsx

```tsx
// src/components/ai-assistant/Souldream.tsx
```

### Paso 2: Invoca al asistente de Cursor con Ctrl+K (o Cmd+K en Mac) y escribe:

```
Quiero añadir una función para guardar las conversaciones con el asistente de IA.
¿Cómo puedo implementar esta funcionalidad manteniendo la estructura actual del componente?
```

### Paso 3: El asistente responderá con una solución que sigue las reglas definidas:

Por ejemplo, el asistente podría sugerir:

```tsx
// Añadir un nuevo estado para manejar las conversaciones guardadas
const [savedConversations, setSavedConversations] = useState<{ id: string; title: string; messages: Message[] }[]>([]);

// Función para guardar la conversación actual
const saveCurrentConversation = () => {
  const conversationId = generateId();
  const title = messages.length > 1
    ? messages[1].content.substring(0, 30) + '...'
    : 'Nueva conversación';

  setSavedConversations(prev => [
    ...prev,
    {
      id: conversationId,
      title,
      messages: [...messages]
    }
  ]);

  // También podríamos usar localStorage para persistencia
  localStorage.setItem('savedConversations', JSON.stringify(savedConversations));
};

// Añadir un botón en la interfaz para usar esta funcionalidad
// ...dentro del return
<Button variant="ghost" size="sm" className="h-8 text-xs" onClick={saveCurrentConversation}>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="mr-1 h-4 w-4"
  >
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
  Guardar
</Button>
```

## Ejemplo 2: Creando un nuevo componente

Supongamos que quieres crear un componente para mostrar las conversaciones guardadas.

### Paso 1: Invoca al asistente y pide:

```
Necesito crear un nuevo componente llamado SavedConversations.tsx que muestre una lista de conversaciones guardadas y permita al usuario cargarlas. ¿Puedes ayudarme?
```

### Paso 2: El asistente generará un componente siguiendo las pautas:

```tsx
// src/components/ai-assistant/SavedConversations.tsx
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { Message } from '@/hooks/useSouldream';

interface SavedConversationsProps {
  conversations: { id: string; title: string; messages: Message[] }[];
  onLoadConversation: (messages: Message[]) => void;
  onDeleteConversation: (id: string) => void;
}

export function SavedConversations({
  conversations,
  onLoadConversation,
  onDeleteConversation
}: SavedConversationsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (conversations.length === 0) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No hay conversaciones guardadas. Usa el botón "Guardar" para guardar tus conversaciones con el asistente.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Conversaciones Guardadas</h2>
      {conversations.map((conversation) => (
        <Card key={conversation.id} className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <CardTitle className="text-sm font-medium">
                {conversation.title}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => onLoadConversation(conversation.messages)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3 w-3"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                  <span className="sr-only">Cargar</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-600"
                  onClick={() => onDeleteConversation(conversation.id)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3 w-3"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                  <span className="sr-only">Eliminar</span>
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {conversation.messages.length} mensajes -
              {new Date(conversation.messages[0].timestamp).toLocaleDateString()}
            </p>
          </CardHeader>
          <Separator />
          <CardContent className="p-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => toggleExpand(conversation.id)}
            >
              {expandedId === conversation.id ? 'Ocultar Detalles' : 'Ver Detalles'}
            </Button>

            {expandedId === conversation.id && (
              <div className="mt-2 max-h-40 overflow-y-auto text-xs text-muted-foreground">
                {conversation.messages.slice(0, 3).map((message, index) => (
                  <div key={index} className="mb-2">
                    <span className="font-medium">{message.role}: </span>
                    {message.content.substring(0, 100)}
                    {message.content.length > 100 ? '...' : ''}
                  </div>
                ))}
                {conversation.messages.length > 3 && (
                  <p className="italic">Y {conversation.messages.length - 3} mensajes más...</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

## Ejemplo 3: Actualizar el hook useSouldream

Supongamos que necesitas actualizar el hook de useSouldream para soportar las conversaciones guardadas.

### Paso 1: Abre el archivo y pide al asistente:

```
Necesito actualizar el hook useSouldream para añadir funcionalidad de guardar y cargar conversaciones. ¿Cómo debería implementar esto?
```

### Paso 2: El asistente te proporcionará una actualización adecuada:

```tsx
// Añadir un nuevo tipo para las conversaciones guardadas
export interface SavedConversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

// Dentro del hook useSouldream, añadir:
const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([]);

// Cargar conversaciones guardadas al iniciar
useEffect(() => {
  const savedData = localStorage.getItem('savedConversations');
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData);
      setSavedConversations(parsed);
    } catch (error) {
      console.error('Error parsing saved conversations:', error);
    }
  }
}, []);

// Función para guardar la conversación actual
const saveCurrentConversation = useCallback((title?: string) => {
  const conversationId = generateId();
  const conversationTitle = title || (messages.length > 1
    ? messages[1].content.substring(0, 30) + '...'
    : 'Nueva conversación');

  const newConversation: SavedConversation = {
    id: conversationId,
    title: conversationTitle,
    messages: [...messages],
    createdAt: new Date()
  };

  setSavedConversations(prev => {
    const updated = [...prev, newConversation];
    localStorage.setItem('savedConversations', JSON.stringify(updated));
    return updated;
  });

  return conversationId;
}, [messages]);

// Función para cargar una conversación guardada
const loadConversation = useCallback((conversationMessages: Message[]) => {
  setMessages(conversationMessages);
}, []);

// Función para eliminar una conversación guardada
const deleteConversation = useCallback((conversationId: string) => {
  setSavedConversations(prev => {
    const updated = prev.filter(conv => conv.id !== conversationId);
    localStorage.setItem('savedConversations', JSON.stringify(updated));
    return updated;
  });
}, []);

// Añadir las nuevas funciones al return
return {
  // ... existing returns
  savedConversations,
  saveCurrentConversation,
  loadConversation,
  deleteConversation,
};
```

## Ejemplo 4: Modificar el diseño de la interfaz de usuario

Supongamos que quieres modificar el diseño de la interfaz para añadir una sección de conversaciones guardadas.

### Paso 1: Pide ayuda al asistente:

```
Quiero modificar el componente AiChatInterface para incluir una sección que muestre las conversaciones guardadas. ¿Cómo debería actualizar el diseño?
```

### Paso 2: El asistente podría sugerir algo como:

```tsx
// En el AiChatInterface.tsx
import { SavedConversations } from './SavedConversations';

export function AiChatInterface() {
  const {
    messages,
    isProcessing,
    context,
    savedConversations, // Nuevas propiedades
    saveCurrentConversation,
    loadConversation,
    deleteConversation,
    // ... resto de propiedades existentes
  } = useSouldream();

  return (
    <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Left Column: AI Chat Assistant */}
      <div className="h-full lg:col-span-2">
        <Souldream
          onSaveConversation={saveCurrentConversation}
        />
      </div>

      {/* Right Column: Multiple sections */}
      <div className="space-y-4 overflow-auto">
        <h2 className="font-semibold">Goals & Tasks</h2>

        {/* Sección de conversaciones guardadas */}
        <SavedConversations
          conversations={savedConversations}
          onLoadConversation={loadConversation}
          onDeleteConversation={deleteConversation}
        />

        {/* Pattern Analysis Card */}
        <PatternAnalyzer messages={messages} context={context} />

        {/* Plan Generator */}
        <PersonalizedPlanGenerator
          context={context}
          onGeneratePlan={generatePersonalizedPlan}
        />

        {/* Goals & Tasks List */}
        <GoalChatIntegration
          goals={context.goals}
          tasks={context.tasks}
          onUpdateGoal={updateGoal}
          onUpdateTask={updateTask}
          onDeleteGoal={deleteGoal}
          onDeleteTask={deleteTask}
        />
      </div>
    </div>
  );
}
```
