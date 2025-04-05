import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
import { GoalsService } from '@/lib/services/goalsService';
import { GoalStep, CreateGoalStepInput, UpdateGoalStepInput } from '@/types/goals';

export function useGoalSteps(goalId: string) {
  const queryClient = useQueryClient();

  // Obtener los pasos de una meta
  const { 
    data: steps, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['goalSteps', goalId],
    queryFn: () => GoalsService.getGoalSteps(goalId),
    enabled: !!goalId
  });

  // Crear paso
  const createStep = useMutation({
    mutationFn: (step: CreateGoalStepInput) => GoalsService.createGoalStep(step),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goalSteps', goalId] });
      toast({
        title: 'Paso creado',
        description: 'El paso se ha creado exitosamente'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo crear el paso',
        variant: 'destructive'
      });
    }
  });

  // Actualizar paso
  const updateStep = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateGoalStepInput }) =>
      GoalsService.updateGoalStep(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goalSteps', goalId] });
      toast({
        title: 'Paso actualizado',
        description: 'El paso se ha actualizado exitosamente'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el paso',
        variant: 'destructive'
      });
    }
  });

  // Eliminar paso
  const deleteStep = useMutation({
    mutationFn: (id: string) => GoalsService.deleteGoalStep(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goalSteps', goalId] });
      toast({
        title: 'Paso eliminado',
        description: 'El paso se ha eliminado exitosamente'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el paso',
        variant: 'destructive'
      });
    }
  });

  return {
    steps,
    isLoading,
    error,
    createStep,
    updateStep,
    deleteStep
  };
} 