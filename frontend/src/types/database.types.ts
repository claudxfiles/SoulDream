export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          email_notifications: boolean;
          subscription_tier: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          email_notifications?: boolean;
          subscription_tier?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          email_notifications?: boolean;
          subscription_tier?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      
      // Agrega más tablas aquí según el esquema descrito en el proyecto
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          status: string;
          priority: string;
          due_date: string | null;
          column_order: number;
          created_at: string;
          updated_at: string;
          is_deleted: boolean;
          related_goal_id: string | null;
          category: string | null;
          tags: string[] | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          status?: string;
          priority?: string;
          due_date?: string | null;
          column_order?: number;
          created_at?: string;
          updated_at?: string;
          is_deleted?: boolean;
          related_goal_id?: string | null;
          category?: string | null;
          tags?: string[] | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          status?: string;
          priority?: string;
          due_date?: string | null;
          column_order?: number;
          created_at?: string;
          updated_at?: string;
          is_deleted?: boolean;
          related_goal_id?: string | null;
          category?: string | null;
          tags?: string[] | null;
        };
      };
      
      // Esquema básico para el resto de tablas
      goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          area: string;
          target_date: string | null;
          progress_percentage: number;
          status: string;
          created_at: string;
          updated_at: string;
          parent_goal_id: string | null;
          priority: string;
          visualization_image_url: string | null;
          type: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          area: string;
          target_date?: string | null;
          progress_percentage?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
          parent_goal_id?: string | null;
          priority?: string;
          visualization_image_url?: string | null;
          type?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          area?: string;
          target_date?: string | null;
          progress_percentage?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
          parent_goal_id?: string | null;
          priority?: string;
          visualization_image_url?: string | null;
          type?: string;
        };
      };
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