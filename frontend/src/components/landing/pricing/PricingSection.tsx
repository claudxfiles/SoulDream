"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, ChevronRight } from 'lucide-react';
import { LandingButton } from '@/components/landing/LandingButton';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PricingPlan {
  name: string;
  price: string;
  description: string;
  features: PlanFeature[];
  cta: string;
  popular?: boolean;
  href: string;
}

export function PricingSection() {
  const [mounted, setMounted] = useState(false);
  const [annual, setAnnual] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const plans: PricingPlan[] = [
    {
      name: 'Gratuito',
      price: annual ? 'Gratis' : 'Gratis',
      description: 'Perfecto para comenzar a organizar tu vida de manera básica.',
      features: [
        { text: 'Hasta 10 tareas', included: true },
        { text: 'Seguimiento de 3 hábitos', included: true },
        { text: 'Asistente IA básico', included: true },
        { text: 'Gestión financiera limitada', included: true },
        { text: 'Sin publicidad', included: true },
        { text: 'Calendario básico', included: true },
        { text: 'Sin analítica avanzada', included: false },
        { text: 'Sin workout personalizado', included: false },
      ],
      cta: 'Comenzar gratis',
      href: '/auth/register'
    },
    {
      name: 'Premium',
      price: annual ? '€9.99/mes' : '€14.99/mes',
      description: 'Todas las herramientas para organizar tu vida personal de manera eficiente.',
      features: [
        { text: 'Tareas ilimitadas', included: true },
        { text: 'Hábitos ilimitados', included: true },
        { text: 'Asistente IA avanzado', included: true },
        { text: 'Gestión financiera completa', included: true },
        { text: 'Sin publicidad', included: true },
        { text: 'Integración con Google Calendar', included: true },
        { text: 'Analítica personalizada', included: true },
        { text: 'Planes de workout personalizados', included: true },
      ],
      cta: 'Comenzar Premium',
      popular: true,
      href: '/auth/register?plan=premium'
    },
    {
      name: 'Negocios',
      price: annual ? '€24.99/mes' : '€34.99/mes',
      description: 'Ideal para empresarios y profesionales que necesitan gestionar todo su ecosistema.',
      features: [
        { text: 'Todo lo de Premium', included: true },
        { text: 'Hasta 5 usuarios', included: true },
        { text: 'Dashboard compartido', included: true },
        { text: 'Metas de equipo', included: true },
        { text: 'Reportes avanzados', included: true },
        { text: 'API para integraciones', included: true },
        { text: 'Asistente IA personalizado', included: true },
        { text: 'Soporte prioritario', included: true },
      ],
      cta: 'Contactar ventas',
      href: '/contact-sales'
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block px-3 py-1 text-sm font-medium rounded-full text-indigo-600 bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-300">
            Precios
          </span>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Planes para cada necesidad
          </h2>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
            Comienza gratis y actualiza a medida que creces. Cancela en cualquier momento.
          </p>
          
          {/* Toggle anual/mensual */}
          <div className="mt-6 flex items-center justify-center space-x-4">
            <span className={`text-sm ${annual ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
              Anual <span className="text-emerald-500 text-xs font-bold">(Ahorra 33%)</span>
            </span>
            <button 
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${annual ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'}`}
              onClick={() => setAnnual(!annual)}
            >
              <span className="sr-only">Cambiar plan</span>
              <span 
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${annual ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
            <span className={`text-sm ${!annual ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
              Mensual
            </span>
          </div>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div 
              key={index}
              className={`relative rounded-xl overflow-hidden ${plan.popular ? 'border-2 border-indigo-600 dark:border-indigo-500 shadow-xl' : 'border border-gray-200 dark:border-gray-700 shadow-lg'}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                  Más popular
                </div>
              )}
              
              <div className="p-6 bg-white dark:bg-gray-800 h-full flex flex-col">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">{plan.price}</span>
                  {plan.name !== 'Gratuito' && (
                    <span className="ml-1 text-base text-gray-500 dark:text-gray-400">
                      {annual ? '/año' : '/mes'}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>
                
                <ul className="mt-6 space-y-3 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle 
                        className={`mr-2 h-5 w-5 flex-shrink-0 ${feature.included ? 'text-indigo-500' : 'text-gray-300 dark:text-gray-600'}`} 
                      />
                      <span className={`text-sm ${feature.included ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500 line-through'}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-8">
                  <LandingButton 
                    href={plan.href}
                    variant={plan.popular ? 'primary' : 'outline'}
                    className={`w-full ${plan.popular 
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white' 
                      : ''}`}
                    size="lg"
                  >
                    {plan.cta} <ChevronRight className="ml-1 h-4 w-4" />
                  </LandingButton>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Garantía */}
        <motion.div 
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <p className="text-gray-600 dark:text-gray-400">
            Garantía de devolución de dinero por 14 días. Sin preguntas.
          </p>
        </motion.div>
      </div>
    </section>
  );
} 