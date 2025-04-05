import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
import { GoalsService } from '@/lib/services/goalsService';
import { Goal, CreateGoalInput, UpdateGoalInput } from '@/types/goals';

export function useGoals() {
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const queryClient = useQueryClient();

  // Obtener todas las metas
  const { data: goals, isLoading, error } = useQuery({
    queryKey: ['goals'],
    queryFn: GoalsService.getGoals
  });

  // Crear meta
  const createGoal = useMutation({
    mutationFn: (goal: CreateGoalInput) => GoalsService.createGoal(goal),
    onSuccess: (newGoal) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast({
        title: 'Meta creada',
        description: 'La meta se ha creado exitosamente'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo crear la meta',
        variant: 'destructive'
      });
    }
  });

  // Actualizar meta
  const updateGoal = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateGoalInput }) =>
      GoalsService.updateGoal(id, updates),
    onSuccess: (updatedGoal) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      if (selectedGoal?.id === updatedGoal.id) {
        setSelectedGoal(updatedGoal);
      }
      toast({
        title: 'Meta actualizada',
        description: 'La meta se ha actualizado exitosamente'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la meta',
        variant: 'destructive'
      });
    }
  });

  // Eliminar meta
  const deleteGoal = useMutation({
    mutationFn: (id: string) => GoalsService.deleteGoal(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      if (selectedGoal?.id === deletedId) {
        setSelectedGoal(null);
      }
      toast({
        title: 'Meta eliminada',
        description: 'La meta se ha eliminado exitosamente'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la meta',
        variant: 'destructive'
      });
    }
  });

  // Seleccionar una meta
  const selectGoal = async (id: string) => {
    if (selectedGoal?.id === id) {
      setSelectedGoal(null);
      return;
    }

    try {
      const [goal, steps] = await Promise.all([
        GoalsService.getGoalById(id),
        GoalsService.getGoalSteps(id)
      ]);

      setSelectedGoal({ ...goal, steps });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar la meta',
        variant: 'destructive'
      });
    }
  };

  return {
    goals,
    isLoading,
    error,
    selectedGoal,
    selectGoal,
    createGoal,
    updateGoal,
    deleteGoal
  };
} 