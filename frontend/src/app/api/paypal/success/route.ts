import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { paypalClient } from '@/lib/paypal-client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscription_id');
    const token = searchParams.get('token');

    if (!subscriptionId || !token) {
      return new NextResponse('Missing required parameters', { status: 400 });
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get the subscription plan details from PayPal
    const accessToken = await paypalClient.getAccessToken();
    const response = await fetch(`${paypalClient.apiUrl}/v1/billing/subscriptions/${subscriptionId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get subscription details from PayPal');
    }

    const subscriptionDetails = await response.json();

    // Get the plan ID from the subscription details
    const planId = subscriptionDetails.plan_id;

    // Get the subscription plan from our database
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('paypal_plan_id', planId)
      .single();

    if (planError || !plan) {
      throw new Error('Subscription plan not found');
    }

    // Create or update the subscription record
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (existingSubscription) {
      // Update existing subscription
      await supabase
        .from('subscriptions')
        .update({
          subscription_plan_id: plan.id,
          paypal_subscription_id: subscriptionId,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: subscriptionDetails.billing_info.next_billing_time,
          cancel_at_period_end: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSubscription.id);
    } else {
      // Create new subscription
      await supabase
        .from('subscriptions')
        .insert({
          user_id: session.user.id,
          subscription_plan_id: plan.id,
          paypal_subscription_id: subscriptionId,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: subscriptionDetails.billing_info.next_billing_time,
          cancel_at_period_end: false
        });
    }

    // Record the initial payment
    await supabase
      .from('payments')
      .insert({
        user_id: session.user.id,
        subscription_plan_id: plan.id,
        paypal_order_id: token,
        amount: subscriptionDetails.billing_info.last_payment.amount.value,
        currency: subscriptionDetails.billing_info.last_payment.amount.currency_code,
        status: 'completed'
      });

    // Redirect to the subscription management page
    return new NextResponse(null, {
      status: 302,
      headers: {
        Location: '/subscription/manage?success=true'
      }
    });
  } catch (error) {
    console.error('Error processing subscription success:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 