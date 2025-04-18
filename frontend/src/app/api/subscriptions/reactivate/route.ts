import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { subscriptionId } = await request.json();
    
    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Missing subscription ID' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Reactivate subscription in PayPal
    const paypalResponse = await fetch(`https://api-m.paypal.com/v1/billing/subscriptions/${subscriptionId}/activate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYPAL_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!paypalResponse.ok) {
      const paypalError = await paypalResponse.json();
      return NextResponse.json(
        { error: 'Failed to reactivate PayPal subscription', details: paypalError },
        { status: paypalResponse.status }
      );
    }

    // Update subscription status in database
    const { data: subscription, error: dbError } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'active',
        cancel_at_period_end: false,
        updated_at: new Date().toISOString()
      })
      .eq('paypal_subscription_id', subscriptionId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        { error: 'Database error', details: dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    console.error('[Reactivate Subscription Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 