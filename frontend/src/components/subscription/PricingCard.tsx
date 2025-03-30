'use client';

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { SubscriptionButton } from "./SubscriptionButton";

interface PricingCardProps {
  popular?: boolean;
  name: string;
  price: string;
  description: string;
  features: string[];
  planId: string;
}

export function PricingCard({
  popular,
  name,
  price,
  description,
  features,
  planId,
}: PricingCardProps) {
  return (
    <Card className={`w-full max-w-sm rounded-xl p-6 ${popular ? 'border-primary' : ''}`}>
      {popular && (
        <Badge className="mb-2" variant="secondary">
          Popular
        </Badge>
      )}
      <h3 className="text-2xl font-bold">{name}</h3>
      <div className="mt-4 flex items-baseline text-gray-900 dark:text-gray-100">
        <span className="text-5xl font-extrabold tracking-tight">{price}</span>
        <span className="ml-1 text-xl font-semibold">/mes</span>
      </div>
      <p className="mt-6 text-gray-500 dark:text-gray-400">{description}</p>
      
      <ul role="list" className="mt-6 space-y-4">
        {features.map((feature, index) => (
          <li key={index} className="flex">
            <Check className="h-5 w-5 flex-shrink-0 text-green-500" />
            <span className="ml-3 text-gray-500 dark:text-gray-400">{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <SubscriptionButton
          planId={planId}
          amount={price}
        />
      </div>
    </Card>
  );
} 