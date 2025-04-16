import { NextRequest, NextResponse } from 'next/server';
import { PayPalService } from '@/services/payment/paypal';
import { createClient } from '@supabase/supabase-js';

export class SubscriptionController {
  private paypalService: PayPalService;
  private supabase: ReturnType<typeof createClient>;

  constructor(paypalService: PayPalService, supabase: ReturnType<typeof createClient>) {
    this.paypalService = paypalService;
    this.supabase = supabase;
  }

  async createSubscription(req: NextRequest): Promise<NextResponse> {
    console.log('Received subscription creation request');
    
    try {
      const body = await req.json();
      console.log('Request body:', body);
      
      const { userId, planId } = body;
      
      if (!userId || !planId) {
        console.log('Missing required fields:', { userId, planId });
        return NextResponse.json(
          { error: 'userId and planId are required' },
          { status: 400 }
        );
      }
      
      console.log('Creating subscription for user:', userId, 'with plan:', planId);
      const subscription = await this.paypalService.createSubscription(userId, planId);
      console.log('Subscription created:', subscription);
      
      return NextResponse.json(subscription);
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  }

  async cancelSubscription(req: NextRequest): Promise<NextResponse> {
    console.log('Received subscription cancellation request');
    
    try {
      const body = await req.json();
      console.log('Request body:', body);
      
      const { userId, subscriptionId, reason } = body;
      
      if (!userId || !subscriptionId) {
        console.log('Missing required fields:', { userId, subscriptionId });
        return NextResponse.json(
          { error: 'userId and subscriptionId are required' },
          { status: 400 }
        );
      }

      // 1. Verify subscription belongs to user
      const { data: subscription, error: subscriptionError } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('paypal_subscription_id', subscriptionId)
        .single();

      if (subscriptionError || !subscription) {
        console.error('Subscription not found:', subscriptionError);
        return NextResponse.json(
          { error: 'Subscription not found' },
          { status: 404 }
        );
      }

      // 2. Cancel subscription in PayPal
      console.log('Cancelling subscription in PayPal:', subscriptionId);
      await this.paypalService.cancelSubscription(subscriptionId, reason);

      // 3. Update subscription status in database
      const { error: updateError } = await this.supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancel_at_period_end: true,
          cancellation_reason: reason || 'Cancelled by user'
        })
        .eq('id', subscription.id);

      if (updateError) {
        console.error('Error updating subscription:', updateError);
        return NextResponse.json(
          { error: 'Failed to update subscription status' },
          { status: 500 }
        );
      }

      // 4. Log subscription event
      const { error: eventError } = await this.supabase
        .from('subscription_events')
        .insert({
          subscription_id: subscription.id,
          event_type: 'subscription_cancelled',
          metadata: {
            cancelled_at: new Date().toISOString(),
            reason: reason || 'Cancelled by user',
            paypal_subscription_id: subscriptionId
          }
        });

      if (eventError) {
        console.error('Error logging subscription event:', eventError);
      }

      // 5. Update user's subscription tier
      const { error: profileError } = await this.supabase
        .from('profiles')
        .update({
          subscription_tier: 'free'
        })
        .eq('id', userId);

      if (profileError) {
        console.error('Error updating user profile:', profileError);
      }

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  }

  async handleWebhook(req: NextRequest): Promise<NextResponse> {
    console.log('Received PayPal webhook');
    
    try {
      const body = await req.json();
      console.log('Webhook payload:', body);
      
      // Get PayPal webhook headers
      const headers = {
        'paypal-auth-algo': req.headers.get('paypal-auth-algo'),
        'paypal-cert-url': req.headers.get('paypal-cert-url'),
        'paypal-transmission-id': req.headers.get('paypal-transmission-id'),
        'paypal-transmission-sig': req.headers.get('paypal-transmission-sig'),
        'paypal-transmission-time': req.headers.get('paypal-transmission-time'),
      };
      
      console.log('Webhook headers:', headers);
      
      // Verify webhook signature
      console.log('Verifying webhook signature...');
      const isValid = await this.paypalService.verifyWebhookSignature(headers, body);
      
      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
      
      console.log('Webhook signature verified');
      
      // Process webhook event
      const eventType = body.event_type;
      console.log('Processing webhook event:', eventType);
      
      switch (eventType) {
        case 'BILLING.SUBSCRIPTION.ACTIVATED':
          console.log('Subscription activated:', body.resource);
          // Handle subscription activation
          break;
          
        case 'PAYMENT.SALE.COMPLETED':
          console.log('Payment completed:', body.resource);
          // Handle payment completion
          break;
          
        // Add more event types as needed
        
        default:
          console.log('Unhandled event type:', eventType);
      }
      
      return NextResponse.json({ received: true });
    } catch (error: any) {
      console.error('Error processing webhook:', error);
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  }
}

export const subscriptionController = new SubscriptionController(); 