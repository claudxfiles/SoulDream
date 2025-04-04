import { supabase } from '@/lib/supabase';

export interface Subscription {
  id?: string;
  name: string;
  amount: number;
  currency: string;
  billing_cycle: 'monthly' | 'quarterly' | 'yearly' | 'annual';
  category: string;
  description?: string;
  auto_renewal: boolean;
  payment_method?: string;
  status: 'active' | 'cancelled' | 'pending';
  next_billing_date: Date | string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Obtiene todas las suscripciones financieras del usuario
 */
export const getSubscriptions = async (): Promise<Subscription[]> => {
  try {
    const { data, error } = await supabase
      .from('subscriptions_tracker')
      .select('*')
      .order('next_billing_date', { ascending: true });
    
    if (error) {
      console.error('Error al obtener suscripciones:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Convertir las fechas de string a Date y mapear notes a description si existe
    return data.map(subscription => ({
      ...subscription,
      next_billing_date: new Date(subscription.next_billing_date),
      // Si existe notes en la respuesta, usarlo como description
      description: subscription.notes
    }));
  } catch (error) {
    console.error('Error en getSubscriptions:', error);
    return [];
  }
};

/**
 * Crea una nueva suscripción financiera
 */
export const createSubscription = async (subscription: Omit<Subscription, 'id'>): Promise<Subscription | null> => {
  try {
    // Crear objeto con campos mapeados para inserción
    // Asegurar que usamos los nombres de columnas correctos
    const subscriptionToInsert: any = {
      name: subscription.name,
      amount: subscription.amount,
      currency: subscription.currency || 'USD',
      billing_cycle: subscription.billing_cycle,
      category: subscription.category,
      notes: subscription.description, // Mapear description a notes
      auto_renewal: subscription.auto_renewal,
      payment_method: subscription.payment_method,
      status: subscription.status || 'active',
      next_billing_date: typeof subscription.next_billing_date === 'object' 
        ? subscription.next_billing_date.toISOString() 
        : subscription.next_billing_date
    };
    
    const { data, error } = await supabase
      .from('subscriptions_tracker')
      .insert(subscriptionToInsert)
      .select()
      .single();
    
    if (error) {
      console.error('Error al crear suscripción:', error);
      return null;
    }
    
    // Convertir fecha y mapear para mantener consistencia en frontend
    return {
      ...data,
      next_billing_date: new Date(data.next_billing_date),
      description: data.notes
    };
  } catch (error) {
    console.error('Error en createSubscription:', error);
    return null;
  }
};

/**
 * Actualiza una suscripción financiera existente
 */
export const updateSubscription = async (id: string, subscription: Partial<Subscription>): Promise<boolean> => {
  try {
    // Preparar datos para actualización
    const subscriptionToUpdate: any = {};
    
    // Solo incluir campos a actualizar, con mapeo correcto
    if (subscription.name !== undefined) subscriptionToUpdate.name = subscription.name;
    if (subscription.amount !== undefined) subscriptionToUpdate.amount = subscription.amount;
    if (subscription.currency !== undefined) subscriptionToUpdate.currency = subscription.currency;
    if (subscription.billing_cycle !== undefined) subscriptionToUpdate.billing_cycle = subscription.billing_cycle;
    if (subscription.category !== undefined) subscriptionToUpdate.category = subscription.category;
    if (subscription.description !== undefined) subscriptionToUpdate.notes = subscription.description;
    if (subscription.auto_renewal !== undefined) subscriptionToUpdate.auto_renewal = subscription.auto_renewal;
    if (subscription.payment_method !== undefined) subscriptionToUpdate.payment_method = subscription.payment_method;
    if (subscription.status !== undefined) subscriptionToUpdate.status = subscription.status;
    
    // Formatear fecha si existe
    if (subscription.next_billing_date) {
      subscriptionToUpdate.next_billing_date = typeof subscription.next_billing_date === 'object'
        ? subscription.next_billing_date.toISOString()
        : subscription.next_billing_date;
    }
    
    const { error } = await supabase
      .from('subscriptions_tracker')
      .update(subscriptionToUpdate)
      .eq('id', id);
    
    if (error) {
      console.error('Error al actualizar suscripción:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error en updateSubscription:', error);
    return false;
  }
};

/**
 * Elimina una suscripción financiera
 */
export const deleteSubscription = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('subscriptions_tracker')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error al eliminar suscripción:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error en deleteSubscription:', error);
    return false;
  }
};

/**
 * Alterna el estado de una suscripción entre 'active' y 'cancelled'
 */
export const toggleSubscriptionStatus = async (id: string): Promise<boolean> => {
  try {
    // Primero obtenemos la suscripción para saber su estado actual
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions_tracker')
      .select('status')
      .eq('id', id)
      .single();
    
    if (fetchError || !subscription) {
      console.error('Error al obtener estado de suscripción:', fetchError);
      return false;
    }
    
    // Determinar el nuevo estado
    const newStatus = subscription.status === 'active' ? 'cancelled' : 'active';
    
    // Actualizar el estado
    const { error } = await supabase
      .from('subscriptions_tracker')
      .update({ status: newStatus })
      .eq('id', id);
    
    if (error) {
      console.error('Error al cambiar estado de suscripción:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error en toggleSubscriptionStatus:', error);
    return false;
  }
}; 