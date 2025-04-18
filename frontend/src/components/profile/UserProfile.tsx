'use client';

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { User, Mail, Phone, MapPin, Calendar, Save, CreditCard, History, Settings, XCircle, Check, X, DollarSign } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { pauseSubscription, resumeSubscription } from '@/lib/paypal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CURRENCIES } from '@/lib/constants/currencies';

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
  currency_code: string;
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
          currency_code: data.currency_code || 'USD',
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
          currency_code: formData.currency_code,
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
      <div className="bg-white dark:bg-[#0f172a] shadow-lg rounded-xl p-8 border border-gray-200 dark:border-[#4f46e5]/10">
        <div className="flex justify-between items-start mb-8">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Información Personal</h2>
            <p className="text-gray-500 dark:text-gray-400">Actualiza tus datos personales</p>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-[#4f46e5] text-white hover:bg-[#4f46e5]/90 transition-all duration-200"
          >
            {saving ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Guardando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Guardar cambios
              </div>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-gray-700 dark:text-gray-300">Nombre completo</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-[#4f46e5]" />
                </div>
                <Input
                  type="text"
                  id="full_name"
                  value={formData.full_name || ''}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  className="pl-10 bg-white dark:bg-[#1e293b] border-gray-200 dark:border-[#4f46e5]/20 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-[#4f46e5] focus:ring-[#4f46e5] transition-all duration-200"
                  placeholder="Ingresa tu nombre completo"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Correo electrónico</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-[#4f46e5]" />
                </div>
                <Input
                  type="email"
                  id="email"
                  value={user?.email || ''}
                  className="pl-10 bg-gray-50 dark:bg-[#1e293b] border-gray-200 dark:border-[#4f46e5]/20 text-gray-500 dark:text-gray-400 opacity-70 cursor-not-allowed"
                  disabled
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">El correo electrónico no se puede modificar</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300">Teléfono</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-[#4f46e5]" />
                </div>
                <Input
                  type="tel"
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="pl-10 bg-white dark:bg-[#1e293b] border-gray-200 dark:border-[#4f46e5]/20 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-[#4f46e5] focus:ring-[#4f46e5] transition-all duration-200"
                  placeholder="Ingresa tu número de teléfono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="address" className="text-gray-700 dark:text-gray-300">Dirección</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-[#4f46e5]" />
                </div>
                <Input
                  type="text"
                  id="address"
                  value={formData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="pl-10 bg-white dark:bg-[#1e293b] border-gray-200 dark:border-[#4f46e5]/20 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-[#4f46e5] focus:ring-[#4f46e5] transition-all duration-200"
                  placeholder="Ingresa tu dirección"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_date" className="text-gray-700 dark:text-gray-300">Fecha de nacimiento</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-[#4f46e5]" />
                </div>
                <Input
                  type="date"
                  id="birth_date"
                  value={formData.birth_date || ''}
                  onChange={(e) => handleInputChange('birth_date', e.target.value)}
                  className="pl-10 bg-white dark:bg-[#1e293b] border-gray-200 dark:border-[#4f46e5]/20 text-gray-900 dark:text-white focus:border-[#4f46e5] focus:ring-[#4f46e5] transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency" className="text-gray-700 dark:text-gray-300">Moneda local</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-[#4f46e5]" />
                </div>
                <Select
                  value={formData.currency_code || 'USD'}
                  onValueChange={(value) => handleInputChange('currency_code', value)}
                >
                  <SelectTrigger className="pl-10 bg-white dark:bg-[#1e293b] border-gray-200 dark:border-[#4f46e5]/20 text-gray-900 dark:text-white">
                    <SelectValue placeholder="Selecciona tu moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.name} ({currency.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
            <p className="text-red-600 dark:text-red-500 text-sm flex items-center gap-2">
              <X className="h-4 w-4" />
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="mt-6 p-4 rounded-lg bg-emerald-50 dark:bg-[#10b981]/10 border border-emerald-200 dark:border-[#10b981]/20">
            <p className="text-emerald-600 dark:text-[#10b981] text-sm flex items-center gap-2">
              <Check className="h-4 w-4" />
              {success}
            </p>
          </div>
        )}
      </div>

      {/* Diálogo de Confirmación de Cancelación */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-[#4f46e5]/10">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Gestionar Suscripción</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Puedes pausar tu suscripción temporalmente o cancelarla definitivamente.
              {profile?.subscription_status === 'suspended' && (
                <p className="mt-2 text-[#f59e0b] text-sm">
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
                className="w-full bg-[#4f46e5] text-white hover:bg-[#4f46e5]/90"
              >
                Reactivar Suscripción
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handlePauseSubscription}
                className="w-full border-[#4f46e5] text-gray-900 dark:text-white hover:bg-[#4f46e5]/10"
              >
                Pausar Suscripción
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              className="w-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 border-red-200 dark:border-red-500/20"
            >
              Cancelar Definitivamente
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowCancelDialog(false)}
              className="w-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 