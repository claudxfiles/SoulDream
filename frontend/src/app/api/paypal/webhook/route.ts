import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { paypalClient } from '@/lib/paypal-client';

export async function POST(request: Request) {
  try {
    const webhookData = await request.json();
    const eventType = webhookData.event_type;

    // Verify webhook signature
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) {
      throw new Error('PayPal webhook ID not configured');
    }

    const isValid = await paypalClient.verifyWebhookSignature(
      webhookData,
      request.headers
    );

    if (!isValid) {
      return new NextResponse('Invalid webhook signature', { status: 401 });
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Handle different webhook events
    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
      case 'BILLING.SUBSCRIPTION.UPDATED': {
        const subscriptionId = webhookData.resource.id;
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('id, user_id')
          .eq('paypal_subscription_id', subscriptionId)
          .single();

        if (!subscription) {
          return new NextResponse('Subscription not found', { status: 404 });
        }

        // Update subscription status
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_end: webhookData.resource.billing_info.next_billing_time,
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id);

        break;
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED': {
        const subscriptionId = webhookData.resource.id;
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('paypal_subscription_id', subscriptionId)
          .single();

        if (!subscription) {
          return new NextResponse('Subscription not found', { status: 404 });
        }

        // Update subscription status
        await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            cancel_at_period_end: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id);

        break;
      }

      case 'PAYMENT.SALE.COMPLETED': {
        const subscriptionId = webhookData.resource.billing_agreement_id;
        if (!subscriptionId) {
          return new NextResponse('No subscription ID found', { status: 400 });
        }

        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('id, user_id, subscription_plan_id')
          .eq('paypal_subscription_id', subscriptionId)
          .single();

        if (!subscription) {
          return new NextResponse('Subscription not found', { status: 404 });
        }

        // Record the payment
        await supabase.from('payments').insert({
          user_id: subscription.user_id,
          subscription_plan_id: subscription.subscription_plan_id,
          paypal_order_id: webhookData.resource.id,
          amount: webhookData.resource.amount.total,
          currency: webhookData.resource.amount.currency,
          status: 'completed'
        });

        break;
      }

      case 'PAYMENT.SALE.DENIED':
      case 'PAYMENT.SALE.REFUNDED': {
        const subscriptionId = webhookData.resource.billing_agreement_id;
        if (!subscriptionId) {
          return new NextResponse('No subscription ID found', { status: 400 });
        }

        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('id, user_id, subscription_plan_id')
          .eq('paypal_subscription_id', subscriptionId)
          .single();

        if (!subscription) {
          return new NextResponse('Subscription not found', { status: 404 });
        }

        // Record the failed/refunded payment
        await supabase.from('payments').insert({
          user_id: subscription.user_id,
          subscription_plan_id: subscription.subscription_plan_id,
          paypal_order_id: webhookData.resource.id,
          amount: webhookData.resource.amount.total,
          currency: webhookData.resource.amount.currency,
          status: eventType === 'PAYMENT.SALE.DENIED' ? 'failed' : 'refunded'
        });

        // If payment was denied, update subscription status
        if (eventType === 'PAYMENT.SALE.DENIED') {
          await supabase
            .from('subscriptions')
            .update({
              status: 'payment_failed',
              updated_at: new Date().toISOString()
            })
            .eq('id', subscription.id);
        }

        break;
      }

      default:
        // Ignore other webhook events
        break;
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 