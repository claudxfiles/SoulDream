import { GoalMockData } from '@/types/goals';

export const mockGoals: GoalMockData[] = [
    {
        id: 1,
        title: 'Aprender desarrollo web fullstack',
        description: 'Dominar tecnologías frontend y backend para desarrollo web',
        category: 'Educación',
        progress: 60,
        targetDate: '2024-12-31',
        status: 'active'
    },
    {
        id: 2,
        title: 'Comprar moto',
        description: 'Ahorrar para comprar una moto Honda CB500F',
        category: 'Finanzas',
        progress: 35,
        targetDate: '2024-06-30',
        status: 'active'
    },
    {
        id: 3,
        title: 'Mejorar condición física',
        description: 'Aumentar resistencia y fuerza a través de entrenamiento regular',
        category: 'Salud y Bienestar',
        progress: 45,
        targetDate: '2024-12-31',
        status: 'active'
    }
]; 