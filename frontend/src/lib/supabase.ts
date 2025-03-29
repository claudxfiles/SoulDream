import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

// Create a single client instance for the entire application
export const supabase = createClientComponentClient<Database>();

// Export the client creation function for cases where a new instance is needed
export const createClientComponent = createClientComponentClient<Database>;

// Tipos para las tablas de Supabase
export type Tables = {
  users: {
    id: string;
    email: string;
    created_at: string;
  };
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string;
    email_notifications: boolean;
    subscription_tier: 'free' | 'pro' | 'business';
    created_at: string;
    updated_at: string;
  };
  tasks: {
    id: string;
    user_id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    due_date: string;
    column_order: number;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
    related_goal_id?: string;
    category: string;
    tags: string[];
  };
  transactions: {
    id: string;
    user_id: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    description?: string;
    date: string;
    payment_method?: string;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
  };
  financial_goals: {
    id: string;
    user_id: string;
    title: string;
    target_amount: number;
    current_amount: number;
    deadline?: string;
    category: string;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
  };
  conversations: {
    id: string;
    user_id: string;
    title: string;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
  };
  messages: {
    id: string;
    user_id: string;
    conversation_id: string;
    content: string;
    sender: 'user' | 'ai';
    timestamp: string;
    created_at: string;
    updated_at?: string;
  };
  // Añadir más tipos según sea necesario
}; 