'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import SupabaseAuth from '@/components/auth/SupabaseAuth';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  
  // Verificar si hay parámetros para redirección directa a Google
  useEffect(() => {
    const provider = searchParams.get('provider');
    const prompt = searchParams.get('prompt');
    const timestamp = searchParams.get('t');
    
    if (provider === 'google') {
      console.log('Redirección directa a Google solicitada');
      
      const handleGoogleRedirect = async () => {
        try {
          const options: any = {
            redirectTo: `${window.location.origin}/auth/callback`,
            scopes: 'email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
            queryParams: {
              access_type: 'offline',
              include_granted_scopes: 'true',
            }
          };
          
          // Añadir prompt si se especifica
          if (prompt) {
            options.queryParams.prompt = prompt;
          }
          
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options
          });
          
          if (error) {
            console.error('Error en redirección a Google:', error);
          }
        } catch (error) {
          console.error('Error al iniciar sesión con Google:', error);
        }
      };
      
      handleGoogleRedirect();
    }
  }, [searchParams, supabase.auth]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Iniciar sesión en SoulDream
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            O{' '}
            <Link
              href="/auth/register"
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              regístrate si aún no tienes cuenta
            </Link>
          </p>
        </div>
        
        <SupabaseAuth />
        
        <div className="text-center mt-4">
          <Link
            href="/auth/reset-password"
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>
    </div>
  );
} 