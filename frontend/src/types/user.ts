export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email_notifications: boolean;
  subscription_tier: 'free' | 'pro' | 'business';
  subscription_id: string | null;
  subscription_end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  profile: UserProfile | null;
} 