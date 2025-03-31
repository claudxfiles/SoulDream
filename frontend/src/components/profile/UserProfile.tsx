'use client';

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { User, Mail, Phone, MapPin, Calendar, Save, CreditCard, History, Settings, XCircle, Check } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  address: string | null;
  birth_date: string | null;
  created_at: string;
  subscription_tier: string | null;
  subscription_start_date?: string;
  next_billing_date?: string;
  subscription_price?: number;
  billing_cycle?: 'monthly' | 'annual';
}

// Componente principal envuelto en QueryClientProvider
export default function UserProfile() {
  const { user } = useAuthContext();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    birth_date: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          address: data.address || '',
          birth_date: data.birth_date || '',
        });
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          birth_date: formData.birth_date,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) {
        throw error;
      }

      setSuccess('Perfil actualizado correctamente');
      fetchProfile(); // Recargar los datos del perfil
    } catch (error: any) {
      setError(error.message || 'Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_tier: null,
          subscription_start_date: null,
          next_billing_date: null,
          subscription_price: null,
          billing_cycle: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) {
        throw error;
      }

      setSuccess('Suscripción cancelada correctamente');
      fetchProfile(); // Recargar los datos del perfil
      setShowCancelDialog(false);
    } catch (error: any) {
      setError(error.message || 'Error al cancelar la suscripción');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <p className="text-gray-500 dark:text-gray-400 mb-6">Actualiza tus datos personales</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre completo
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="full_name"
                    id="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Tu nombre completo"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Correo electrónico
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  El correo electrónico no se puede cambiar
                </p>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Teléfono
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Tu número de teléfono"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Dirección
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="address"
                    id="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Tu dirección"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fecha de nacimiento
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="birth_date"
                    id="birth_date"
                    value={formData.birth_date}
                    onChange={handleChange}
                    className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Miembro desde
                </label>
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {profile?.created_at ? format(new Date(profile.created_at), 'dd/MM/yyyy', { locale: es }) : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{success}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Nueva sección de Plan de suscripción mejorada */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Plan de suscripción</h2>
            <p className="text-gray-500 dark:text-gray-400">Revisa y actualiza tu plan de suscripción</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/profile/subscription')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Settings className="h-4 w-4 mr-2" />
              Gestionar Suscripción
            </button>
            <button
              onClick={() => router.push('/dashboard/profile/history')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <History className="h-4 w-4 mr-2" />
              Historial de Pagos
            </button>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información del Plan */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Plan {profile?.subscription_tier === 'pro' ? 'Pro' : 'Free'}
                  </h3>
                  {profile?.subscription_tier === 'pro' && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Facturación {profile?.billing_cycle === 'annual' ? 'Anual' : 'Mensual'}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {profile?.subscription_tier === 'pro' && (
                    <>
                      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        ${profile?.subscription_price}/
                        <span className="text-sm">{profile?.billing_cycle === 'annual' ? 'año' : 'mes'}</span>
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Próximo cobro: {profile?.next_billing_date ? 
                          format(new Date(profile.next_billing_date), 'dd/MM/yyyy', { locale: es }) : 
                          'No disponible'}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Características del Plan */}
              <div className="space-y-3 mt-6">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Características incluidas:
                </h4>
                {profile?.subscription_tier === 'pro' ? (
                  <>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Acceso ilimitado a todas las funciones
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Chat con IA sin restricciones
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Análisis avanzado de datos
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Soporte prioritario
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Funciones básicas
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Chat con IA limitado
                    </div>
                  </>
                )}
              </div>

              {/* Botón de Cancelación para usuarios Pro */}
              {profile?.subscription_tier === 'pro' && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => setShowCancelDialog(true)}
                    className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancelar Suscripción
                  </button>
                </div>
              )}
            </div>

            {/* Estado de la Suscripción */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Estado de la Suscripción
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Miembro desde</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">
                    {profile?.created_at ? 
                      format(new Date(profile.created_at), 'dd/MM/yyyy', { locale: es }) : 
                      'No disponible'}
                  </p>
                </div>
                {profile?.subscription_tier === 'pro' && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Inicio del plan actual</p>
                      <p className="text-base font-medium text-gray-900 dark:text-white">
                        {profile?.subscription_start_date ? 
                          format(new Date(profile.subscription_start_date), 'dd/MM/yyyy', { locale: es }) : 
                          'No disponible'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Estado</p>
                      <div className="flex items-center">
                        <div className="h-2.5 w-2.5 rounded-full bg-green-500 mr-2"></div>
                        <p className="text-base font-medium text-gray-900 dark:text-white">Activo</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Diálogo de Confirmación de Cancelación */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Estás seguro de que quieres cancelar tu suscripción?</DialogTitle>
            <DialogDescription>
              Tu suscripción seguirá activa hasta el final del período facturado. 
              Después de eso, tu cuenta cambiará al plan gratuito.
              {profile?.next_billing_date && (
                <p className="mt-2 font-medium">
                  Tu suscripción estará activa hasta: {format(new Date(profile.next_billing_date), 'dd/MM/yyyy', { locale: es })}
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleCancelSubscription}>
              Confirmar Cancelación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 