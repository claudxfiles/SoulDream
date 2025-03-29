export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name?: string;
          avatar_url?: string;
          email_notifications?: boolean;
          subscription_tier?: 'free' | 'pro' | 'business';
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          avatar_url?: string;
          email_notifications?: boolean;
          subscription_tier?: 'free' | 'pro' | 'business';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          avatar_url?: string;
          email_notifications?: boolean;
          subscription_tier?: 'free' | 'pro' | 'business';
          created_at?: string;
          updated_at?: string;
        };
      };
      // Add other tables as needed
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
