"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, createClientComponent } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabaseClient = createClientComponent();

  useEffect(() => {
    // Obtener la sesión actual
    const getSession = async () => {
      setLoading(true);
      try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error) {
          throw error;
        }
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error al obtener la sesión:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabaseClient]);

  // Iniciar sesión con correo y contraseña
  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  // Iniciar sesión con Google
  const signInWithGoogle = async (redirectTo?: string) => {
    try {
      console.log('Iniciando autenticación con Google, solicitando permisos de Calendar');
      
      // Asegurarnos de pedir todos los permisos necesarios y forzar el consentimiento
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
          scopes: 'email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
          queryParams: {
            access_type: 'offline', // Para obtener refresh_token
            prompt: 'consent select_account', // Forzar la pantalla de consentimiento y selección de cuenta
            include_granted_scopes: 'true',
          },
        },
      });
      
      if (error) {
        console.error('Error en la autenticación con Google:', error);
      } else {
        console.log('Redirección a Google iniciada correctamente');
      }
      
      return { data, error };
    } catch (error: any) {
      console.error('Excepción en la autenticación con Google:', error);
      return { data: null, error };
    }
  };

  // Registrarse con correo y contraseña
  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      // Si el registro es exitoso, crear un perfil para el usuario
      if (data.user && !error) {
        await supabaseClient.from('profiles').insert({
          id: data.user.id,
          full_name: fullName,
          email: email,
        });
      }

      return { data, error };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  // Cerrar sesión
  const signOut = async () => {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        throw error;
      }
      router.push('/auth/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Restablecer contraseña
  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      return { data, error };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  // Actualizar contraseña
  const updatePassword = async (password: string) => {
    try {
      const { data, error } = await supabaseClient.auth.updateUser({
        password,
      });
      return { data, error };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  // Verificar si el usuario tiene permisos de Google Calendar
  const hasGoogleCalendarScopes = () => {
    const googleToken = user?.user_metadata?.google_token;
    return !!googleToken?.access_token;
  };

  // Solicitar permisos de Google Calendar
  const requestGoogleCalendarPermission = async (options?: { forceConsent?: boolean }) => {
    try {
      const forceConsent = options?.forceConsent || false;
      console.log(`Solicitando permisos de Google Calendar con acceso offline y consent ${forceConsent ? 'forzado' : 'normal'}`);
      
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?source=calendar&forceConsent=${forceConsent}&t=${new Date().getTime()}`,
          scopes: [
            'email', 
            'profile', 
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events', 
            'https://www.googleapis.com/auth/calendar.events.readonly',
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/calendar.settings.readonly'
          ].join(' '),
          queryParams: {
            access_type: 'offline',
            prompt: forceConsent ? 'consent select_account' : 'select_account',
            include_granted_scopes: 'true',
          },
        },
      });
      
      if (error) {
        console.error('Error al solicitar permisos de Google Calendar:', error);
      } else {
        console.log('Solicitud de permisos enviada correctamente');
      }
      
      return { data, error };
    } catch (error: any) {
      console.error('Excepción al solicitar permisos de Google Calendar:', error);
      return { data: null, error };
    }
  };

  return {
    user,
    session,
    loading,
    signInWithEmail,
    signInWithGoogle,
    signUpWithEmail,
    signOut,
    resetPassword,
    updatePassword,
    hasGoogleCalendarScopes,
    requestGoogleCalendarPermission,
  };
} 