'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  TooltipRoot, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';

type FixedTooltipProps = {
  content: React.ReactNode;
  children: React.ReactNode;
};

export function FixedTooltip({ content, children }: FixedTooltipProps) {
  // Make sure we're always passing a single child element to TooltipTrigger
  return (
    <TooltipProvider>
      <TooltipRoot>
        <TooltipTrigger asChild>
          {/* The div ensures we always have a single React element as the child */}
          <div className="inline-block">{children}</div>
        </TooltipTrigger>
        <TooltipContent>
          {content}
        </TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  );
}

// Specialized component for buttons with tooltips
type TooltipButtonProps = {
  content: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
};

export function TooltipButton({ 
  content, 
  children,
  onClick, 
  disabled = false,
  variant = 'ghost',
  size = 'icon'
}: TooltipButtonProps) {
  return (
    <TooltipProvider>
      <TooltipRoot>
        <TooltipTrigger asChild>
          <Button 
            variant={variant} 
            size={size} 
            onClick={onClick}
            disabled={disabled}
          >
            {/* Ensure children is a single React element or primitive */}
            {React.Children.count(children) > 1 ? <span>{children}</span> : children}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {content}
        </TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  );
} 