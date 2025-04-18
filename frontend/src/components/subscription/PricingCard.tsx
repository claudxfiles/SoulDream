'use client';

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, CheckCircle2 } from "lucide-react";
import { SubscriptionButton } from "./SubscriptionButton";

interface PricingCardProps {
  popular?: boolean;
  name: string;
  price: number;
  interval: string;
  description: string;
  features: string[];
  planId: string;
  trial?: boolean;
  trialDays?: number;
  priceAfterTrial?: string;
  callToAction?: string;
}

export function PricingCard({
  popular = false,
  name,
  price,
  interval,
  description,
  features,
  planId,
  trial = false,
  trialDays,
  priceAfterTrial,
  callToAction = "Suscribirse ahora"
}: PricingCardProps) {
  return (
    <Card className={`w-[420px] overflow-hidden ${popular ? 'border-primary/50 shadow-xl shadow-primary/20 bg-card/50 backdrop-blur-sm' : ''} relative`}>
      {popular && (
        <div className="absolute top-0 right-0">
          <div className="bg-primary text-primary-foreground text-sm font-medium px-10 py-1.5 rotate-45 translate-y-6 translate-x-8 shadow-sm">
            Popular
          </div>
        </div>
      )}
      
      <div className="p-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">{name}</h3>
        </div>

        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          {description}
        </p>

        <div className="flex items-baseline mb-10">
          <span className="text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            ${price.toString()}
          </span>
          <span className="ml-2 text-lg text-muted-foreground">
            /{interval}
          </span>
        </div>

        {trial && (
          <div className="bg-primary/10 text-primary rounded-lg p-3 text-sm">
            <p className="font-medium">Prueba gratuita de {trialDays} días</p>
            <p className="text-xs mt-1 text-muted-foreground">{priceAfterTrial}</p>
          </div>
        )}

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-border/50"></div>
          </div>
        </div>

        <ul className="space-y-5 mb-10">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-4 group">
              <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Check className="h-4 w-4 text-primary" aria-hidden="true" />
              </div>
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <SubscriptionButton 
            planId={planId} 
            amount={price} 
            className={`w-full ${popular ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
          >
            {callToAction}
          </SubscriptionButton>
        </div>
      </div>
    </Card>
  );
} 