import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkoutType, type WorkoutInsert } from '@/types/workout';
import { useCalendarStore } from '@/store/calendarStore';
import { workoutToCalendarEvent } from '@/adapters/calendarAdapter';
import { useToast } from '@/components/ui/use-toast';

export function WorkoutScheduler() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [workoutName, setWorkoutName] = useState('');
  const [workoutType, setWorkoutType] = useState<WorkoutType>(WorkoutType.CUSTOM);
  const [duration, setDuration] = useState('60');
  
  const { addEvent } = useCalendarStore();
  const { toast } = useToast();

  const handleScheduleWorkout = () => {
    if (!selectedDate || !workoutName) {
      toast({
        title: 'Error',
        description: 'Por favor completa todos los campos requeridos',
        variant: 'destructive'
      });
      return;
    }

    const workout: WorkoutInsert = {
      name: workoutName,
      date: selectedDate.toISOString(),
      duration_minutes: parseInt(duration),
      workout_type: workoutType,
      user_id: '', // Se llenará en el backend
    };

    const event = workoutToCalendarEvent(workout as any);
    addEvent(event);

    toast({
      title: 'Entrenamiento programado',
      description: `${workoutName} ha sido agendado para ${selectedDate.toLocaleDateString()}`
    });

    // Limpiar el formulario
    setWorkoutName('');
    setSelectedDate(undefined);
    setWorkoutType(WorkoutType.CUSTOM);
    setDuration('60');
  };

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-medium">Programar Entrenamiento</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="workout-name">Nombre del entrenamiento</Label>
          <Input
            id="workout-name"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            placeholder="Ej: Entrenamiento de piernas"
          />
        </div>

        <div className="space-y-2">
          <Label>Fecha</Label>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="workout-type">Tipo de entrenamiento</Label>
          <Select value={workoutType} onValueChange={(value) => setWorkoutType(value as WorkoutType)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un tipo" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(WorkoutType).map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duración (minutos)</Label>
          <Input
            id="duration"
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            min="1"
            max="360"
          />
        </div>

        <Button onClick={handleScheduleWorkout} className="w-full">
          Programar Entrenamiento
        </Button>
      </div>
    </div>
  );
} 