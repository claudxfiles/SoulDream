"use client";

import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { Message } from '@/hooks/useAIAssistant';
import { format } from 'date-fns';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex w-full gap-3 p-4',
        isUser ? 'bg-muted/50' : 'bg-background'
      )}
    >
      <Avatar className={cn(
        'h-8 w-8',
        isUser ? 'bg-primary' : 'bg-blue-500'
      )}>
        <span className="text-xs font-medium text-white">
          {isUser ? 'U' : 'AI'}
        </span>
      </Avatar>

      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {isUser ? 'You' : 'Assistant'}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.timestamp), 'h:mm a')}
          </span>
        </div>

        <div className="text-sm leading-relaxed">
          {message.content.split('\n').map((text, i) => (
            <p key={i} className={i > 0 ? 'mt-4' : ''}>
              {text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
