'use client';

import React from 'react';
import UserProfile from '@/components/profile/UserProfile';
import { AuthProvider } from '@/providers/AuthProvider';

export default function ProfilePage() {
  return (
    <div className="py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Perfil de Usuario</h1>
        <div className="mt-6">
          <UserProfile />
        </div>
      </div>
    </div>
  );
} 