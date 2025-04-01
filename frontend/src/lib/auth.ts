import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Session {
  token: string;
  user?: {
    id: string;
    email: string;
  };
}

export const getSession = async (): Promise<Session | null> => {
  try {
    const supabase = createClientComponentClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return null;
    }

    return {
      token: session.access_token,
      user: {
        id: session.user.id,
        email: session.user.email || '',
      }
    };
  } catch (error) {
    console.error('Error al obtener la sesión:', error);
    return null;
  }
}; 