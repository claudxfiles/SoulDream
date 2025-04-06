export type MessageStatus = 'sending' | 'sent' | 'error' | 'receiving';
export type MessageSender = 'user' | 'ai';

export interface Message {
  id?: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  conversation_id?: string;
  metadata?: {
    goal?: {
      title?: string;
      description?: string;
      type?: string;
      deadline?: Date;
      priority?: 'low' | 'medium' | 'high';
    };
    task?: {
      title?: string;
      description?: string;
      dueDate?: Date;
      priority?: 'low' | 'medium' | 'high';
    };
  };
} 