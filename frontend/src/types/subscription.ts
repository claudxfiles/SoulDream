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
  plan_id: string;
  status: SubscriptionStatus;
  paypal_subscription_id?: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  plan: SubscriptionPlan;
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