/**
 * Servicio para la integración con PayPal
 */

import { createClientComponent } from './supabase';
import { supabase } from './supabase';

interface CreateSubscriptionResponse {
  subscriptionId: string;
  status: string;
  error?: string;
}

// Creamos una orden de PayPal para iniciar el proceso de pago
export async function createPayPalOrder(
  amount: string,
  currency: string = 'USD',
  description: string = 'Compra en SoulDream'
): Promise<{ id: string }> {
  try {
    const response = await fetch('/api/paypal/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        description,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al crear la orden de PayPal');
    }

    return await response.json();
  } catch (error) {
    console.error('Error al crear orden de PayPal:', error);
    throw error;
  }
}

// Capturamos el pago después de que el usuario lo haya aprobado
export async function capturePayPalPayment(orderId: string): Promise<any> {
  try {
    const response = await fetch(`/api/paypal/capture-payment?orderId=${orderId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al capturar el pago de PayPal');
    }

    return await response.json();
  } catch (error) {
    console.error('Error al capturar pago de PayPal:', error);
    throw error;
  }
}

// Creamos una suscripción de PayPal
export const paypalService = {
  async createSubscription(planId: string): Promise<CreateSubscriptionResponse> {
    try {
      const response = await fetch('/api/paypal/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al crear la suscripción');
      }

      return data;
    } catch (error) {
      console.error('Error en createSubscription:', error);
      return {
        subscriptionId: '',
        status: 'error',
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  },

  async cancelSubscription(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/paypal/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al cancelar la suscripción');
      }

      return { success: true };
    } catch (error) {
      console.error('Error en cancelSubscription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  },

  async updateUserSubscriptionTier(tier: 'free' | 'pro' | 'premium'): Promise<boolean> {
    try {
      const supabase = createClientComponent();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No hay sesión activa');
      }

      const { error } = await supabase
        .from('profiles')
        .update({ subscription_tier: tier })
        .eq('id', session.user.id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error actualizando el tier de suscripción:', error);
      return false;
    }
  },
};

// Verificar que una suscripción existe y está activa
export async function verifyPayPalSubscription(subscriptionId: string): Promise<any> {
  try {
    const response = await fetch(`/api/paypal/verify-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriptionId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al verificar la suscripción de PayPal');
    }

    return await response.json();
  } catch (error) {
    console.error('Error al verificar suscripción de PayPal:', error);
    throw error;
  }
}

// Obtenemos detalles de una suscripción
export async function getPayPalSubscriptionDetails(subscriptionId: string): Promise<any> {
  try {
    const response = await fetch(`/api/paypal/subscription-details?id=${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener detalles de la suscripción');
    }

    return await response.json();
  } catch (error) {
    console.error('Error al obtener detalles de suscripción:', error);
    throw error;
  }
}

// Actualizar una suscripción (cambiar de plan)
export async function updatePayPalSubscription(
  subscriptionId: string,
  newPlanId: string
): Promise<any> {
  try {
    const response = await fetch(`/api/paypal/update-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriptionId,
        planId: newPlanId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al actualizar la suscripción');
    }

    return await response.json();
  } catch (error) {
    console.error('Error al actualizar suscripción:', error);
    throw error;
  }
}

// Suspender una suscripción temporalmente
export async function suspendPayPalSubscription(subscriptionId: string, reason: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/paypal/suspend-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriptionId,
        reason,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al suspender la suscripción');
    }

    return (await response.json()).success;
  } catch (error) {
    console.error('Error al suspender suscripción:', error);
    throw error;
  }
}

// Reactivar una suscripción suspendida
export async function reactivatePayPalSubscription(subscriptionId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/paypal/reactivate-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriptionId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al reactivar la suscripción');
    }

    return (await response.json()).success;
  } catch (error) {
    console.error('Error al reactivar suscripción:', error);
    throw error;
  }
}

// Obtener el historial de transacciones de una suscripción
export async function getPayPalSubscriptionTransactions(
  subscriptionId: string,
  startDate?: string,
  endDate?: string
): Promise<any[]> {
  try {
    let url = `/api/paypal/subscription-transactions?id=${subscriptionId}`;
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener transacciones de la suscripción');
    }

    return await response.json();
  } catch (error) {
    console.error('Error al obtener transacciones de suscripción:', error);
    throw error;
  }
}

const PAYPAL_API_URL = process.env.NEXT_PUBLIC_PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken() {
  const { data: { access_token } } = await supabase.functions.invoke('get-paypal-token');
  return access_token;
}

export async function pauseSubscription(subscriptionId: string) {
  try {
    const accessToken = await getPayPalAccessToken();
    
    const response = await fetch(`${PAYPAL_API_URL}/v1/billing/subscriptions/${subscriptionId}/suspend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        reason: 'Customer-requested pause'
      })
    });

    if (!response.ok) {
      throw new Error('Error al pausar la suscripción');
    }

    return true;
  } catch (error) {
    console.error('Error en pauseSubscription:', error);
    throw error;
  }
}

export async function resumeSubscription(subscriptionId: string) {
  try {
    const accessToken = await getPayPalAccessToken();
    
    const response = await fetch(`${PAYPAL_API_URL}/v1/billing/subscriptions/${subscriptionId}/activate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        reason: 'Reactivating on customer request'
      })
    });

    if (!response.ok) {
      throw new Error('Error al reactivar la suscripción');
    }

    return true;
  } catch (error) {
    console.error('Error en resumeSubscription:', error);
    throw error;
  }
} 