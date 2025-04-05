'use client';

import React, { useState } from 'react';
import { Habit } from '@/types/habit';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ChevronRight, 
  Activity, 
  MoreVertical,
  CheckCheck,
  Trash2,
  Settings
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { HABIT_CATEGORIES } from '@/types/habit';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import HabitSettingsDialog from './HabitSettingsDialog';
import { cn } from '@/lib/utils';

interface HabitCardProps {
  habit: Habit;
  onComplete: () => void;
  onDelete?: (habitId: string) => void;
  onUpdate?: () => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({ habit, onComplete, onDelete, onUpdate }) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  
  // Encontrar la categoría para obtener el ícono
  const category = HABIT_CATEGORIES.find(c => c.id === (habit.category || 'otros')) || HABIT_CATEGORIES[7]; // Default a "Otros"
  
  // Formatear la fecha de creación
  const formattedDate = formatDistanceToNow(new Date(habit.created_at), { 
    addSuffix: true,
    locale: es
  });

  // Verificar si el hábito ya se completó hoy
  const isCompletedToday = habit.isCompletedToday || false;

  // Manejar la completación del hábito
  const handleComplete = async () => {
    if (isCompleting || isCompletedToday) return;
    
    setIsCompleting(true);
    try {
      await onComplete();
    } catch (error) {
      console.error('Error al completar el hábito:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  // Manejar la eliminación del hábito
  const handleDelete = () => {
    if (onDelete) {
      onDelete(habit.id);
    }
    setShowDeleteDialog(false);
  };
  
  return (
    <div className={cn(
      "border rounded-lg p-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors",
      isCompletedToday 
        ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20" 
        : "border-gray-200 dark:border-gray-700"
    )}>
      <div className="flex flex-col space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className={cn(
              "p-2 rounded-lg",
              category.color || "bg-gray-100 dark:bg-gray-800"
            )}>
              {category.icon}
            </div>
            
            <div>
              <h3 className="font-medium">{habit.title}</h3>
              {habit.description && (
                <p className="text-sm text-muted-foreground mt-1">{habit.description}</p>
              )}
              <div className="flex items-center mt-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                <span>Creado {formattedDate}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCompletedToday ? (
              <Button 
                onClick={handleComplete}
                size="sm" 
                variant="outline"
                disabled={isCompleting}
                className={cn(
                  "flex items-center gap-1 hover:bg-green-50 hover:text-green-600 hover:border-green-200 dark:hover:bg-green-950/50 dark:hover:text-green-400 dark:hover:border-green-800",
                  isCompleting && "opacity-50 cursor-not-allowed"
                )}
                aria-label="Completar hábito"
              >
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>{isCompleting ? 'Completando...' : 'Completar'}</span>
              </Button>
            ) : (
              <div className="flex items-center text-emerald-500">
                <CheckCheck className="h-5 w-5 mr-1" />
                <span className="text-sm font-medium">Completado hoy</span>
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowSettingsDialog(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Eliminar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Diálogo de configuración */}
      <HabitSettingsDialog
        habitId={habit.id}
        open={showSettingsDialog}
        onOpenChange={(open) => {
          setShowSettingsDialog(open);
          if (!open && onUpdate) {
            onUpdate();
          }
        }}
        onSuccess={onUpdate}
      />

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el hábito "{habit.title}" y todos sus registros asociados.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 text-white hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}; 