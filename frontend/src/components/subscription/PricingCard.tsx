'use client';

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
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
    <Card className={`w-[380px] overflow-hidden ${popular ? 'border-primary shadow-xl shadow-primary/10' : ''} relative`}>
      {popular && (
        <div className="absolute top-0 right-0">
          <div className="bg-primary text-primary-foreground text-xs font-medium px-8 py-1 rotate-45 translate-y-4 translate-x-6">
            Popular
          </div>
        </div>
      )}
      
      <div className="p-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-2xl font-bold text-primary">{name}</h3>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {description}
        </p>

        <div className="flex items-baseline mb-8">
          <span className="text-5xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
            ${price}
          </span>
          <span className="ml-2 text-lg text-gray-500 dark:text-gray-400">
            /{interval}
          </span>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
          </div>
        </div>

        <ul className="mt-8 space-y-4">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="h-3 w-3 text-primary" aria-hidden="true" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <SubscriptionButton planId={planId} amount={price} />
        </div>
      </div>
    </Card>
  );
} 