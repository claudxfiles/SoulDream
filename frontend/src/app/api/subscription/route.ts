import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function POST(req: Request) {
  console.log('Recibida solicitud POST en /api/subscription');
  
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar autenticación
    console.log('Verificando sesión de usuario...');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('Usuario no autenticado');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    console.log('Usuario autenticado:', session.user.id);
    
    // Obtener planId del cuerpo de la solicitud
    const { planId } = await req.json();
    console.log('Plan ID recibido:', planId);
    
    if (!planId) {
      console.log('planId no proporcionado');
      return NextResponse.json(
        { error: 'planId es requerido' },
        { status: 400 }
      );
    }
    
    // Obtener detalles del plan
    console.log('Consultando detalles del plan en Supabase...');
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();
    
    if (planError || !plan) {
      console.error('Error al obtener el plan:', planError);
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      );
    }
    
    console.log('Plan encontrado:', plan);
    
    // Crear suscripción en el backend
    console.log('Enviando solicitud al backend...');
    const response = await fetch(`${BACKEND_URL}/api/v1/payments/subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: session.user.id,
        planId: plan.id,
      }),
    });
    
    console.log('Respuesta del backend recibida:', response.status);
    const data = await response.json();
    console.log('Datos de respuesta del backend:', data);
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al crear la suscripción');
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error en la ruta API de suscripción:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  console.log('Recibida solicitud DELETE en /api/subscription');
  
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar autenticación
    console.log('Verificando sesión de usuario...');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('Usuario no autenticado');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    console.log('Usuario autenticado:', session.user.id);
    
    // Obtener datos de la solicitud
    const { subscriptionId, reason } = await req.json();
    console.log('Datos recibidos:', { subscriptionId, reason });
    
    if (!subscriptionId) {
      console.log('subscriptionId no proporcionado');
      return NextResponse.json(
        { error: 'subscriptionId es requerido' },
        { status: 400 }
      );
    }
    
    // Enviar solicitud de cancelación al backend
    console.log('Enviando solicitud de cancelación al backend...');
    const response = await fetch(`${BACKEND_URL}/api/v1/payments/subscription`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: session.user.id,
        subscriptionId,
        reason,
      }),
    });
    
    console.log('Respuesta del backend recibida:', response.status);
    const data = await response.json();
    console.log('Datos de respuesta del backend:', data);
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al cancelar la suscripción');
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error en la ruta API de cancelación:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 