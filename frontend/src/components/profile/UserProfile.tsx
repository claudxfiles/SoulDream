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
import { pauseSubscription, resumeSubscription } from '@/lib/paypal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

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
  subscription_status?: 'active' | 'suspended' | null;
}

// Componente principal envuelto en QueryClientProvider
export default function UserProfile() {
  const { user } = useAuthContext();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState<Partial<Profile>>({});
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

  const handleInputChange = (field: keyof Profile, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
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

  const handlePauseSubscription = async () => {
    try {
      if (!profile?.subscription_tier) return;
      
      await pauseSubscription(profile.subscription_tier);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'suspended',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;

      setSuccess('Suscripción pausada correctamente');
      fetchProfile();
      setShowCancelDialog(false);
    } catch (error: any) {
      setError(error.message || 'Error al pausar la suscripción');
    }
  };

  const handleResumeSubscription = async () => {
    try {
      if (!profile?.subscription_tier) return;
      
      await resumeSubscription(profile.subscription_tier);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;

      setSuccess('Suscripción reactivada correctamente');
      fetchProfile();
    } catch (error: any) {
      setError(error.message || 'Error al reactivar la suscripción');
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
      {/* Sección de Datos Personales */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Información Personal</h2>
            <p className="text-gray-500 dark:text-gray-400">Actualiza tus datos personales</p>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Campos de información personal */}
          <div>
            <Label htmlFor="full_name">Nombre completo</Label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                id="full_name"
                value={formData.full_name || ''}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Correo electrónico</Label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="email"
                id="email"
                value={user?.email || ''}
                className="pl-10"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">El correo electrónico no se puede modificar</p>
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Teléfono</Label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="tel"
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Dirección</Label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                id="address"
                value={formData.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="birth_date">Fecha de nacimiento</Label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="date"
                id="birth_date"
                value={formData.birth_date || ''}
                onChange={(e) => handleInputChange('birth_date', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mt-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 px-4 py-3 rounded relative mt-4" role="alert">
            <span className="block sm:inline">{success}</span>
          </div>
        )}
      </div>

      {/* Diálogo de Confirmación de Cancelación */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gestionar Suscripción</DialogTitle>
            <DialogDescription>
              Puedes pausar tu suscripción temporalmente o cancelarla definitivamente.
              {profile?.subscription_status === 'suspended' && (
                <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                  Tu suscripción está actualmente pausada. Puedes reactivarla cuando lo desees.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {profile?.subscription_status === 'suspended' ? (
              <Button
                variant="default"
                onClick={handleResumeSubscription}
                className="w-full"
              >
                Reactivar Suscripción
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handlePauseSubscription}
                className="w-full"
              >
                Pausar Suscripción
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              className="w-full"
            >
              Cancelar Definitivamente
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowCancelDialog(false)}
              className="w-full"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 