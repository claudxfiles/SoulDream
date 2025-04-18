export type PlanInterval = 'monthly' | 'yearly';

export type SubscriptionStatus = 
  | 'active'
  | 'cancelled'
  | 'expired'
  | 'pending'
  | 'suspended';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: PlanInterval;
  features: string[];
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  paypal_subscription_id: string | null;
  plan_type: string;
  plan_interval: string;
  plan_currency: string;
  plan_value: number;
  plan_features: string[];
  status: SubscriptionStatus;
  payment_method?: string;
  current_period_starts_at: string;
  current_period_ends_at: string;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
  cancel_at_period_end: boolean;
  metadata?: Record<string, any>;
}

export interface SubscriptionDetails {
  plan_value: number;
  member_since: string;
  plan_type: string;
  plan_interval: PlanInterval;
  plan_currency: string;
  plan_status: SubscriptionStatus;
  subscription_date: string;
  plan_validity_end: string;
  plan_features: string[];
} 