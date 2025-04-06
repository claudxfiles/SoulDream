import { User as SupabaseUser } from '@supabase/supabase-js';

export type AuthUser = SupabaseUser & {
  access_token?: string;
  refresh_token?: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
} 