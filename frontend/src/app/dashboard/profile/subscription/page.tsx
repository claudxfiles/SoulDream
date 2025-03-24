'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SubscriptionSettings } from '@/components/settings/SubscriptionSettings';
import { AuthProvider } from '@/providers/AuthProvider';
import { CreditCard, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ProfileSubscriptionPage() {
  return (
    <div className="py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/profile">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Plan de suscripción</h1>
        </div>
        
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle>Gestionar Plan</CardTitle>
            </div>
            <CardDescription>
              Revisa y gestiona tu plan de suscripción actual
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <AuthProvider>
              <SubscriptionSettings />
            </AuthProvider>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 