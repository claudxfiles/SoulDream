"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Plus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Workout } from "@/types/workout";
import { getUserWorkouts } from "@/lib/workout";
import { addWorkoutToCalendar } from "@/lib/calendar-service";
import { Badge } from "@/components/ui/badge";

export default function WorkoutCalendarIntegration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAddingToCalendar, setIsAddingToCalendar] = useState<boolean>(false);
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(new Date());
  const [nextWorkouts, setNextWorkouts] = useState<{ date: Date; workouts: Workout[] }[]>([]);

  // Cargar los workouts del usuario
  useEffect(() => {
    const loadWorkouts = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        const data = await getUserWorkouts(user.id);
        setWorkouts(data);
        
        // Organizar los próximos entrenamientos por día
        const today = new Date();
        const nextWorkoutsMap = new Map<string, { date: Date; workouts: Workout[] }>();
        
        // Filtrar solo por entrenamientos futuros
        const futureWorkouts = data.filter(workout => {
          const workoutDate = new Date(workout.date!);
          return workoutDate >= today;
        });
        
        // Agrupar por fecha
        futureWorkouts.forEach(workout => {
          const workoutDate = new Date(workout.date!);
          const dateKey = format(workoutDate, 'yyyy-MM-dd');
          
          if (nextWorkoutsMap.has(dateKey)) {
            nextWorkoutsMap.get(dateKey)!.workouts.push(workout);
          } else {
            nextWorkoutsMap.set(dateKey, {
              date: workoutDate,
              workouts: [workout]
            });
          }
        });
        
        // Convertir el mapa a array y ordenar por fecha
        const nextWorkoutsArray = Array.from(nextWorkoutsMap.values())
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .slice(0, 5); // Mostrar solo los próximos 5 días con entrenamientos
        
        setNextWorkouts(nextWorkoutsArray);
      } catch (error) {
        console.error("Error loading workouts:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los entrenamientos",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadWorkouts();
  }, [user?.id, toast]);

  // Filtrar workouts para la fecha seleccionada
  const workoutsForSelectedDate = workouts.filter(workout => {
    if (!workout.date) return false;
    const workoutDate = new Date(workout.date);
    return isSameDay(workoutDate, selectedDate);
  });

  // Añadir un workout al calendario de Google
  const handleAddToCalendar = async (workout: Workout) => {
    if (!user?.id || !workout.id || !workout.date) return;
    
    try {
      setIsAddingToCalendar(true);
      
      const workoutDate = new Date(workout.date);
      const endDate = new Date(workoutDate);
      endDate.setMinutes(endDate.getMinutes() + (workout.duration_minutes || 60));
      
      await addWorkoutToCalendar({
        title: `Workout: ${workout.name}`,
        description: workout.description || '',
        startDateTime: workoutDate.toISOString(),
        endDateTime: endDate.toISOString(),
        workoutId: workout.id
      });
      
      toast({
        title: "Éxito",
        description: "Entrenamiento añadido al calendario correctamente",
      });
    } catch (error) {
      console.error("Error adding workout to calendar:", error);
      toast({
        title: "Error",
        description: "No se pudo añadir el entrenamiento al calendario",
        variant: "destructive",
      });
    } finally {
      setIsAddingToCalendar(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <span>Planificación de Entrenamientos</span>
          </CardTitle>
          <CardDescription>
            Programa y sincroniza tus entrenamientos con tu calendario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="flex items-center mb-4">
                <h3 className="font-medium">Selecciona una fecha</h3>
                <div className="ml-auto">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {calendarDate ? format(calendarDate, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={calendarDate}
                        onSelect={(date) => {
                          setCalendarDate(date);
                          if (date) setSelectedDate(date);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="space-y-4 mt-6">
                <h3 className="font-medium">Entrenamientos para {format(selectedDate, "PPP", { locale: es })}</h3>
                
                {workoutsForSelectedDate.length === 0 ? (
                  <div className="p-4 border rounded-md text-center text-muted-foreground">
                    No hay entrenamientos programados para esta fecha
                  </div>
                ) : (
                  <div className="space-y-3">
                    {workoutsForSelectedDate.map((workout) => (
                      <Card key={workout.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-base">{workout.name}</CardTitle>
                            <Badge>{workout.workout_type}</Badge>
                          </div>
                          <CardDescription>
                            {workout.duration_minutes && (
                              <span className="flex items-center space-x-1">
                                <span>Duración:</span>
                                <span>{workout.duration_minutes} minutos</span>
                              </span>
                            )}
                          </CardDescription>
                        </CardHeader>
                        <CardFooter className="pt-2 pb-3">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="w-full"
                            onClick={() => handleAddToCalendar(workout)}
                            disabled={isAddingToCalendar}
                          >
                            {isAddingToCalendar ? "Añadiendo..." : "Añadir al Calendario"}
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-4">Próximos Entrenamientos</h3>
              
              {nextWorkouts.length === 0 ? (
                <div className="p-4 border rounded-md text-center text-muted-foreground">
                  No tienes entrenamientos programados en los próximos días
                </div>
              ) : (
                <div className="space-y-4">
                  {nextWorkouts.map((day, index) => (
                    <div key={index} className="border rounded-md overflow-hidden">
                      <div className="bg-muted p-3 font-medium flex items-center justify-between">
                        <span>{format(day.date, "EEEE dd 'de' MMMM", { locale: es })}</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => setSelectedDate(day.date)}
                        >
                          <span className="mr-1">Ver</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="p-3">
                        <div className="space-y-2">
                          {day.workouts.map((workout) => (
                            <div key={workout.id} className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{workout.name}</div>
                                <div className="text-xs text-muted-foreground">{workout.workout_type}</div>
                              </div>
                              <Badge variant="outline">{workout.duration_minutes || '--'} min</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-6">
                <Button 
                  className="w-full" 
                  variant="default"
                  onClick={() => window.location.href = "/dashboard/calendar"}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ir al Calendario
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 