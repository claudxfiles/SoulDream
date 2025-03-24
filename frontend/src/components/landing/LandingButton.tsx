'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LandingButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  onClick?: () => void;
}

export function LandingButton({
  href,
  children,
  variant = 'primary',
  size = 'default',
  className,
  onClick,
}: LandingButtonProps) {
  const variantClasses = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    outline: 'border border-gray-300 bg-transparent hover:bg-gray-100 text-gray-800 dark:text-white dark:hover:bg-gray-800 dark:border-gray-700',
  };

  const sizeClasses = {
    sm: 'h-8 px-3 py-1 text-xs',
    default: 'h-9 px-4 py-2 text-sm',
    lg: 'h-10 px-6 py-2 text-base',
  };

  const buttonClasses = cn(
    'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500',
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  return (
    <Link 
      href={href}
      className={buttonClasses}
      onClick={onClick}
    >
      {children}
    </Link>
  );
} 