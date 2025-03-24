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
import Link from 'next/link';
import { cn } from '@/lib/utils';
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface HabitCardProps {
  habit: Habit;
  onComplete: () => void;
  onDelete?: (habitId: string) => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({ habit, onComplete, onDelete }) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Encontrar la categoría para obtener el ícono
  const category = HABIT_CATEGORIES.find(c => c.id === habit.category) || HABIT_CATEGORIES[7]; // Default a "Otros"
  
  // Formatear la fecha de creación
  const formattedDate = formatDistanceToNow(new Date(habit.created_at), { 
    addSuffix: true,
    locale: es
  });

  // Verificar si el hábito ya se completó hoy
  const isCompletedToday = habit.isCompletedToday || false;

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
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{habit.title}</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${category.color} bg-opacity-10`}>
              {category.name}
            </span>
          </div>
          
          {habit.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {habit.description}
            </p>
          )}
          
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-2">
            <Clock className="h-4 w-4 mr-1" />
            <span>Creado {formattedDate}</span>
            
            {habit.current_streak > 0 && (
              <div className="ml-4 flex items-center">
                <Activity className="h-4 w-4 mr-1 text-indigo-500" />
                <span className="text-indigo-600 dark:text-indigo-400">
                  {habit.current_streak} días consecutivos
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center">
          {!isCompletedToday ? (
            <Button 
              onClick={onComplete} 
              size="sm" 
              variant="outline" 
              className="flex items-center gap-1 hover:bg-green-50 hover:text-green-600 hover:border-green-200 dark:hover:bg-green-950/50 dark:hover:text-green-400 dark:hover:border-green-800"
              aria-label="Completar hábito"
            >
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>Completar</span>
            </Button>
          ) : (
            <div className="flex items-center text-emerald-500">
              <CheckCheck className="h-5 w-5 mr-1" />
              <span className="text-sm font-medium">Completado hoy</span>
            </div>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-2">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/habits/${habit.id}`}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Detalles/Configuración</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Eliminar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

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