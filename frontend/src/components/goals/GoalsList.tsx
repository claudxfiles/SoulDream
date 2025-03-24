import { Goal } from '@/store/goals/useGoalsStore';
import { useGoalsStore } from '@/store/goals/useGoalsStore';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface GoalsListProps {
  goals: Goal[];
}

export function GoalsList({ goals }: GoalsListProps) {
  const { selectedGoal, setSelectedGoal } = useGoalsStore();

  const getCategoryColor = (category: Goal['category']) => {
    const colors = {
      personal_development: 'bg-blue-500',
      health_wellness: 'bg-green-500',
      education: 'bg-purple-500',
      finance: 'bg-yellow-500',
      hobbies: 'bg-pink-500',
    };
    return colors[category] || 'bg-gray-500';
  };

  const getPriorityColor = (priority: Goal['priority']) => {
    const colors = {
      high: 'bg-red-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500',
    };
    return colors[priority] || 'bg-gray-500';
  };

  return (
    <div className="space-y-4">
      {goals.map((goal) => (
        <Card
          key={goal.id}
          className={cn(
            'cursor-pointer p-4 transition-all hover:shadow-md',
            selectedGoal?.id === goal.id ? 'ring-2 ring-primary' : ''
          )}
          onClick={() => setSelectedGoal(goal)}
        >
          <div className="flex flex-col space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold">{goal.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {goal.description}
                </p>
              </div>
              <Badge variant="outline" className={cn('ml-2', getPriorityColor(goal.priority))}>
                {goal.priority}
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              <Badge className={cn('capitalize', getCategoryColor(goal.category))}>
                {goal.category.replace('_', ' ')}
              </Badge>
              <Badge variant="outline" className={cn('capitalize')}>
                {goal.type}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>{goal.progressPercentage}%</span>
              </div>
              <Progress value={goal.progressPercentage} className="h-2" />
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Due {format(new Date(goal.targetDate), 'dd/MM/yyyy', { locale: es })}
              </span>
              <Badge variant="outline" className={cn('capitalize')}>
                {goal.status}
              </Badge>
            </div>
          </div>
        </Card>
      ))}

      {goals.length === 0 && (
        <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">No goals found</p>
        </div>
      )}
    </div>
  );
} 