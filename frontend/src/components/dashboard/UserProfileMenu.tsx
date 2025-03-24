'use client';

import { useRouter } from 'next/navigation';
import { 
  LogOut, 
  Moon, 
  Sun, 
  Settings,
  CreditCard
} from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { useStore } from '@/store/useStore';

export function UserProfileMenu() {
  const router = useRouter();
  const { user, signOut, profile, loading } = useUser();
  const { theme, setTheme } = useStore();
  
  // Manejar cierre de sesión
  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="h-9 w-9 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
    );
  }

  // Versión simplificada del menú lateral con el estilo solicitado
  return (
    <div className="flex flex-col space-y-1 w-full">      
      <button 
        onClick={() => router.push('/dashboard/profile/subscription')}
        className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
      >
        <CreditCard className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        <span className="text-sm font-medium">Mi suscripción</span>
      </button>
      
      <button 
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
      >
        {theme === 'light' ? (
          <Moon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        ) : (
          <Sun className="h-5 w-5 text-yellow-400" />
        )}
        <span className="text-sm font-medium">{theme === 'light' ? 'Modo oscuro' : 'Modo claro'}</span>
      </button>
      
      <div className="py-1">
        <div className="h-px bg-gray-200 dark:bg-gray-700 w-full"></div>
      </div>
      
      <button 
        onClick={handleSignOut}
        className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
      >
        <LogOut className="h-5 w-5" />
        <span className="text-sm font-medium">Cerrar sesión</span>
      </button>
    </div>
  );
}

export default UserProfileMenu; 