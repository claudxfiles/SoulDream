'use client';

import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { createClientComponent } from '@/lib/supabase';

interface UserProfile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  email_notifications?: boolean;
  subscription_tier?: 'free' | 'pro' | 'business';
  created_at?: string;
  updated_at?: string;
}

interface UserState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  
  // Thunks
  fetchUserProfile: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useUserStore = create<UserState>()((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,
  isInitialized: false,
  
  // Actions
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setInitialized: (initialized) => set({ isInitialized: initialized }),
  
  // Thunks
  fetchUserProfile: async () => {
    const { user } = get();
    if (!user) return;
    
    try {
      set({ loading: true, error: null });
      const supabase = createClientComponent();
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error('Error fetching user profile:', error);
        set({ error: error.message });
        return;
      }
      
      set({ profile: data as UserProfile, loading: false });
    } catch (error: any) {
      console.error('Exception fetching user profile:', error);
      set({ error: error.message, loading: false });
    }
  },
  
  refreshUser: async () => {
    try {
      set({ loading: true, error: null });
      const supabase = createClientComponent();
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error refreshing user session:', error);
        set({ error: error.message, loading: false });
        return;
      }
      
      set({ user: session?.user ?? null, loading: false });
      
      // If we have a user, fetch their profile data
      if (session?.user) {
        await get().fetchUserProfile();
      }
      
    } catch (error: any) {
      console.error('Exception refreshing user:', error);
      set({ error: error.message, loading: false });
    } finally {
      set({ isInitialized: true });
    }
  }
})); 