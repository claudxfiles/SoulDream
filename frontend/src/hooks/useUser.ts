'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useUserStore } from './useUserStore';
import { useRouter } from 'next/navigation';
import { createClientComponent } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient, QueryClient } from '@tanstack/react-query';

export const CACHE_TIME = 1000 * 60 * 5; // 5 minutos

interface UserProfile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  email_notifications?: boolean;
  subscription_tier?: 'free' | 'pro' | 'business';
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

/**
 * Hook optimizado para gestionar el usuario actual con caching
 * y minimizando re-renders innecesarios
 */
export function useUser() {
  const router = useRouter();
  
  // Manejamos el caso donde QueryClient no está disponible
  let queryClient: QueryClient | undefined;
  let queryClientAvailable = false;
  
  try {
    queryClient = useQueryClient();
    queryClientAvailable = !!queryClient;
  } catch (error) {
    console.warn('QueryClient no disponible. Usando fallback sin caching.');
  }
  
  const supabase = useMemo(() => createClientComponent(), []);
  
  // Acceso al state global
  const {
    user,
    profile,
    loading,
    error,
    isInitialized,
    setUser,
    refreshUser,
    fetchUserProfile,
  } = useUserStore();
  
  // Solo usamos React Query si está disponible el cliente
  const cachedProfileQuery = queryClientAvailable 
    ? useQuery({
        queryKey: ['profile', user?.id],
        queryFn: async () => {
          if (!user?.id) return null;
          
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (error) throw error;
          return data as UserProfile | null;
        },
        enabled: !!user?.id,
        staleTime: CACHE_TIME,
        gcTime: CACHE_TIME * 2, // gcTime reemplaza a cacheTime en v5
        onSuccess: (data: UserProfile | null) => {
          if (data) useUserStore.getState().setProfile(data);
        }
      } as any)
    : { data: null };
  
  // Inicialización única - evita problemas de loops y re-renders
  useEffect(() => {
    if (!isInitialized) {
      refreshUser();
    }
  }, [isInitialized, refreshUser]);
  
  // Escuchar cambios en la autenticación
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchUserProfile();
            if (queryClientAvailable) {
              queryClient?.invalidateQueries({ queryKey: ['profile', session.user.id] });
            }
          }
        }
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
          router.push('/auth/login');
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, setUser, fetchUserProfile, queryClient, queryClientAvailable, router]);
  
  // Mutation para actualizar el perfil
  const updateProfileMutation = queryClientAvailable 
    ? useMutation({
        mutationFn: async (newProfileData: Partial<UserProfile>) => {
          if (!user?.id) throw new Error('No hay usuario autenticado');
          
          const { data, error } = await supabase
            .from('profiles')
            .update(newProfileData)
            .eq('id', user.id)
            .select()
            .single();
            
          if (error) throw error;
          return data as UserProfile;
        },
        onSuccess: (updatedProfile) => {
          useUserStore.getState().setProfile(updatedProfile);
          queryClient?.invalidateQueries({ queryKey: ['profile', user?.id] });
        }
      })
    : {
        mutate: async (newProfileData: Partial<UserProfile>) => {
          if (!user?.id) throw new Error('No hay usuario autenticado');
          
          try {
            const { data, error } = await supabase
              .from('profiles')
              .update(newProfileData)
              .eq('id', user.id)
              .select()
              .single();
              
            if (error) throw error;
            useUserStore.getState().setProfile(data);
            return data;
          } catch (error) {
            console.error('Error al actualizar perfil:', error);
            throw error;
          }
        },
        mutateAsync: async (newProfileData: Partial<UserProfile>) => {
          if (!user?.id) throw new Error('No hay usuario autenticado');
          
          const { data, error } = await supabase
            .from('profiles')
            .update(newProfileData)
            .eq('id', user.id)
            .select()
            .single();
            
          if (error) throw error;
          useUserStore.getState().setProfile(data);
          return data as UserProfile;
        },
        isPending: false
      };
  
  // Cerrar sesión
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Limpiar el store y la caché
      useUserStore.getState().setUser(null);
      useUserStore.getState().setProfile(null);
      if (queryClientAvailable) {
        queryClient?.invalidateQueries();
      }
      
      // Redireccionar al login
      router.push('/auth/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }, [supabase, queryClient, queryClientAvailable, router]);
  
  return {
    user,
    profile: profile || cachedProfileQuery.data,
    loading,
    error,
    isInitialized,
    refreshUser,
    updateProfile: updateProfileMutation.mutate,
    updateProfileAsync: updateProfileMutation.mutateAsync,
    isUpdatingProfile: 'isPending' in updateProfileMutation ? updateProfileMutation.isPending : false,
    signOut,
  };
} 