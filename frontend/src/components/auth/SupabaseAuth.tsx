'use client';

import { useEffect, useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClientComponent } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SupabaseAuth() {
  const router = useRouter();
  const supabase = createClientComponent();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Verificar si el usuario ya está autenticado
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    };

    checkUser();

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          router.push('/dashboard');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  if (!mounted) return null;

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
        Accede a SoulDream
      </h2>
      <Auth
        supabaseClient={supabase}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: '#4f46e5',
                brandAccent: '#4338ca',
              },
            },
          },
        }}
        providers={['google']}
        redirectTo={`${window.location.origin}/auth/callback`}
        localization={{
          variables: {
            sign_in: {
              email_label: 'Correo electrónico',
              password_label: 'Contraseña',
              button_label: 'Iniciar sesión',
              loading_button_label: 'Iniciando sesión...',
              social_provider_text: 'Iniciar sesión con {{provider}}',
              link_text: '¿Ya tienes una cuenta? Inicia sesión',
            },
            sign_up: {
              email_label: 'Correo electrónico',
              password_label: 'Contraseña',
              button_label: 'Registrarse',
              loading_button_label: 'Registrando...',
              social_provider_text: 'Registrarse con {{provider}}',
              link_text: '¿No tienes una cuenta? Regístrate',
            },
            forgotten_password: {
              email_label: 'Correo electrónico',
              password_label: 'Contraseña',
              button_label: 'Enviar instrucciones',
              loading_button_label: 'Enviando instrucciones...',
              link_text: '¿Olvidaste tu contraseña?',
            },
          },
        }}
      />
    </div>
  );
} 