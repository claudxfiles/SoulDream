export type MessageStatus = 'sending' | 'sent' | 'error' | 'receiving';
export type MessageSender = 'user' | 'assistant';

export interface Message {
  id?: string;
  content: string;
  sender: MessageSender;
  timestamp: Date;
  status?: MessageStatus;
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