import { NextResponse } from 'next/server';

export async function GET() {
  // Datos de ejemplo para el dashboard financiero
  const financeData = {
    expenses_by_category: [
      { category: 'Vivienda', amount: 1200, percentage: 40 },
      { category: 'Servicios', amount: 300, percentage: 10 },
      { category: 'Alimentación', amount: 450, percentage: 15 },
      { category: 'Transporte', amount: 200, percentage: 7 },
      { category: 'Suscripciones', amount: 150, percentage: 5 },
      { category: 'Ocio', amount: 300, percentage: 10 },
      { category: 'Otros', amount: 400, percentage: 13 }
    ],
    expense_trend: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: Math.floor(Math.random() * 200) + 50
    })),
    subscriptions: [
      { name: 'Netflix', amount: 15.99, billing_cycle: 'Mensual' },
      { name: 'Spotify', amount: 9.99, billing_cycle: 'Mensual' },
      { name: 'Amazon Prime', amount: 12.99, billing_cycle: 'Mensual' },
      { name: 'Gym', amount: 29.99, billing_cycle: 'Mensual' }
    ]
  };

  return NextResponse.json(financeData);
} 