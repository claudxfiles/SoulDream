import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Goal } from '@/types/goals';

const updateGoalSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  area: z.enum(['Desarrollo Personal', 'Salud y Bienestar', 'Educación', 'Finanzas', 'Hobbies'] as const),
  type: z.enum(['Otro', 'Proyecto', 'Hábito', 'Aprendizaje', 'Financiero'] as const),
  priority: z.enum(['Baja', 'Media', 'Alta'] as const),
  progress_type: z.enum(['numeric', 'percentage', 'boolean'] as const),
  target_value: z.number().min(0).optional(),
  current_value: z.number().min(0).optional(),
  target_date: z.date().optional(),
  status: z.enum(['active', 'completed', 'archived'] as const),
});

type UpdateGoalFormData = z.infer<typeof updateGoalSchema>;

interface UpdateGoalDialogProps {
  goal: Goal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (goalId: string, data: Partial<Goal>) => void;
}

export function UpdateGoalDialog({
  goal,
  open,
  onOpenChange,
  onSubmit,
}: UpdateGoalDialogProps) {
  const form = useForm<UpdateGoalFormData>({
    resolver: zodResolver(updateGoalSchema),
    defaultValues: {
      title: goal.title,
      description: goal.description,
      area: goal.area,
      type: goal.type,
      priority: goal.priority,
      progress_type: goal.progress_type,
      target_value: goal.target_value,
      current_value: goal.current_value,
      target_date: goal.target_date ? new Date(goal.target_date) : undefined,
      status: goal.status,
    },
  });

  const handleSubmit = (data: UpdateGoalFormData) => {
    const updates: Partial<Goal> = {
      ...data,
      target_date: data.target_date?.toISOString(),
    };
    onSubmit(goal.id, updates);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar meta</DialogTitle>
          <DialogDescription>
            Modifica los detalles de tu meta. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Escribe el título de tu meta" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe tu meta en detalle"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un área" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Desarrollo Personal">
                          Desarrollo Personal
                        </SelectItem>
                        <SelectItem value="Salud y Bienestar">
                          Salud y Bienestar
                        </SelectItem>
                        <SelectItem value="Educación">Educación</SelectItem>
                        <SelectItem value="Finanzas">Finanzas</SelectItem>
                        <SelectItem value="Hobbies">Hobbies</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Otro">Otro</SelectItem>
                        <SelectItem value="Proyecto">Proyecto</SelectItem>
                        <SelectItem value="Hábito">Hábito</SelectItem>
                        <SelectItem value="Aprendizaje">Aprendizaje</SelectItem>
                        <SelectItem value="Financiero">Financiero</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridad *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona la prioridad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Baja">Baja</SelectItem>
                        <SelectItem value="Media">Media</SelectItem>
                        <SelectItem value="Alta">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Activa</SelectItem>
                        <SelectItem value="completed">Completada</SelectItem>
                        <SelectItem value="archived">Archivada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="progress_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de progreso *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo de progreso" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="percentage">Porcentaje</SelectItem>
                        <SelectItem value="numeric">Numérico</SelectItem>
                        <SelectItem value="boolean">Si/No</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="target_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor objetivo</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.valueAsNumber)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="current_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor actual</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.valueAsNumber)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="target_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha objetivo</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP', { locale: es })
                            ) : (
                              <span>Selecciona una fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date()
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar cambios</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 