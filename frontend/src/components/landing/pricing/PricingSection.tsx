"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { PayPalButtons } from '@paypal/react-paypal-js';

const features = [
  'Gestión de tareas, metas y hábitos',
  'Asistente IA personalizado 24/7',
  'Gestión financiera completa',
  'Integración con Google Calendar',
  'Analítica avanzada y reportes',
  'Plan de activos financieros',
  'Workout personalizado con IA',
  'Soporte prioritario'
];

export function PricingSection() {
  const [mounted, setMounted] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const [showPayPal, setShowPayPal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handlePayment = () => {
    setShowPayPal(true);
  };

  const price = isAnnual ? '120.00' : '14.99';

  return (
    <section id="pricing" className="min-h-screen bg-[#0f172a] text-white py-12">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-indigo-500/20 text-indigo-400">
            Precios
          </span>
          <h1 className="mt-4 text-3xl font-bold">
            Plan simple, todo incluido
          </h1>

          {/* Toggle anual/mensual */}
          <div className="mt-6 flex items-center justify-center space-x-4">
            <span className={`text-sm ${isAnnual ? 'text-white font-medium' : 'text-gray-400'}`}>
              Anual
            </span>
            <button 
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isAnnual ? 'bg-indigo-600' : 'bg-gray-600'}`}
              onClick={() => setIsAnnual(!isAnnual)}
            >
              <span className="sr-only">Cambiar plan</span>
              <span 
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isAnnual ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
            <span className={`text-sm flex items-center gap-2 ${!isAnnual ? 'text-white font-medium' : 'text-gray-400'}`}>
              Mensual
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
                Ahorra 33.3%
              </span>
            </span>
          </div>
        </div>

        {/* Plan Card */}
        <div className="max-w-md mx-auto">
          <div className="relative rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm p-6">
            <div className="absolute -top-3 right-4">
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-indigo-500/20 text-indigo-400">
                Popular
              </span>
            </div>

            <h3 className="text-lg font-semibold mb-4">Pro</h3>
            <div className="flex items-baseline mb-4">
              <span className="text-4xl font-bold">{isAnnual ? '120' : '14.99'}</span>
              <span className="ml-1 text-gray-400">USD/{isAnnual ? 'year' : 'month'}</span>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              Accede a todas las funcionalidades premium de SoulDream
            </p>

            <ul className="space-y-3 mb-6">
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-start">
                  <CheckCircle className="mr-2 h-5 w-5 flex-shrink-0 text-indigo-500" />
                  <span className="text-sm text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            {!showPayPal ? (
              <button 
                onClick={handlePayment}
                className="w-full py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
              >
                Comenzar ahora
              </button>
            ) : (
              <div className="mt-4">
                <PayPalButtons
                  createOrder={(data, actions) => {
                    if (!actions.order) return Promise.reject('PayPal actions not available');
                    return actions.order.create({
                      intent: "CAPTURE",
                      purchase_units: [
                        {
                          amount: {
                            value: price,
                            currency_code: "USD"
                          },
                          description: `SoulDream Pro ${isAnnual ? 'Anual' : 'Mensual'}`
                        }
                      ]
                    });
                  }}
                  onApprove={(data, actions) => {
                    if (!actions.order) return Promise.reject('PayPal actions not available');
                    return actions.order.capture().then((details) => {
                      // Aquí puedes implementar la lógica post-pago
                      console.log('Pago completado:', details);
                      // Redirigir al dashboard o mostrar mensaje de éxito
                    });
                  }}
                  style={{ layout: "vertical" }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
} 