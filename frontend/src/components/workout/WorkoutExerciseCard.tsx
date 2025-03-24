"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  DumbbellIcon,
  ClockIcon,
  CheckCircleIcon,
  InfoIcon,
  Dumbbell,
  SlidersHorizontalIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MuscleGroup, muscleGroupImages, WorkoutExercise, ExerciseType } from "@/types/workout";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface WorkoutExerciseCardProps {
  exercise: WorkoutExercise;
  muscleGroup?: MuscleGroup;
  completed?: boolean;
  onView?: () => void;
  exerciseType?: ExerciseType;
  className?: string;
}

export default function WorkoutExerciseCard({
  exercise,
  muscleGroup,
  completed = false,
  onView,
  exerciseType,
  className
}: WorkoutExerciseCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Determinar color por tipo de ejercicio
  const getExerciseTypeColor = () => {
    if (!exerciseType) return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    
    switch (exerciseType) {
      case ExerciseType.STRENGTH:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case ExerciseType.CARDIO:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case ExerciseType.FLEXIBILITY:
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case ExerciseType.BODYWEIGHT:
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
      case ExerciseType.COMPOUND:
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300";
      case ExerciseType.ISOLATION:
        return "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  return (
    <Card className={cn(
      "overflow-hidden transition-all border",
      completed ? "border-green-200 bg-green-50/30 dark:bg-green-950/10 dark:border-green-900/30" : "",
      className
    )}>
      <div className="flex items-center p-4">
        <div className="flex-shrink-0 mr-4">
          {muscleGroup && muscleGroupImages[muscleGroup] ? (
            <div className="relative h-12 w-12 rounded-full overflow-hidden border bg-background">
              <Image
                src={muscleGroupImages[muscleGroup]}
                alt={muscleGroup}
                fill
                sizes="100%"
                style={{ objectFit: "contain" }}
                className="p-1"
              />
            </div>
          ) : (
            <div className="h-12 w-12 rounded-full flex items-center justify-center bg-primary/10">
              <DumbbellIcon className="h-6 w-6 text-primary" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="font-medium truncate">{exercise.name}</h3>
              {completed && (
                <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 ml-2" />
              )}
            </div>
            
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <div className="text-xs flex items-center text-muted-foreground">
                <SlidersHorizontalIcon className="h-3 w-3 mr-1" />
                {exercise.sets} series x {exercise.reps} reps
              </div>
              
              {exercise.weight && (
                <div className="text-xs flex items-center text-muted-foreground">
                  <DumbbellIcon className="h-3 w-3 mr-1" />
                  {exercise.weight} kg
                </div>
              )}
              
              {exercise.rest_seconds && (
                <div className="text-xs flex items-center text-muted-foreground">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  {exercise.rest_seconds}s descanso
                </div>
              )}
              
              {exerciseType && (
                <Badge variant="outline" className={cn("text-xs py-0 h-5", getExerciseTypeColor())}>
                  {exerciseType}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex-shrink-0 ml-2 flex items-center gap-2">
          {exercise.notes && (
            <TooltipProvider>
              <Tooltip
                content={<p className="max-w-xs">{exercise.notes}</p>}
              >
                <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </Tooltip>
            </TooltipProvider>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      {expanded && (
        <div className="px-4 pb-4 pt-0">
          <div className="rounded-md border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Serie</th>
                  <th className="text-left p-2">Peso</th>
                  <th className="text-left p-2">Reps</th>
                  <th className="text-left p-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: exercise.sets }).map((_, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-muted/50" : ""}>
                    <td className="p-2">{idx + 1}</td>
                    <td className="p-2">{exercise.weight || "-"} kg</td>
                    <td className="p-2">{exercise.reps}</td>
                    <td className="p-2">
                      {completed ? (
                        <div className="flex items-center">
                          <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-xs">Completado</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Pendiente</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {exercise.notes && (
            <div className="mt-3">
              <h4 className="text-sm font-medium mb-1">Notas:</h4>
              <p className="text-sm text-muted-foreground">{exercise.notes}</p>
            </div>
          )}
          
          {onView && (
            <div className="mt-3 flex justify-end">
              <Button variant="outline" size="sm" onClick={onView}>
                Ver detalles
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
} 