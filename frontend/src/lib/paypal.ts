/**
 * Servicio para la integración con PayPal
 */

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
export async function createPayPalSubscription(
  planId: string,
  returnUrl: string,
  cancelUrl: string
): Promise<{ id: string; approvalUrl: string }> {
  try {
    const response = await fetch('/api/paypal/create-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId,
        returnUrl,
        cancelUrl,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al crear la suscripción de PayPal');
    }

    return await response.json();
  } catch (error) {
    console.error('Error al crear suscripción de PayPal:', error);
    throw error;
  }
}

// Cancelamos una suscripción de PayPal
export async function cancelPayPalSubscription(subscriptionId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/paypal/cancel-subscription`, {
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
      throw new Error(error.message || 'Error al cancelar la suscripción de PayPal');
    }

    return (await response.json()).success;
  } catch (error) {
    console.error('Error al cancelar suscripción de PayPal:', error);
    throw error;
  }
}

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