'use client';

import React from 'react';
import UserProfile from '@/components/profile/UserProfile';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SubscriptionDetails } from '@/components/subscription/SubscriptionDetails';

export default function ProfilePage() {
  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Perfil de Usuario</h1>
          <div className="mt-6 space-y-8">
            <UserProfile />
            
            {/* Sección de Suscripción */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Mi Suscripción</h2>
              <SubscriptionDetails />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 