import { createClientComponent } from '@/lib/supabase';
import type { Database } from '@/types/supabase';
import { createPayPalSubscription, cancelPayPalSubscription } from '@/lib/paypal';

export type SubscriptionPlan = Database['public']['Tables']['subscription_plans']['Row'];
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type PaymentHistory = Database['public']['Tables']['payment_history']['Row'];

/**
 * Servicio para gestionar suscripciones y pagos
 */
export class SubscriptionService {
  private static instance: SubscriptionService;

  private constructor() {}

  public static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  /**
   * Obtiene todos los planes de suscripción disponibles
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const supabase = createClientComponent();
    
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });
    
    if (error) {
      console.error('Error al obtener planes de suscripción:', error);
      throw new Error('No se pudieron obtener los planes de suscripción');
    }
    
    return data;
  }

  /**
   * Obtiene la suscripción actual del usuario
   */
  async getCurrentSubscription(): Promise<Subscription | null> {
    const supabase = createClientComponent();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return null;
    }
    
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .maybeSingle();
    
    if (error) {
      console.error('Error al obtener suscripción actual:', error);
      throw new Error('No se pudo obtener la información de suscripción');
    }
    
    return data;
  }

  /**
   * Inicia el proceso de suscripción con PayPal
   */
  async startSubscription(planId: string): Promise<{ subscriptionId: string; approvalUrl: string }> {
    const supabase = createClientComponent();
    
    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('Debes iniciar sesión para suscribirte');
    }
    
    // Obtener detalles del plan
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();
    
    if (planError || !plan) {
      console.error('Error al obtener detalles del plan:', planError);
      throw new Error('No se encontró el plan seleccionado');
    }
    
    // URLs de retorno
    const returnUrl = `${window.location.origin}/subscription/success`;
    const cancelUrl = `${window.location.origin}/subscription/cancel`;
    
    // Crear suscripción en PayPal
    try {
      const paypalSubscription = await createPayPalSubscription(
        planId,
        returnUrl,
        cancelUrl
      );
      
      // Registrar suscripción pendiente en la base de datos
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: session.user.id,
          plan_id: planId,
          status: 'pending',
          payment_provider: 'paypal',
          subscription_id: paypalSubscription.id
        })
        .select('*')
        .single();
      
      if (subscriptionError) {
        console.error('Error al registrar suscripción:', subscriptionError);
        throw new Error('Error al registrar la suscripción');
      }
      
      return {
        subscriptionId: paypalSubscription.id,
        approvalUrl: paypalSubscription.approvalUrl
      };
    } catch (error) {
      console.error('Error al iniciar suscripción con PayPal:', error);
      throw error;
    }
  }

  /**
   * Actualiza una suscripción después de que el usuario la aprueba
   */
  async confirmSubscription(subscriptionId: string): Promise<Subscription> {
    const supabase = createClientComponent();
    
    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('Debes iniciar sesión para confirmar tu suscripción');
    }
    
    // Actualizar estado de la suscripción
    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(now.getMonth() + 1);
    
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: nextMonth.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('subscription_id', subscriptionId)
      .eq('user_id', session.user.id)
      .select('*')
      .single();
    
    if (error) {
      console.error('Error al confirmar suscripción:', error);
      throw new Error('No se pudo confirmar la suscripción');
    }
    
    // Actualizar el nivel de suscripción en el perfil del usuario
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('name')
      .eq('id', data.plan_id)
      .single();
    
    if (plan) {
      await supabase
        .from('profiles')
        .update({
          subscription_tier: plan.name.toLowerCase()
        })
        .eq('id', session.user.id);
    }
    
    return data;
  }

  /**
   * Cancela una suscripción activa
   */
  async cancelSubscription(): Promise<boolean> {
    const supabase = createClientComponent();
    
    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('Debes iniciar sesión para cancelar tu suscripción');
    }
    
    // Obtener suscripción actual
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .single();
    
    if (subscriptionError || !subscription) {
      console.error('Error al obtener suscripción para cancelar:', subscriptionError);
      throw new Error('No se encontró una suscripción activa');
    }
    
    // Cancelar en PayPal
    if (subscription.subscription_id) {
      try {
        await cancelPayPalSubscription(subscription.subscription_id);
      } catch (error) {
        console.error('Error al cancelar suscripción en PayPal:', error);
        throw new Error('No se pudo cancelar la suscripción en PayPal');
      }
    }
    
    // Actualizar en la base de datos
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancel_at_period_end: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id);
    
    if (updateError) {
      console.error('Error al actualizar estado de suscripción:', updateError);
      throw new Error('Error al actualizar el estado de la suscripción');
    }
    
    // Actualizar el perfil a free
    await supabase
      .from('profiles')
      .update({
        subscription_tier: 'free'
      })
      .eq('id', session.user.id);
    
    return true;
  }

  /**
   * Obtiene el historial de pagos del usuario
   */
  async getPaymentHistory(): Promise<PaymentHistory[]> {
    const supabase = createClientComponent();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('payment_history')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error al obtener historial de pagos:', error);
      throw new Error('No se pudo obtener el historial de pagos');
    }
    
    return data || [];
  }
}

export const subscriptionService = SubscriptionService.getInstance(); 