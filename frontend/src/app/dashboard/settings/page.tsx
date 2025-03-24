'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserSettings } from '@/components/settings/UserSettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
import { AuthProvider } from '@/providers/AuthProvider';
import { Bell, PaintBucket, User, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Configuración</h1>
          
          <Tabs defaultValue="account" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="account" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Cuenta</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span>Notificaciones</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <PaintBucket className="h-4 w-4" />
                <span>Apariencia</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Configuración de cuenta</CardTitle>
                  <CardDescription>
                    Administra la configuración de tu cuenta y preferencias personales.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AuthProvider>
                    <UserSettings />
                  </AuthProvider>
                </CardContent>
              </Card>
              
              <div className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <CardTitle>Plan de suscripción</CardTitle>
                      </div>
                    </div>
                    <CardDescription>
                      Revisa y actualiza tu plan de suscripción
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Plan actual: <span className="text-primary">Free</span></p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Accede a funcionalidades premium actualizando tu plan
                        </p>
                      </div>
                      <Button asChild>
                        <Link href="/dashboard/settings/subscription">
                          Gestionar suscripción
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Preferencias de notificaciones</CardTitle>
                  <CardDescription>
                    Configura cómo y cuándo quieres recibir notificaciones.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AuthProvider>
                    <NotificationSettings />
                  </AuthProvider>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="appearance">
              <Card>
                <CardHeader>
                  <CardTitle>Apariencia</CardTitle>
                  <CardDescription>
                    Personaliza la apariencia de la aplicación.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AppearanceSettings />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
} 