import { createClient } from '@supabase/supabase-js';

interface PayPalTokenResponse {
  access_token: string;
  expires_in: number;
}

interface PayPalErrorResponse {
  error: string;
  error_description: string;
}

export class PayPalService {
  private clientId: string;
  private clientSecret: string;
  private apiUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;
  private supabase;

  constructor() {
    this.clientId = process.env.PAYPAL_CLIENT_ID!;
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
    this.apiUrl = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
    
    console.log('PayPal service initialized with API URL:', this.apiUrl);
  }

  private async getAccessToken(): Promise<string> {
    console.log('Getting PayPal access token...');
    
    // Check if we have a valid cached token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      console.log('Using cached access token');
      return this.accessToken;
    }
    
    console.log('Requesting new access token from PayPal...');
    
    try {
      const response = await fetch(`${this.apiUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'en_US',
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        },
        body: 'grant_type=client_credentials',
      });
      
      console.log('Token request status:', response.status);
      
      if (!response.ok) {
        const errorData: PayPalErrorResponse = await response.json();
        console.error('Failed to get access token:', errorData);
        throw new Error(`PayPal authentication failed: ${errorData.error_description}`);
      }
      
      const data: PayPalTokenResponse = await response.json();
      console.log('Received new access token with expiry:', data.expires_in);
      
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);
      
      return this.accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  async createSubscription(userId: string, planId: string) {
    console.log('Creating subscription for user:', userId, 'with plan:', planId);
    
    try {
      // Get plan details from Supabase
      console.log('Fetching plan details from Supabase...');
      const { data: plan, error: planError } = await this.supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();
      
      if (planError || !plan) {
        console.error('Error fetching plan:', planError);
        throw new Error('Plan not found');
      }
      
      console.log('Plan details:', plan);
      
      // Get access token
      const token = await this.getAccessToken();
      
      // Create subscription in PayPal
      console.log('Creating subscription in PayPal...');
      const response = await fetch(`${this.apiUrl}/v1/billing/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan_id: plan.paypal_plan_id,
          subscriber: {
            name: {
              given_name: userId,
            },
            email_address: userId, // We'll update this with actual email
          },
          application_context: {
            brand_name: process.env.NEXT_PUBLIC_APP_NAME || 'Your App',
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/cancel`,
          },
        }),
      });
      
      console.log('PayPal subscription creation status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to create subscription:', errorData);
        throw new Error('Failed to create subscription');
      }
      
      const subscriptionData = await response.json();
      console.log('Subscription created:', subscriptionData);
      
      // Store subscription in Supabase
      console.log('Storing subscription in Supabase...');
      const { error: insertError } = await this.supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_id: planId,
          paypal_subscription_id: subscriptionData.id,
          status: subscriptionData.status,
          start_time: subscriptionData.start_time,
          next_billing_time: subscriptionData.billing_info.next_billing_time,
        });
      
      if (insertError) {
        console.error('Error storing subscription:', insertError);
        throw new Error('Failed to store subscription');
      }
      
      return {
        subscriptionId: subscriptionData.id,
        approvalUrl: subscriptionData.links.find((link: any) => link.rel === 'approve').href,
      };
    } catch (error) {
      console.error('Error in createSubscription:', error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string, reason?: string) {
    console.log('Cancelling subscription:', subscriptionId);
    
    try {
      const token = await this.getAccessToken();
      
      console.log('Sending cancellation request to PayPal...');
      const response = await fetch(`${this.apiUrl}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: reason || 'Cancelled by user',
        }),
      });
      
      console.log('PayPal cancellation status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to cancel subscription:', errorData);
        throw new Error('Failed to cancel subscription');
      }
      
      // Update subscription status in Supabase
      console.log('Updating subscription status in Supabase...');
      const { error: updateError } = await this.supabase
        .from('subscriptions')
        .update({ status: 'CANCELLED', cancelled_at: new Date().toISOString() })
        .eq('paypal_subscription_id', subscriptionId);
      
      if (updateError) {
        console.error('Error updating subscription status:', updateError);
        throw new Error('Failed to update subscription status');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error in cancelSubscription:', error);
      throw error;
    }
  }

  async verifyWebhookSignature(headers: any, body: any): Promise<boolean> {
    console.log('Verifying webhook signature...');
    
    try {
      const token = await this.getAccessToken();
      
      console.log('Sending verification request to PayPal...');
      const response = await fetch(`${this.apiUrl}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          auth_algo: headers['paypal-auth-algo'],
          cert_url: headers['paypal-cert-url'],
          transmission_id: headers['paypal-transmission-id'],
          transmission_sig: headers['paypal-transmission-sig'],
          transmission_time: headers['paypal-transmission-time'],
          webhook_id: process.env.PAYPAL_WEBHOOK_ID,
          webhook_event: body,
        }),
      });
      
      console.log('Verification response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Webhook verification failed:', errorData);
        return false;
      }
      
      const verificationData = await response.json();
      console.log('Verification result:', verificationData.verification_status);
      
      return verificationData.verification_status === 'SUCCESS';
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }
} 