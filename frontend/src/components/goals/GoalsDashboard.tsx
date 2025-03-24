'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, ChevronRight, Target, Brain, Book, Wallet, Heart } from 'lucide-react';
import { GoalCard } from './GoalCard';
import { GoalProgress } from './GoalProgress';
import { GoalAreaSummary } from './GoalAreaSummary';
import { GoalFormModal } from './GoalFormModal';

// Tipos para las metas
export interface Goal {
  id: string;
  title: string;
  description: string;
  area: 'desarrollo_personal' | 'salud_bienestar' | 'educacion' | 'finanzas' | 'hobbies';
  targetDate: string;
  progressPercentage: number;
  status: 'active' | 'completed' | 'abandoned';
  steps: GoalStep[];
  priority: 'low' | 'medium' | 'high';
  visualizationImageUrl?: string;
  type: 'adquisicion' | 'aprendizaje' | 'habito' | 'otro';
}

export interface GoalStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: string;
  aiGenerated: boolean;
}

export function GoalsDashboard() {
  // Datos de ejemplo
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Comprar moto',
      description: 'Ahorrar para comprar una moto Honda CB500F',
      area: 'finanzas',
      targetDate: '2024-12-31',
      progressPercentage: 35,
      status: 'active',
      priority: 'high',
      visualizationImageUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      type: 'adquisicion',
      steps: [
        {
          id: '1-1',
          title: 'Investigar modelos y precios',
          description: 'Comparar diferentes modelos y sus precios en el mercado',
          status: 'completed',
          aiGenerated: true
        },
        {
          id: '1-2',
          title: 'Crear fondo de ahorro específico',
          description: 'Abrir una cuenta de ahorro dedicada para la moto',
          status: 'completed',
          aiGenerated: true
        },
        {
          id: '1-3',
          title: 'Ahorrar $500 mensuales',
          description: 'Transferir $500 al fondo de ahorro cada mes',
          status: 'in_progress',
          dueDate: '2024-12-01',
          aiGenerated: true
        },
        {
          id: '1-4',
          title: 'Obtener licencia de conducir para motocicletas',
          description: 'Tomar el curso y examen para licencia tipo A',
          status: 'pending',
          dueDate: '2024-09-30',
          aiGenerated: true
        }
      ]
    },
    {
      id: '2',
      title: 'Aprender desarrollo web fullstack',
      description: 'Dominar tecnologías frontend y backend para desarrollo web',
      area: 'educacion',
      targetDate: '2024-08-31',
      progressPercentage: 60,
      status: 'active',
      priority: 'high',
      type: 'aprendizaje',
      steps: [
        {
          id: '2-1',
          title: 'Completar curso de HTML/CSS',
          description: 'Finalizar el curso básico de HTML y CSS',
          status: 'completed',
          aiGenerated: false
        },
        {
          id: '2-2',
          title: 'Aprender JavaScript',
          description: 'Completar curso de JavaScript moderno',
          status: 'completed',
          aiGenerated: false
        },
        {
          id: '2-3',
          title: 'Dominar React',
          description: 'Construir 3 proyectos con React',
          status: 'in_progress',
          dueDate: '2024-06-30',
          aiGenerated: false
        },
        {
          id: '2-4',
          title: 'Aprender Node.js y Express',
          description: 'Crear APIs RESTful con Node.js y Express',
          status: 'pending',
          dueDate: '2024-07-31',
          aiGenerated: false
        }
      ]
    },
    {
      id: '3',
      title: 'Mejorar condición física',
      description: 'Aumentar resistencia y fuerza a través de entrenamiento regular',
      area: 'salud_bienestar',
      targetDate: '2024-06-30',
      progressPercentage: 45,
      status: 'active',
      priority: 'medium',
      type: 'habito',
      steps: [
        {
          id: '3-1',
          title: 'Establecer rutina de ejercicios',
          description: 'Crear plan de entrenamiento semanal',
          status: 'completed',
          aiGenerated: true
        },
        {
          id: '3-2',
          title: 'Correr 5km sin parar',
          description: 'Incrementar gradualmente distancia de carrera',
          status: 'in_progress',
          dueDate: '2024-05-15',
          aiGenerated: true
        },
        {
          id: '3-3',
          title: 'Completar 30 días de entrenamiento consecutivos',
          description: 'Mantener consistencia en la rutina diaria',
          status: 'in_progress',
          dueDate: '2024-05-30',
          aiGenerated: true
        }
      ]
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddGoal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveGoal = (newGoal: Partial<Goal>) => {
    // Generar un ID único para la nueva meta
    const goalId = `goal-${Date.now()}`;
    
    // Crear la nueva meta con valores por defecto para los campos faltantes
    const goalToAdd: Goal = {
      id: goalId,
      title: newGoal.title || '',
      description: newGoal.description || '',
      area: newGoal.area as 'desarrollo_personal' | 'salud_bienestar' | 'educacion' | 'finanzas' | 'hobbies',
      targetDate: newGoal.targetDate || '',
      progressPercentage: 0,
      status: 'active',
      priority: newGoal.priority as 'low' | 'medium' | 'high',
      type: newGoal.type as 'adquisicion' | 'aprendizaje' | 'habito' | 'otro',
      visualizationImageUrl: newGoal.visualizationImageUrl,
      steps: []
    };
    
    // Añadir la nueva meta al estado
    setGoals(prevGoals => [...prevGoals, goalToAdd]);
    
    // Cerrar el modal
    setIsModalOpen(false);
    
    // Aquí se podría añadir lógica para generar pasos automáticamente con IA
    // Por ejemplo, si es una meta financiera, generar pasos para ahorrar, etc.
  };

  // Filtrar metas por área
  const personalDevelopmentGoals = goals.filter(goal => goal.area === 'desarrollo_personal');
  const healthWellnessGoals = goals.filter(goal => goal.area === 'salud_bienestar');
  const educationGoals = goals.filter(goal => goal.area === 'educacion');
  const financeGoals = goals.filter(goal => goal.area === 'finanzas');
  const hobbiesGoals = goals.filter(goal => goal.area === 'hobbies');

  // Obtener el ícono según el área
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

  // Obtener el nombre del área
  const getAreaName = (area: string) => {
    switch (area) {
      case 'desarrollo_personal':
        return 'Desarrollo Personal';
      case 'salud_bienestar':
        return 'Salud y Bienestar';
      case 'educacion':
        return 'Educación';
      case 'finanzas':
        return 'Finanzas';
      case 'hobbies':
        return 'Hobbies';
      default:
        return 'Otra';
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mis Metas</h1>
        <button 
          onClick={handleAddGoal}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
        >
          <Plus size={16} className="mr-2" />
          Nueva Meta
        </button>
      </div>

      {/* Resumen de metas por área */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <GoalAreaSummary 
          area="desarrollo_personal"
          icon={<Brain className="h-5 w-5" />}
          name="Desarrollo Personal"
          count={personalDevelopmentGoals.length}
          progress={personalDevelopmentGoals.reduce((acc, goal) => acc + goal.progressPercentage, 0) / (personalDevelopmentGoals.length || 1)}
        />
        <GoalAreaSummary 
          area="salud_bienestar"
          icon={<Heart className="h-5 w-5" />}
          name="Salud y Bienestar"
          count={healthWellnessGoals.length}
          progress={healthWellnessGoals.reduce((acc, goal) => acc + goal.progressPercentage, 0) / (healthWellnessGoals.length || 1)}
        />
        <GoalAreaSummary 
          area="educacion"
          icon={<Book className="h-5 w-5" />}
          name="Educación"
          count={educationGoals.length}
          progress={educationGoals.reduce((acc, goal) => acc + goal.progressPercentage, 0) / (educationGoals.length || 1)}
        />
        <GoalAreaSummary 
          area="finanzas"
          icon={<Wallet className="h-5 w-5" />}
          name="Finanzas"
          count={financeGoals.length}
          progress={financeGoals.reduce((acc, goal) => acc + goal.progressPercentage, 0) / (financeGoals.length || 1)}
        />
        <GoalAreaSummary 
          area="hobbies"
          icon={<Target className="h-5 w-5" />}
          name="Hobbies"
          count={hobbiesGoals.length}
          progress={hobbiesGoals.reduce((acc, goal) => acc + goal.progressPercentage, 0) / (hobbiesGoals.length || 1)}
        />
      </div>

      {/* Tabs para filtrar por área */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="desarrollo_personal">Desarrollo Personal</TabsTrigger>
          <TabsTrigger value="salud_bienestar">Salud y Bienestar</TabsTrigger>
          <TabsTrigger value="educacion">Educación</TabsTrigger>
          <TabsTrigger value="finanzas">Finanzas</TabsTrigger>
          <TabsTrigger value="hobbies">Hobbies</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {goals.map(goal => (
            <GoalCard key={goal.id} goal={goal} areaName={getAreaName(goal.area)} areaIcon={getAreaIcon(goal.area)} />
          ))}
        </TabsContent>

        <TabsContent value="desarrollo_personal" className="space-y-4">
          {personalDevelopmentGoals.map(goal => (
            <GoalCard key={goal.id} goal={goal} areaName={getAreaName(goal.area)} areaIcon={getAreaIcon(goal.area)} />
          ))}
        </TabsContent>

        <TabsContent value="salud_bienestar" className="space-y-4">
          {healthWellnessGoals.map(goal => (
            <GoalCard key={goal.id} goal={goal} areaName={getAreaName(goal.area)} areaIcon={getAreaIcon(goal.area)} />
          ))}
        </TabsContent>

        <TabsContent value="educacion" className="space-y-4">
          {educationGoals.map(goal => (
            <GoalCard key={goal.id} goal={goal} areaName={getAreaName(goal.area)} areaIcon={getAreaIcon(goal.area)} />
          ))}
        </TabsContent>

        <TabsContent value="finanzas" className="space-y-4">
          {financeGoals.map(goal => (
            <GoalCard key={goal.id} goal={goal} areaName={getAreaName(goal.area)} areaIcon={getAreaIcon(goal.area)} />
          ))}
        </TabsContent>

        <TabsContent value="hobbies" className="space-y-4">
          {hobbiesGoals.map(goal => (
            <GoalCard key={goal.id} goal={goal} areaName={getAreaName(goal.area)} areaIcon={getAreaIcon(goal.area)} />
          ))}
        </TabsContent>
      </Tabs>

      {/* Modal para añadir/editar metas */}
      <GoalFormModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveGoal}
      />
    </div>
  );
} 