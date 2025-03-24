'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Brain, Heart, Book, Wallet, Target } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Goal } from './GoalsDashboard';

interface GoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: Partial<Goal>) => void;
  initialGoal?: Partial<Goal>;
}

export function GoalFormModal({ isOpen, onClose, onSave, initialGoal }: GoalFormModalProps) {
  const [formData, setFormData] = useState<Partial<Goal>>(
    initialGoal || {
      title: '',
      description: '',
      area: 'desarrollo_personal',
      targetDate: format(new Date().setMonth(new Date().getMonth() + 3), 'yyyy-MM-dd'),
      priority: 'medium',
      type: 'otro',
      steps: []
    }
  );

  const [date, setDate] = useState<Date | undefined>(
    initialGoal?.targetDate ? new Date(initialGoal.targetDate) : new Date(new Date().setMonth(new Date().getMonth() + 3))
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setDate(date);
      setFormData(prev => ({ ...prev, targetDate: format(date, 'yyyy-MM-dd') }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const getAreaIcon = (area: string) => {
    switch (area) {
      case 'desarrollo_personal':
        return <Brain className="h-5 w-5" />;
      case 'salud_bienestar':
        return <Heart className="h-5 w-5" />;
      case 'educacion':
        return <Book className="h-5 w-5" />;
      case 'finanzas':
        return <Wallet className="h-5 w-5" />;
      case 'hobbies':
        return <Target className="h-5 w-5" />;
      default:
        return <Target className="h-5 w-5" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialGoal ? 'Editar Meta' : 'Crear Nueva Meta'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ej: Comprar una casa"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe tu meta en detalle"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="area">Área</Label>
                <Select 
                  value={formData.area as string} 
                  onValueChange={(value) => handleSelectChange('area', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un área" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desarrollo_personal">
                      <div className="flex items-center">
                        <Brain className="h-4 w-4 mr-2" />
                        <span>Desarrollo Personal</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="salud_bienestar">
                      <div className="flex items-center">
                        <Heart className="h-4 w-4 mr-2" />
                        <span>Salud y Bienestar</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="educacion">
                      <div className="flex items-center">
                        <Book className="h-4 w-4 mr-2" />
                        <span>Educación</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="finanzas">
                      <div className="flex items-center">
                        <Wallet className="h-4 w-4 mr-2" />
                        <span>Finanzas</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="hobbies">
                      <div className="flex items-center">
                        <Target className="h-4 w-4 mr-2" />
                        <span>Hobbies</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="type">Tipo</Label>
                <Select 
                  value={formData.type as string} 
                  onValueChange={(value) => handleSelectChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adquisicion">Adquisición</SelectItem>
                    <SelectItem value="aprendizaje">Aprendizaje</SelectItem>
                    <SelectItem value="habito">Hábito</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="targetDate">Fecha objetivo</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP', { locale: es }) : <span>Selecciona una fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={handleDateChange}
                      initialFocus
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="priority">Prioridad</Label>
                <Select 
                  value={formData.priority as string} 
                  onValueChange={(value) => handleSelectChange('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="low">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {formData.type === 'adquisicion' && formData.area === 'finanzas' && (
              <div className="grid gap-2">
                <Label htmlFor="visualizationImageUrl">URL de imagen (opcional)</Label>
                <Input
                  id="visualizationImageUrl"
                  name="visualizationImageUrl"
                  value={formData.visualizationImageUrl || ''}
                  onChange={handleChange}
                  placeholder="URL de una imagen para visualizar tu meta"
                />
                <p className="text-xs text-gray-500">
                  Añade una imagen para visualizar mejor tu meta financiera
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {initialGoal ? 'Guardar cambios' : 'Crear meta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 