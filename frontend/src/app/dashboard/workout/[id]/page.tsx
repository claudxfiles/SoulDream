import { Metadata } from "next";
import WorkoutDetail from "@/components/workout/WorkoutDetail";

export const metadata: Metadata = {
  title: "Detalle de Entrenamiento | SoulDream",
  description: "Visualiza y edita los detalles de tu entrenamiento",
};

export default function WorkoutDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col gap-6 p-6">
      <WorkoutDetail id={params.id} />
    </div>
  );
} 