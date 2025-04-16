const PAYPAL_API = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

interface PayPalTokenResponse {
  access_token: string;
  expires_in: number;
}

class PayPalClient {
  private static instance: PayPalClient;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private apiUrl: string;

  private constructor() {
    this.apiUrl = PAYPAL_API;
  }

  public static getInstance(): PayPalClient {
    if (!PayPalClient.instance) {
      PayPalClient.instance = new PayPalClient();
    }
    return PayPalClient.instance;
  }

  private async refreshAccessToken(): Promise<string> {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('PayPal credentials not configured');
    }

    try {
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
        const error = await response.json();
        throw new Error(`PayPal API error: ${error.error_description || response.statusText}`);
      }

      const data: PayPalTokenResponse = await response.json();
      
      this.accessToken = data.access_token;
      // Set expiry 5 minutes before actual expiry to ensure token validity
      this.tokenExpiry = Date.now() + ((data.expires_in - 300) * 1000);
      
      return this.accessToken;
    } catch (error) {
      console.error('Error refreshing PayPal access token:', error);
      throw new Error('Failed to refresh PayPal access token');
    }
  }

  public async getAccessToken(): Promise<string> {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      return this.refreshAccessToken();
    }
    return this.accessToken;
  }

  public async createOrder(planId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      const response = await fetch(`${this.apiUrl}/v1/billing/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          plan_id: planId,
          application_context: {
            return_url: `${window.location.origin}/subscription/success`,
            cancel_url: `${window.location.origin}/subscription/cancel`,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`PayPal order creation failed: ${error.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      throw error;
    }
  }

  public async cancelSubscription(subscriptionId: string, reason: string): Promise<void> {
    try {
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
        const error = await response.json();
        throw new Error(`PayPal subscription cancellation failed: ${error.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Error cancelling PayPal subscription:', error);
      throw error;
    }
  }

  public async verifyWebhookSignature(webhookData: any, headers: Headers): Promise<boolean> {
    try {
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
        const error = await response.json();
        throw new Error(`PayPal webhook verification failed: ${error.message || response.statusText}`);
      }

      const data = await response.json();
      return data.verification_status === 'SUCCESS';
    } catch (error) {
      console.error('Error verifying PayPal webhook signature:', error);
      throw error;
    }
  }
}

export const paypalClient = PayPalClient.getInstance(); 