import { Database } from './database.types';

export type Tables = Database['public']['Tables'];
export type TablesInsert = {
  [TableName in keyof Tables]: Tables[TableName]['Insert']
};
export type TablesUpdate = {
  [TableName in keyof Tables]: Tables[TableName]['Update']
};
export type TablesRow = {
  [TableName in keyof Tables]: Tables[TableName]['Row']
};

// Tipado para las funciones de Supabase
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      calendar_sync_logs: {
        Row: {
          id: string;
          user_id: string;
          sync_type: 'push' | 'pull' | 'manual' | 'auto';
          status: 'success' | 'partial' | 'failed';
          started_at: string;
          completed_at?: string;
          events_created: number;
          events_updated: number;
          events_deleted: number;
          error_message?: string;
          error_details?: any;
        };
        Insert: {
          id?: string;
          user_id: string;
          sync_type: 'push' | 'pull' | 'manual' | 'auto';
          status: 'success' | 'partial' | 'failed';
          started_at?: string;
          completed_at?: string;
          events_created?: number;
          events_updated?: number;
          events_deleted?: number;
          error_message?: string;
          error_details?: any;
        };
        Update: {
          id?: string;
          user_id?: string;
          sync_type?: 'push' | 'pull' | 'manual' | 'auto';
          status?: 'success' | 'partial' | 'failed';
          started_at?: string;
          completed_at?: string;
          events_created?: number;
          events_updated?: number;
          events_deleted?: number;
          error_message?: string;
          error_details?: any;
        };
      };
      // Añadir más tablas según sea necesario
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};

Need to install the following packages:
  supabase@2.19.7 