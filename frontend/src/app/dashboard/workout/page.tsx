import { Metadata } from "next";
import WorkoutDashboard from "@/components/workout/WorkoutDashboard";

export const metadata: Metadata = {
  title: "Workout | SoulDream",
  description: "Seguimiento de ejercicios y progreso físico",
};

export default function WorkoutPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Workout</h1>
        <p className="text-muted-foreground">
          Registra tus entrenamientos y visualiza tu progreso físico
        </p>
      </div>
      <WorkoutDashboard />
    </div>
  );
} 