"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ArrowLeftIcon, TimerIcon } from "lucide-react";
import WorkoutTracker from "@/components/workout/WorkoutTracker";
import { DumbbellIcon, LineChartIcon } from "lucide-react";

export default function WorkoutTrackerPage() {
  const searchParams = useSearchParams();
  const workoutParam = searchParams.get('workout');
  const [workoutData, setWorkoutData] = useState(null);

  useEffect(() => {
    if (workoutParam) {
      try {
        const data = JSON.parse(decodeURIComponent(workoutParam));
        setWorkoutData(data);
      } catch (error) {
        console.error("Error parsing workout data:", error);
      }
    }
  }, [workoutParam]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Rastreador de Entrenamiento"
          description="Registra tu progreso en tiempo real durante tus entrenamientos"
          icon={<TimerIcon className="h-6 w-6 text-amber-500" />}
        />
        <Link href="/dashboard/workout">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeftIcon className="h-4 w-4" />
            Volver al dashboard
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Panel lateral con información */}
        <div className="lg:col-span-1 space-y-4 order-2 lg:order-1">
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <DumbbellIcon className="h-4 w-4 text-primary" />
              Consejos rápidos
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-1.5">
                <span className="text-primary font-medium mt-0.5">•</span> 
                <span>Registra el peso y repeticiones de cada serie para un seguimiento preciso</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-primary font-medium mt-0.5">•</span> 
                <span>Usa el temporizador de descanso entre series para maximizar resultados</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-primary font-medium mt-0.5">•</span> 
                <span>Al finalizar, guarda tu entrenamiento para analizar tu progreso</span>
              </li>
            </ul>
          </div>
          
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <LineChartIcon className="h-4 w-4 text-primary" />
              Beneficios
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border bg-background p-2 text-center">
                <div className="text-2xl font-semibold text-primary">100%</div>
                <div className="text-xs text-muted-foreground">Precisión</div>
              </div>
              <div className="rounded-lg border bg-background p-2 text-center">
                <div className="text-2xl font-semibold text-emerald-500">30%</div>
                <div className="text-xs text-muted-foreground">Mejor rendimiento</div>
              </div>
              <div className="rounded-lg border bg-background p-2 text-center">
                <div className="text-2xl font-semibold text-amber-500">25%</div>
                <div className="text-xs text-muted-foreground">Menos tiempo</div>
              </div>
              <div className="rounded-lg border bg-background p-2 text-center">
                <div className="text-2xl font-semibold text-indigo-500">40%</div>
                <div className="text-xs text-muted-foreground">Mayor motivación</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Rastreador principal */}
        <div className="lg:col-span-4 order-1 lg:order-2">
          <WorkoutTracker initialWorkout={workoutData} />
        </div>
      </div>
    </div>
  );
} 