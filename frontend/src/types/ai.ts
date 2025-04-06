export interface ChatCompletionRequest {
  message: string;
  model?: string;
  messageHistory?: Array<{
    content: string;
    sender: 'user' | 'assistant';
    timestamp: Date;
  }>;
}

export interface ChatCompletionResponse {
  response: string;
  has_goal?: boolean;
  metadata?: any;
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error' | 'receiving';
}

export interface GoalMetadata {
  title: string;
  description: string;
  area: string;
  type: string;
  target_date?: string;
  priority: 'high' | 'medium' | 'low';
  steps?: string[];
}

export interface AISettings {
  suggestionsFrequency: number;
  detailLevel: number;
  aiPersonality: string;
  [key: string]: any;
}

export interface AIMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
} 