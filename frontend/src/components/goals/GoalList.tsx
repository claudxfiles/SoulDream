import { Goal } from '@/types/goals';
import { GoalCard } from './GoalCard';
import { useGoals } from '@/hooks/goals/useGoals';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GoalListProps {
  goals: Goal[];
}

export function GoalList({ goals }: GoalListProps) {
  const { selectedGoal, selectGoal } = useGoals();

  if (goals.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-center">
        <div className="space-y-2">
          <p className="text-lg font-medium">No hay metas en esta área</p>
          <p className="text-sm text-muted-foreground">
            Crea una nueva meta usando el botón "Nueva Meta"
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="space-y-4 pr-4">
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            isSelected={selectedGoal?.id === goal.id}
            onClick={() => selectGoal(goal.id)}
          />
        ))}
      </div>
    </ScrollArea>
  );
} 