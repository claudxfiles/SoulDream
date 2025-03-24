'use client';

import React from 'react';
import Link from 'next/link';
import SupabaseAuth from '@/components/auth/SupabaseAuth';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Crear cuenta
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Únete a SoulDream y comienza a organizar tu vida
          </p>
        </div>
        
        <SupabaseAuth />
        
        <div className="text-center mt-4">
          <Link 
            href="/"
            className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Volver a la página principal
          </Link>
        </div>
      </div>
    </div>
  );
} 