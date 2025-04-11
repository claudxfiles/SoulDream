import { SubscriptionPlan, Subscription, SubscriptionDetails } from '@/types/subscription';

// Función para asegurar uso de HTTPS en producción
const ensureHttps = (url: string): string => {
  if (process.env.NODE_ENV === 'production' && url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  return url;
};

// Obtener la URL base con HTTPS garantizado
const BACKEND_URL = ensureHttps(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001');

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const response = await fetch(`${BACKEND_URL}/api/v1/subscriptions/plans`);
  if (!response.ok) {
    throw new Error('Error al obtener los planes de suscripción');
  }
  return response.json();
}

export async function getCurrentSubscription(): Promise<SubscriptionDetails> {
  const response = await fetch(`${BACKEND_URL}/api/v1/subscriptions/current`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('No se encontró una suscripción activa');
    }
    throw new Error('Error al obtener la suscripción actual');
  }
  return response.json();
}

export async function createSubscription(planId: string): Promise<Subscription> {
  const response = await fetch(`${BACKEND_URL}/api/v1/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ plan_id: planId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al crear la suscripción');
  }

  return response.json();
}

export async function cancelSubscription(
  subscriptionId: string,
  reason?: string,
  cancelAtPeriodEnd: boolean = true
): Promise<Subscription> {
  const response = await fetch(
    `${BACKEND_URL}/api/v1/subscriptions/${subscriptionId}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cancellation_reason: reason,
        cancel_at_period_end: cancelAtPeriodEnd,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al cancelar la suscripción');
  }

  return response.json();
} 