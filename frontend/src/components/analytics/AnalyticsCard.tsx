"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalyticsCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function AnalyticsCard({ title, description, children, className }: AnalyticsCardProps) {
  return (
    <Card className={`shadow-md ${className || ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
} 