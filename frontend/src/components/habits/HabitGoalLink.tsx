"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Link, Unlink, Loader2, Target } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useUpdateHabit } from '@/hooks/useHabits';
import { useGetUserGoals } from '@/hooks/useGoals';

interface HabitGoalLinkProps {
  habitId: string;
  currentGoalId?: string;
}

export default function HabitGoalLink({ habitId, currentGoalId }: HabitGoalLinkProps) {
  const [selectedGoalId, setSelectedGoalId] = useState<string | undefined>(currentGoalId);
  const [isLinking, setIsLinking] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Obtener las metas del usuario
  const { data: goals, isLoading: isLoadingGoals } = useGetUserGoals();
  
  // Actualizar el hábito
  const updateHabit = useUpdateHabit({
    onSuccess: () => {
      toast({
        title: selectedGoalId && selectedGoalId !== "none" ? "Hábito vinculado a meta" : "Hábito desvinculado",
        description: selectedGoalId && selectedGoalId !== "none" 
          ? "Este hábito ha sido vinculado a la meta seleccionada" 
          : "Este hábito ya no está vinculado a ninguna meta",
      });
      setIsLinking(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error al vincular",
        description: error.message || "No se pudo vincular el hábito a la meta",
        variant: "destructive",
      });
      setIsLinking(false);
    },
  });
  
  // Función para vincular o desvincular
  const handleLinkToGoal = () => {
    setIsLinking(true);
    updateHabit.mutate({
      id: habitId,
      related_goal_id: selectedGoalId === "none" ? null : selectedGoalId,
    });
  };
  
  // Si no hay selección actual pero hay un goalId, establecerlo
  useEffect(() => {
    if (!selectedGoalId && currentGoalId) {
      setSelectedGoalId(currentGoalId);
    }
  }, [currentGoalId]);
  
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Vincular con meta</h3>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Vincular este hábito a una meta te ayudará a organizar mejor tus esfuerzos y ver cómo contribuye 
            cada acción diaria al logro de tus objetivos más importantes.
          </p>
          
          <Select
            value={selectedGoalId}
            onValueChange={setSelectedGoalId}
            disabled={isLoadingGoals || isLinking}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona una meta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">-- Sin meta vinculada --</SelectItem>
              {goals?.map(goal => (
                <SelectItem key={goal.id} value={goal.id}>
                  {goal.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            onClick={handleLinkToGoal}
            disabled={isLinking || (selectedGoalId === currentGoalId) || (selectedGoalId === "none" && !currentGoalId)}
            className="w-full"
          >
            {isLinking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : selectedGoalId === currentGoalId ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                {currentGoalId ? 'Vinculado' : 'No vinculado'}
              </>
            ) : selectedGoalId && selectedGoalId !== "none" ? (
              <>
                <Link className="mr-2 h-4 w-4" />
                Vincular a meta
              </>
            ) : (
              <>
                <Unlink className="mr-2 h-4 w-4" />
                Desvincular
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 