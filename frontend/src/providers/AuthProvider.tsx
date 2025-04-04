'use client';

import React, { createContext, useContext, ReactNode, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ data: any; error: any }>;
  updatePassword: (password: string) => Promise<{ data: any; error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthProviderContent({ children }: { children: ReactNode }) {
  const auth = useAuth();

  if (auth.loading) {
    return null; // O tu componente de carga
  }

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AuthProviderContent>{children}</AuthProviderContent>
    </Suspense>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
} 