const PAYPAL_API = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

export const paypalClient = {
  apiUrl: PAYPAL_API,

  async getAccessToken(): Promise<string> {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('PayPal credentials not configured');
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch(`${this.apiUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error('Failed to get PayPal access token');
    }

    const data = await response.json();
    return data.access_token;
  },

  async createOrder(planId: string): Promise<any> {
    const response = await fetch('/api/paypal/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId })
    });
    
    if (!response.ok) {
      throw new Error('Error al crear la orden');
    }
    
    return await response.json();
  },
  
  async capturePayment(orderId: string): Promise<any> {
    const response = await fetch('/api/paypal/capture-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    });
    
    if (!response.ok) {
      throw new Error('Error al capturar el pago');
    }
    
    return await response.json();
  },
  
  async createSubscription(planId: string) {
    const response = await fetch('/api/paypal/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId })
    });
    
    if (!response.ok) {
      throw new Error('Error al crear la suscripción');
    }
    
    return await response.json();
  },
  
  async cancelSubscription(subscriptionId: string, reason: string) {
    const accessToken = await this.getAccessToken();
    const response = await fetch(`${this.apiUrl}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      throw new Error('Failed to cancel subscription');
    }

    return response.json();
  },

  async verifyWebhookSignature(webhookData: any, headers: Headers) {
    const accessToken = await this.getAccessToken();
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;

    if (!webhookId) {
      throw new Error('PayPal webhook ID not configured');
    }

    const response = await fetch(`${this.apiUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        auth_algo: headers.get('paypal-auth-algo'),
        cert_url: headers.get('paypal-cert-url'),
        transmission_id: headers.get('paypal-transmission-id'),
        transmission_sig: headers.get('paypal-transmission-sig'),
        transmission_time: headers.get('paypal-transmission-time'),
        webhook_id: webhookId,
        webhook_event: webhookData,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to verify webhook signature');
    }

    const data = await response.json();
    return data.verification_status === 'SUCCESS';
  }
}; 