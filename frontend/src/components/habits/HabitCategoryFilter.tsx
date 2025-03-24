'use client';

import React from 'react';
import { HABIT_CATEGORIES } from '@/types/habit';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HabitCategoryFilterProps {
  selectedCategory?: string;
  onCategoryChange: (category?: string) => void;
}

export const HabitCategoryFilter: React.FC<HabitCategoryFilterProps> = ({
  selectedCategory,
  onCategoryChange,
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={!selectedCategory ? "secondary" : "outline"}
        size="sm"
        onClick={() => onCategoryChange(undefined)}
        className="flex items-center"
      >
        {!selectedCategory && <Check className="mr-1 h-4 w-4" />}
        Todos
      </Button>
      
      {HABIT_CATEGORIES.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? "secondary" : "outline"}
          size="sm"
          onClick={() => onCategoryChange(category.id)}
          className={cn(
            "flex items-center",
            selectedCategory === category.id && "text-white"
          )}
        >
          {selectedCategory === category.id && <Check className="mr-1 h-4 w-4" />}
          {category.name}
        </Button>
      ))}
    </div>
  );
}; 