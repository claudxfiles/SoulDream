'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, Loader2 } from 'lucide-react';
import { createClientComponent } from '@/lib/supabase';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Lista de avatares predefinidos
const AVATARS = [
  { id: 'avatar1', url: '/avatars/avatar1.png', label: 'Avatar 1' },
  { id: 'avatar2', url: '/avatars/avatar2.png', label: 'Avatar 2' },
  { id: 'avatar3', url: '/avatars/avatar3.png', label: 'Avatar 3' },
  { id: 'avatar4', url: '/avatars/avatar4.png', label: 'Avatar 4' },
  { id: 'avatar5', url: '/avatars/avatar5.png', label: 'Avatar 5' },
  { id: 'avatar6', url: '/avatars/avatar6.png', label: 'Avatar 6' },
];

// Crear un cliente de React Query para este componente
const queryClient = new QueryClient();

export function UserSettings() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserSettingsContent />
    </QueryClientProvider>
  );
}

function UserSettingsContent() {
  const { profile, updateProfile, isUpdatingProfile } = useUser();
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');

  // Inicializar campos cuando el perfil se carga
  useEffect(() => {
    if (profile) {
      // Usamos type assertion para evitar errores de tipo
      setFullName((profile as any).full_name || '');
      setAvatarUrl((profile as any).avatar_url || '');
      
      // Intentar encontrar el avatar predefinido que coincida con la URL actual
      const currentAvatar = AVATARS.find(avatar => avatar.url === (profile as any).avatar_url);
      if (currentAvatar) {
        setSelectedAvatar(currentAvatar.id);
      } else {
        setSelectedAvatar('');
      }
    }
  }, [profile]);

  // Para obtener las iniciales del nombre para el fallback del avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Manejar selección de avatar
  const handleAvatarSelection = async (avatarId: string) => {
    try {
      const selected = AVATARS.find(avatar => avatar.id === avatarId);
      
      if (!selected) return;
      
      setSelectedAvatar(avatarId);
      
      // Actualizar perfil con la nueva URL de avatar
      await updateProfile({
        avatar_url: selected.url,
      });
      
      setAvatarUrl(selected.url);
      
      toast({
        title: 'Avatar actualizado',
        description: 'Tu avatar se ha actualizado correctamente',
      });
    } catch (error) {
      console.error('Error al actualizar avatar:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el avatar. Intenta nuevamente.',
        variant: 'destructive',
      });
    }
  };

  // Actualizar perfil
  const handleUpdateProfile = async () => {
    try {
      await updateProfile({
        full_name: fullName,
      });
      
      toast({
        title: 'Perfil actualizado',
        description: 'Tus datos han sido actualizados correctamente',
      });
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron actualizar tus datos. Intenta nuevamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-medium">Perfil de usuario</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Actualiza tus datos personales y avatar
        </p>
      </div>
      
      {/* Avatar */}
      <div className="space-y-4">
        <div className="flex justify-center mb-4">
          <Avatar className="w-24 h-24">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={fullName} />
            ) : null}
            <AvatarFallback className="text-xl bg-primary/10 text-primary">
              {getInitials(fullName || 'Usuario')}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-3">Selecciona un avatar</h4>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {AVATARS.map((avatar) => (
              <div 
                key={avatar.id} 
                className={`relative cursor-pointer rounded-md overflow-hidden transition-all ${
                  selectedAvatar === avatar.id ? 'ring-2 ring-primary ring-offset-2' : 'hover:opacity-80'
                }`}
                onClick={() => handleAvatarSelection(avatar.id)}
              >
                <Avatar className="w-16 h-16">
                  <AvatarImage src={avatar.url} alt={avatar.label} />
                  <AvatarFallback>?</AvatarFallback>
                </Avatar>
                {selectedAvatar === avatar.id && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Check className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <Separator className="my-6" />
      
      {/* Información personal */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Información personal</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Actualiza tu información básica
          </p>
        </div>
        
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="full-name">Nombre completo</Label>
            <Input
              id="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Tu nombre completo"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              disabled
              value={(profile as any)?.email || ''}
              className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              El correo electrónico no se puede cambiar
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleUpdateProfile}
          disabled={isUpdatingProfile}
        >
          {isUpdatingProfile ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Guardando...
            </>
          ) : (
            'Guardar cambios'
          )}
        </Button>
      </div>
    </div>
  );
} 