export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error' | 'receiving';
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