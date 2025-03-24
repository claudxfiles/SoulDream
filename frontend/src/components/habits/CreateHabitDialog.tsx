'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HabitCreate } from '@/types/habit';
import { HABIT_CATEGORIES } from '@/types/habit';

interface CreateHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateHabit: (habit: HabitCreate) => void;
}

export const CreateHabitDialog: React.FC<CreateHabitDialogProps> = ({
  open,
  onOpenChange,
  onCreateHabit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      return; // No permitir crear hábitos sin título
    }
    
    const newHabit: HabitCreate = {
      title,
      description: description || undefined,
      frequency: 'daily', // Simplificado a diario por defecto
      category: category || undefined,
      goal_value: 1, // Valor predeterminado
      is_active: true,
      specific_days: null
    };
    
    onCreateHabit(newHabit);
    resetForm();
    onOpenChange(false);
  };
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('');
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nuevo hábito</DialogTitle>
            <DialogDescription>
              Crea un nuevo hábito para realizar seguimiento diario.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">
                ¿Qué hábito quieres formar?
              </Label>
              <Input
                id="title"
                placeholder="Ej: Leer 10 minutos, Meditar, Beber agua..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">
                Descripción (opcional)
              </Label>
              <Textarea
                id="description"
                placeholder="Añade detalles sobre este hábito..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="category">
                Categoría
              </Label>
              <Select
                value={category}
                onValueChange={setCategory}
              >
                <SelectTrigger id="category">
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
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              Crear
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 