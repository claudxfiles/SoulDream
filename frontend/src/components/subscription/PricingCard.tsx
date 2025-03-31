'use client';

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { SubscriptionButton } from "./SubscriptionButton";

interface PricingCardProps {
  popular?: boolean;
  name: string;
  price: string;
  interval: string;
  description: string;
  features: string[];
  planId: string;
}

export function PricingCard({ popular, name, price, interval, description, features, planId }: PricingCardProps) {
  return (
    <Card className={`w-[380px] ${popular ? 'border-primary' : ''}`}>
      <div className="p-6">
        {popular && (
          <Badge variant="secondary" className="mb-2">
            Más Popular
          </Badge>
        )}
        <h3 className="text-2xl font-bold">{name}</h3>
        <div className="mt-4 flex items-baseline text-gray-900 dark:text-gray-50">
          <span className="text-5xl font-extrabold tracking-tight">${price}</span>
          <span className="ml-1 text-xl font-semibold">/{interval}</span>
        </div>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
        <ul className="mt-6 space-y-4">
          {features.map((feature, index) => (
            <li key={index} className="flex space-x-3">
              <Check className="h-5 w-5 flex-shrink-0 text-green-500" aria-hidden="true" />
              <span className="text-sm text-gray-500 dark:text-gray-400">{feature}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <SubscriptionButton planId={planId} amount={price} />
        </div>
      </div>
    </Card>
  );
} 