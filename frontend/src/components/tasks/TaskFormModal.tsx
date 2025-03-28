import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Task } from '@/types/tasks';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TaskFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: Omit<Task, 'id'>) => Promise<void>;
  initialStatus?: Task['status'];
  initialData?: Task;
}

export function TaskFormModal({ 
  open, 
  onOpenChange, 
  onSubmit,
  initialStatus = 'pending',
  initialData
}: TaskFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [priority, setPriority] = useState<Task['priority']>(initialData?.priority || 'medium');
  const [status, setStatus] = useState<Task['status']>(initialData?.status || initialStatus || 'pending');
  const [dueDate, setDueDate] = useState(initialData?.due_date || '');
  const [dueTime, setDueTime] = useState(initialData?.due_time || '09:00');
  const [timezone, setTimezone] = useState(initialData?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [duration, setDuration] = useState<number>(initialData?.duration_minutes || 60);
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setPriority(initialData.priority || 'medium');
      setStatus(initialData.status || initialStatus || 'pending');
      setDueDate(initialData.due_date || '');
      setDueTime(initialData.due_time || '09:00');
      setTimezone(initialData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
      setDuration(initialData.duration_minutes || 60);
      setTags(initialData.tags || []);
    } else if (!open) {
      // Limpiar campos cuando se cierra el modal
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus(initialStatus || 'pending');
      setDueDate('');
      setDueTime('09:00');
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
      setDuration(60);
      setTags([]);
      setNewTag('');
    }
  }, [initialData, initialStatus, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Crear una fecha UTC combinando due_date y due_time
    let finalDate = undefined;
    let finalTime = dueTime;
    
    if (dueDate) {
      const date = new Date(dueDate);
      const [hours, minutes] = dueTime.split(':');
      
      // Crear fecha en UTC
      const utcDate = new Date(Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        parseInt(hours),
        parseInt(minutes),
        0
      ));
      
      // Formatear la fecha para incluir la hora
      finalDate = utcDate.toISOString().split('.')[0];
      finalTime = `${hours}:${minutes}:00`;
    }
    
    onSubmit({
      title,
      description,
      status,
      priority,
      due_date: finalDate,
      due_time: finalTime,
      timezone,
      duration_minutes: duration,
      tags: tags
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      if (!tags.includes(newTag.trim())) {
        setTags([...tags, newTag.trim()]);
      }
      setNewTag('');
    }
  };

  const handleAddTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar tarea' : 'Nueva tarea'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Modifica los detalles de la tarea existente.' : 'Crea una nueva tarea para tu lista de pendientes.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de la tarea"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción de la tarea"
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label>Prioridad</Label>
            <Select value={priority} onValueChange={(value: Task['priority']) => setPriority(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baja</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Estado</Label>
            <Select value={status} onValueChange={(value: Task['status']) => setStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="in_progress">En progreso</SelectItem>
                <SelectItem value="completed">Completada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Fecha y hora</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal flex-1",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(new Date(dueDate), "d 'de' MMMM 'de' yyyy", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate ? new Date(dueDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const [hours, minutes] = dueTime.split(':');
                        
                        // Crear fecha en UTC
                        const utcDate = new Date(Date.UTC(
                          date.getFullYear(),
                          date.getMonth(),
                          date.getDate(),
                          parseInt(hours),
                          parseInt(minutes),
                          0
                        ));
                        
                        // Guardar la fecha completa con hora
                        setDueDate(utcDate.toISOString().split('.')[0]);
                      } else {
                        setDueDate('');
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Input
                type="time"
                value={dueTime}
                onChange={(e) => {
                  const newTime = e.target.value;
                  setDueTime(newTime);
                  if (dueDate) {
                    const [hours, minutes] = newTime.split(':');
                    const currentDate = new Date(dueDate);
                    
                    // Crear fecha en UTC
                    const utcDate = new Date(Date.UTC(
                      currentDate.getUTCFullYear(),
                      currentDate.getUTCMonth(),
                      currentDate.getUTCDate(),
                      parseInt(hours),
                      parseInt(minutes),
                      0
                    ));
                    
                    // Guardar la fecha completa con hora
                    setDueDate(utcDate.toISOString().split('.')[0]);
                  }
                }}
                className="w-[120px]"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Zona horaria</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar zona horaria" />
              </SelectTrigger>
              <SelectContent>
                {Intl.supportedValuesOf('timeZone').map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Duración</Label>
            <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar duración" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="120">2 horas</SelectItem>
                <SelectItem value="180">3 horas</SelectItem>
                <SelectItem value="240">4 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Etiquetas
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span 
                  key={tag}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-900/50 text-indigo-200"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-red-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe una etiqueta y presiona Enter"
                className="flex-1"
              />
              <Button 
                type="button"
                onClick={() => {
                  if (newTag.trim()) {
                    handleAddTag(newTag.trim());
                    setNewTag('');
                  }
                }}
                variant="secondary"
              >
                Agregar
              </Button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Presiona Enter o el botón Agregar para añadir una etiqueta
            </p>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : initialData ? 'Guardar cambios' : 'Crear tarea'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 