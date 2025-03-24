'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckSquare, 
  Calendar, 
  DollarSign, 
  Dumbbell, 
  TrendingUp, 
  Brain, 
  Clock, 
  ArrowRight,
  Target,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/hero/Hero';
import { FeatureSection } from '@/components/landing/features/FeatureSection';
import { TestimonialsSection } from '@/components/landing/testimonials/TestimonialsSection';
import { PricingSection } from '@/components/landing/pricing/PricingSection';
import { FaqSection } from '@/components/landing/faq/FaqSection';
import { Footer } from '@/components/landing/footer/Footer';
import { FadeInWhenVisible } from '@/components/shared/FadeInWhenVisible';
import { LandingButton } from '@/components/landing/LandingButton';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Navbar con implementación de componente existente */}
      <Navbar />

      {/* Hero Section con partículas */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        {/* Partículas decorativas */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-40 right-1/4 w-72 h-72 bg-emerald-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-amber-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-16">
            {/* Contenido principal */}
            <motion.div 
              className="lg:w-1/2 text-center lg:text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <motion.div 
                className="inline-flex items-center px-3 py-1.5 mb-6 text-sm font-medium rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                <span>Tu vida, simplificada con IA</span>
              </motion.div>

              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.7 }}
              >
                Tu vida organizada en
                <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-600 dark:from-indigo-400 dark:to-emerald-400"> una sola plataforma</span>
              </motion.h1>
              
              <motion.p 
                className="mt-6 text-xl text-gray-600 dark:text-gray-300 max-w-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.7 }}
              >
                Gestiona tus metas, hábitos, finanzas y fitness con ayuda de inteligencia artificial. Optimiza tu productividad y bienestar con una herramienta todo en uno.
              </motion.p>
              
              <motion.div 
                className="mt-8 flex flex-col sm:flex-row justify-center lg:justify-start gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <LandingButton 
                  href="/auth/register" 
                  className="relative group"
                  variant="primary"
                >
                  <span>Comenzar gratis</span>
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  <span className="absolute -inset-0.5 -z-10 rounded-lg bg-gradient-to-r from-indigo-500 to-emerald-500 opacity-30 blur group-hover:opacity-50 transition duration-300"></span>
                </LandingButton>
                
                <LandingButton 
                  href="#features" 
                  variant="outline"
                >
                  Ver funcionalidades
                </LandingButton>
              </motion.div>
              
              <motion.div 
                className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-3 text-sm text-gray-500 dark:text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-indigo-500 mr-2" />
                  <span>Sin tarjeta de crédito</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-indigo-500 mr-2" />
                  <span>14 días prueba completa</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-indigo-500 mr-2" />
                  <span>Cancelación fácil</span>
                </div>
              </motion.div>
            </motion.div>
            
            {/* Dashboard Preview con efecto 3D */}
            <motion.div 
              className="lg:w-1/2 w-full"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <div className="relative perspective-1000">
                <div className="rounded-xl shadow-2xl transform transition-transform duration-700 hover:rotate-y-6 hover:scale-105 relative">
                  <div className="relative z-10 bg-gray-900 rounded-xl shadow-2xl overflow-hidden border border-gray-800">
                    <div className="p-4 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
                      <span className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">SoulDream</span>
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-indigo-500/50 transition-colors duration-300">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs text-gray-400">HÁBITO DESTACADO</p>
                              <h3 className="text-md font-bold text-white mt-1">Meditación</h3>
                              <div className="flex items-center mt-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                <p className="text-xs text-gray-300">7 días consecutivos</p>
                              </div>
                            </div>
                            <div className="p-2 bg-green-900/30 rounded-lg">
                              <TrendingUp className="h-4 w-4 text-green-400" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-amber-500/50 transition-colors duration-300">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs text-gray-400">FINANZAS</p>
                              <h3 className="text-md font-bold text-white mt-1">$3,650</h3>
                              <div className="flex items-center mt-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                <p className="text-xs text-green-400">+15% este mes</p>
                              </div>
                            </div>
                            <div className="p-2 bg-amber-900/30 rounded-lg">
                              <DollarSign className="h-4 w-4 text-amber-400" />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-indigo-500/50 transition-colors duration-300 mb-4">
                        <div className="flex items-center mb-3">
                          <CheckSquare className="h-4 w-4 text-indigo-400 mr-2" />
                          <h3 className="text-sm font-semibold text-white">Tareas pendientes</h3>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center p-2 bg-gray-700/50 rounded">
                            <div className="w-2 h-2 rounded-full bg-red-500 mr-3"></div>
                            <p className="text-xs text-white">Completar informe mensual</p>
                          </div>
                          <div className="flex items-center p-2 bg-gray-700/50 rounded">
                            <div className="w-2 h-2 rounded-full bg-yellow-500 mr-3"></div>
                            <p className="text-xs text-white">Reunión con cliente</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-indigo-500/50 transition-colors duration-300">
                        <div className="flex items-center mb-3">
                          <Target className="h-4 w-4 text-indigo-400 mr-2" />
                          <h3 className="text-sm font-semibold text-white">Metas en progreso</h3>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <p className="text-xs text-white">Comprar moto</p>
                              <span className="text-xs text-gray-400">35%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-1.5">
                              <div className="bg-indigo-500 h-1.5 rounded-full animate-pulse-slow" style={{ width: '35%' }}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <p className="text-xs text-white">Aprender desarrollo web</p>
                              <span className="text-xs text-gray-400">60%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-1.5">
                              <div className="bg-emerald-500 h-1.5 rounded-full animate-pulse-slow" style={{ width: '60%' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Notificaciones flotantes */}
                  <motion.div 
                    className="absolute top-32 -right-16 max-w-[200px] z-20"
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1, duration: 0.5 }}
                  >
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center mr-2">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-800 dark:text-white">Hábito completado</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                            ¡Has mantenido tu racha por 7 días consecutivos!
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="absolute -bottom-12 left-12 max-w-[200px] z-20"
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.5 }}
                  >
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center mr-2">
                          <DollarSign className="h-3 w-3 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-800 dark:text-white">Finanzas</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                            Has ahorrado un 15% más que el mes pasado
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Efectos de luz */}
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600/30 rounded-full filter blur-3xl opacity-30"></div>
                  <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-600/30 rounded-full filter blur-3xl opacity-30"></div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Componentes de las demás secciones */}
      <main>
        <FeatureSection />
        <TestimonialsSection />
        
        {/* Sección de beneficios adicional */}
        <FadeInWhenVisible>
          <section className="py-24 bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Transforma tu productividad con IA</h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  SoulDream utiliza inteligencia artificial avanzada para analizar tus patrones y ofrecerte recomendaciones personalizadas.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    icon: <Brain className="h-8 w-8 text-indigo-500" />,
                    title: "Asistente Inteligente",
                    description: "Recibe orientación personalizada y consejos adaptados a tus objetivos específicos."
                  },
                  {
                    icon: <TrendingUp className="h-8 w-8 text-emerald-500" />,
                    title: "Análisis de Patrones",
                    description: "Identifica tendencias en tus hábitos y finanzas para ayudarte a tomar mejores decisiones."
                  },
                  {
                    icon: <Clock className="h-8 w-8 text-amber-500" />,
                    title: "Optimización del Tiempo",
                    description: "Sugerencias para mejorar tu productividad y aprovechar al máximo tu día."
                  }
                ].map((item, index) => (
                  <FadeInWhenVisible key={index} delay={0.2 * index}>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300 hover:-translate-y-1">
                      <div className="bg-indigo-100 dark:bg-indigo-900/40 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                        {item.icon}
                      </div>
                      <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300">{item.description}</p>
                    </div>
                  </FadeInWhenVisible>
                ))}
              </div>
            </div>
          </section>
        </FadeInWhenVisible>
        
        <PricingSection />
        <FaqSection />
      </main>
      
      <Footer />
      
      {/* Estilo global para animaciones */}
      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 12s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
        .rotate-y-6 {
          transform: rotateY(6deg);
        }
        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}
