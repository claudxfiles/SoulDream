import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rastreador de Entrenamiento | SoulDream",
  description: "Registra tu progreso en tiempo real durante tus entrenamientos",
};

export default function WorkoutTrackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 