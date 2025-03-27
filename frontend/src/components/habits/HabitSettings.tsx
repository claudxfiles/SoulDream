"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, Loader2, Save, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import { useGetHabitById, useUpdateHabit, useDeleteHabit } from '@/hooks/useHabits';
import HabitGoalLink from './HabitGoalLink';
import { Habit, HabitUpdate, HABIT_CATEGORIES } from '@/types/habit';

interface HabitSettingsProps {
  habitId: string;
}

type FormValues = {
  title: string;
  description: string;
  category?: string;
  goal_value?: number;
  is_active: boolean;
};

export default function HabitSettings({ habitId }: HabitSettingsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isConfirmDelete, setIsConfirmDelete] = useState(false);
  
  const { data: habit, isLoading, error } = useGetHabitById(habitId);
  const { register, handleSubmit, setValue, watch, formState: { errors, isDirty } } = useForm<FormValues>();
  
  // Mutaciones para actualizar y eliminar hábitos
  const updateHabit = useUpdateHabit({
    onSuccess: () => {
      toast({
        title: "Hábito actualizado",
        description: "Los cambios se han guardado correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar",
        description: error.message || "No se pudo actualizar el hábito",
        variant: "destructive",
      });
    },
  });
  
  const deleteHabit = useDeleteHabit({
    onSuccess: () => {
      toast({
        title: "Hábito eliminado",
        description: "El hábito ha sido eliminado correctamente",
      });
      router.push('/dashboard/habits');
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar",
        description: error.message || "No se pudo eliminar el hábito",
        variant: "destructive",
      });
      setIsConfirmDelete(false);
    },
  });
  
  // Cargar datos del hábito en el formulario
  useEffect(() => {
    if (habit) {
      setValue('title', habit.title);
      setValue('description', habit.description || '');
      setValue('category', habit.category || 'otros');
      setValue('goal_value', habit.goal_value || 1);
      setValue('is_active', habit.is_active !== false);
    }
  }, [habit, setValue]);
  
  const onSubmit = (data: FormValues) => {
    const frequency: 'daily' | 'weekly' | 'monthly' | 'custom' = 'daily';
    
    const formattedData: HabitUpdate & { id: string } = {
      id: habitId,
      title: data.title.trim(),
      description: data.description?.trim() || '',
      frequency,
      category: data.category || 'otros',
      goal_value: data.goal_value || 1,
      is_active: data.is_active
    };

    updateHabit.mutate(formattedData);
  };
  
  const handleDeleteClick = () => {
    if (!isConfirmDelete) {
      setIsConfirmDelete(true);
      return;
    }
    
    deleteHabit.mutate(habitId);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          No se pudo cargar la información del hábito.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Ej. Meditar 10 minutos"
              {...register('title', { required: 'El título es obligatorio' })}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Describe tu hábito en detalle"
              {...register('description')}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select
                value={watch('category')}
                onValueChange={(value) => setValue('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {HABIT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="goal_value">Meta diaria</Label>
              <Input
                id="goal_value"
                type="number"
                min="1"
                placeholder="1"
                {...register('goal_value', { 
                  valueAsNumber: true,
                  min: { value: 1, message: 'La meta debe ser al menos 1' }
                })}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={watch('is_active')}
              onCheckedChange={(checked) => setValue('is_active', checked)}
            />
            <Label htmlFor="is_active">Hábito activo</Label>
          </div>
        </div>
        
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteClick}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isConfirmDelete ? 'Confirmar eliminación' : 'Eliminar hábito'}
          </Button>
          
          <Button type="submit" className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Guardar cambios
          </Button>
        </div>
      </form>
      
      {isConfirmDelete && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>¿Estás seguro?</AlertTitle>
          <AlertDescription>
            Esta acción no se puede deshacer. Perderás todo el progreso y registros de este hábito.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Componente para vincular el hábito con una meta */}
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Vinculación con metas</h3>
        <HabitGoalLink 
          habitId={habitId} 
          currentGoalId={habit?.related_goal_id} 
        />
      </div>
    </div>
  );
} 