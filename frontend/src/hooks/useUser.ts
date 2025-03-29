'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User, UserProfile } from '@/types/user';

export const CACHE_TIME = 1000 * 60 * 5; // 5 minutos

interface UseUserReturn {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

/**
 * Hook optimizado para gestionar el usuario actual con caching
 * y minimizando re-renders innecesarios
 */
export function useUser(): UseUserReturn {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session?.user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) throw profileError;

          setUser({
            id: session.user.id,
            email: session.user.email!,
            profile: profileData
          });
          setProfile(profileData);
        }
      } catch (e) {
        setError(e as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (e) {
      setError(e as Error);
      throw e;
    }
  };

  return { user, profile, isLoading, error, updateProfile };
} 