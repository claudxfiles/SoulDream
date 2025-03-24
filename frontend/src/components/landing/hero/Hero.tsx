"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { LandingButton } from '@/components/landing/LandingButton';

export function Hero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-indigo-50 dark:from-gray-900 dark:to-gray-800 py-20 md:py-28">
      {/* Fondo con elementos decorativos */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl"></div>
        <div className="absolute top-60 -left-20 w-60 h-60 rounded-full bg-emerald-500/10 blur-3xl"></div>
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Contenido principal */}
          <motion.div 
            className="flex-1 text-center lg:text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <span className="block">Tu vida organizada en</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-600 dark:from-indigo-400 dark:to-emerald-400">
                una sola plataforma
              </span>
            </motion.h1>
            
            <motion.p 
              className="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto lg:mx-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              Gestiona tus metas, hábitos, finanzas y fitness con ayuda de inteligencia artificial.
              Optimiza tu productividad y bienestar con una herramienta todo en uno.
            </motion.p>
            
            <motion.div 
              className="mt-8 flex flex-col sm:flex-row justify-center lg:justify-start gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <LandingButton
                href="/auth/register"
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-lg"
              >
                Comenzar gratis
              </LandingButton>
              
              <LandingButton
                href="#features"
                variant="outline"
                size="lg"
                className="rounded-lg"
              >
                Ver funcionalidades
              </LandingButton>
            </motion.div>
            
            <motion.div 
              className="mt-6 flex items-center justify-center lg:justify-start space-x-2 text-sm text-gray-500 dark:text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <span>✓ Sin tarjeta de crédito</span>
              <span className="w-1 h-1 rounded-full bg-gray-400"></span>
              <span>✓ 14 días prueba completa</span>
              <span className="w-1 h-1 rounded-full bg-gray-400"></span>
              <span>✓ Cancelación fácil</span>
            </motion.div>
          </motion.div>
          
          {/* Imagen principal */}
          <motion.div 
            className="flex-1 w-full max-w-xl lg:max-w-none"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            <div className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-emerald-600 opacity-10"></div>
              <img 
                className="w-full h-full object-cover rounded-2xl border border-gray-200 dark:border-gray-700" 
                src="https://placehold.co/1200x800/f8fafc/4f46e5?text=SoulDream+Dashboard&font=montserrat" 
                alt="SoulDream Dashboard" 
              />
              
              {/* Elementos flotantes */}
              <motion.div 
                className="absolute -right-10 top-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-60"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Hábito completado</span>
                </div>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">¡Has mantenido tu racha por 7 días consecutivos!</div>
              </motion.div>
              
              <motion.div 
                className="absolute left-5 -bottom-5 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-60"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.5 }}
              >
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-indigo-500 rounded-full"></span>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Finanzas</span>
                </div>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">Has ahorrado un 15% más que el mes pasado</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
} 