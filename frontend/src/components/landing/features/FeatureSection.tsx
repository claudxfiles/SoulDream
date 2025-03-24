"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Target, 
  DollarSign, 
  Dumbbell, 
  Calendar, 
  MessageSquare,
  BarChart2,
  Shield
} from 'lucide-react';

// Tipos para las características
interface Feature {
  icon: React.ReactNode;
  color: string;
  title: string;
  description: string;
}

export function FeatureSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Colores de las características
  const colors = {
    indigo: "bg-indigo-600",
    emerald: "bg-emerald-600",
    amber: "bg-amber-600",
  };

  // Lista de características
  const features: Feature[] = [
    {
      icon: <CheckCircle className="h-6 w-6 text-white" />,
      color: colors.indigo,
      title: "Gestión de tareas",
      description: "Organiza tus tareas con un sistema Kanban intuitivo. Establece prioridades, fechas límite y categorías para mantener todo bajo control."
    },
    {
      icon: <Target className="h-6 w-6 text-white" />,
      color: colors.emerald,
      title: "Seguimiento de hábitos",
      description: "Desarrolla hábitos positivos con nuestro sistema de seguimiento. Mantén rachas, recibe recordatorios y visualiza tu progreso a lo largo del tiempo."
    },
    {
      icon: <DollarSign className="h-6 w-6 text-white" />,
      color: colors.amber,
      title: "Gestión financiera",
      description: "Controla tus finanzas con herramientas de seguimiento de gastos, presupuestos inteligentes y metas de ahorro personalizadas para cada objetivo."
    },
    {
      icon: <Dumbbell className="h-6 w-6 text-white" />,
      color: colors.indigo,
      title: "Seguimiento fitness",
      description: "Registra tus entrenamientos, sigue tu progreso y recibe rutinas personalizadas por IA para alcanzar tus objetivos de salud y bienestar."
    },
    {
      icon: <Calendar className="h-6 w-6 text-white" />,
      color: colors.emerald,
      title: "Calendario integrado",
      description: "Visualiza todos tus eventos, tareas y hábitos en un calendario unificado. Sincroniza con Google Calendar para una experiencia completa."
    },
    {
      icon: <MessageSquare className="h-6 w-6 text-white" />,
      color: colors.amber,
      title: "Asistente IA",
      description: "Recibe recomendaciones personalizadas, respuestas a tus preguntas y ayuda para optimizar tu productividad con nuestro asistente IA avanzado."
    },
    {
      icon: <BarChart2 className="h-6 w-6 text-white" />,
      color: colors.indigo,
      title: "Analítica personal",
      description: "Obtén insights sobre tus patrones, productividad y hábitos con visualizaciones y reportes detallados de todas tus actividades."
    },
    {
      icon: <Shield className="h-6 w-6 text-white" />,
      color: colors.emerald,
      title: "Privacidad garantizada",
      description: "Tus datos siempre te pertenecen. Contamos con encriptación de última generación y nunca compartimos tu información con terceros."
    }
  ];

  // Animación para el contenedor
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Animación para cada característica
  const featureVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <section id="features" className="py-24 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block px-3 py-1 text-sm font-medium rounded-full text-indigo-600 bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-300">
            Características
          </span>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Todo lo que necesitas para una vida organizada
          </h2>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
            SoulDream integra todas las herramientas que necesitas para gestionar tu vida diaria de manera eficiente y alcanzar tus metas.
          </p>
        </motion.div>

        <motion.div 
          className="mt-16 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index} 
              className="relative"
              variants={featureVariants}
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-lg blur opacity-20 group-hover:opacity-30 transition duration-200"></div>
                <div className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full">
                  <div>
                    <span className={`inline-flex items-center justify-center p-3 ${feature.color} rounded-md shadow-lg`}>
                      {feature.icon}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-base text-gray-500 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
} 