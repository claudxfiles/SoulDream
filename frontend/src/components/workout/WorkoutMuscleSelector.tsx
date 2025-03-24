"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Definición de los grupos musculares disponibles
const muscleGroups = [
  { id: "abs", name: "Abs", image: "/image-workout/abs.png" },
  { id: "biceps", name: "Biceps", image: "/image-workout/Biceps.png" },
  { id: "calves", name: "Calves", image: "/image-workout/Calves.png" },
  { id: "chest", name: "Chest", image: "/image-workout/Chest.png" },
  { id: "forearms", name: "Forearms", image: "/image-workout/forearms.png" },
  { id: "glutes", name: "Glutes", image: "/image-workout/Glutes.png" },
  { id: "hamstring", name: "Hamstring", image: "/image-workout/Hamstring.png" },
  { id: "obliques", name: "Obliques", image: "/image-workout/Obliques.png" },
  { id: "quadriceps", name: "Quadriceps", image: "/image-workout/Quadriceps.png" },
  { id: "shoulder", name: "Shoulders", image: "/image-workout/Shoulder.png" },
  { id: "triceps", name: "Triceps", image: "/image-workout/triceps.png" },
];

interface WorkoutMuscleSelectorProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function WorkoutMuscleSelector({
  selected,
  onChange
}: WorkoutMuscleSelectorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>(selected || []);
  
  // Método para alternar la selección de un músculo
  const toggleMuscle = (muscleId: string) => {
    setSelectedMuscles(prev => {
      if (prev.includes(muscleId)) {
        return prev.filter(id => id !== muscleId);
      } else {
        return [...prev, muscleId];
      }
    });
  };
  
  // Actualizar el state cuando cambian las props
  useEffect(() => {
    setSelectedMuscles(selected || []);
  }, [selected]);
  
  // Aplicar cambios al cerrar el diálogo
  const handleClose = () => {
    onChange(selectedMuscles);
    setIsDialogOpen(false);
  };
  
  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedMuscles.length > 0 ? (
          selectedMuscles.map(muscleId => {
            const muscle = muscleGroups.find(m => m.id === muscleId);
            return (
              <div 
                key={muscleId}
                className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm flex items-center"
              >
                {muscle?.name}
              </div>
            );
          })
        ) : (
          <div className="text-muted-foreground text-sm">Ningún grupo muscular seleccionado</div>
        )}
      </div>
      
      <Button 
        variant="outline" 
        onClick={() => setIsDialogOpen(true)}
        className="w-full justify-start"
      >
        Seleccionar grupos musculares
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Seleccionar grupos musculares</DialogTitle>
            <DialogDescription>
              Selecciona los grupos musculares implicados en este entrenamiento
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4">
            {muscleGroups.map(muscle => (
              <div 
                key={muscle.id}
                onClick={() => toggleMuscle(muscle.id)}
                className={cn(
                  "border rounded-lg p-2 flex flex-col items-center cursor-pointer transition-all hover:border-primary",
                  selectedMuscles.includes(muscle.id) ? "border-primary bg-primary/5" : "border-muted"
                )}
              >
                <div className="relative w-16 h-16 mb-1">
                  <Image
                    src={muscle.image}
                    alt={muscle.name}
                    fill
                    sizes="100%"
                    style={{ objectFit: "contain" }}
                  />
                </div>
                <span className="text-sm font-medium">{muscle.name}</span>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleClose}>
              Aplicar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 