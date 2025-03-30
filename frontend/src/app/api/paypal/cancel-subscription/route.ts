import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { paypalClient } from '@/lib/paypal-client';

export async function POST(request: Request) {
  try {
    const { subscriptionId, reason } = await request.json();

    if (!subscriptionId) {
      return new NextResponse('Missing subscription ID', { status: 400 });
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get the subscription from our database
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('id, paypal_subscription_id')
      .eq('user_id', session.user.id)
      .eq('paypal_subscription_id', subscriptionId)
      .single();

    if (subscriptionError || !subscription) {
      return new NextResponse('Subscription not found', { status: 404 });
    }

    // Cancel the subscription in PayPal
    await paypalClient.cancelSubscription(
      subscriptionId,
      reason || 'Cancelled by user'
    );

    // Update the subscription status in our database
    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancel_at_period_end: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    return new NextResponse(JSON.stringify({ status: 'success' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 