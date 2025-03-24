'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, MessageSquare } from 'lucide-react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/footer/Footer';
import { ContactForm } from '@/components/contact/ContactForm';

export default function ContactPage() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-950 dark:to-gray-900">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="pt-24 pb-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-3xl mx-auto"
            >
              <span className="inline-block px-3 py-1 text-sm font-medium rounded-full text-indigo-600 bg-indigo-100 dark:bg-indigo-900/60 dark:text-indigo-300">
                Contáctanos
              </span>
              <h1 className="mt-4 text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl">
                Estamos aquí para ayudarte
              </h1>
              <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
                Tienes preguntas o necesitas ayuda? Nuestro equipo está listo para asistirte en lo que necesites.
              </p>
            </motion.div>
          </div>
        </section>
        
        {/* Contact Information */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8"
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Envíanos un mensaje
                </h2>
                <div className="mb-4 flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Nuestro sistema de contacto está 100% operativo. Te responderemos a la brevedad.
                  </p>
                </div>
                <ContactForm />
              </motion.div>
              
              {/* Contact Details */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col space-y-8"
              >
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Información de contacto
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/40 p-3 rounded-full">
                        <Mail className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Email</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">claudio.alcaman@gmail.com</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/40 p-3 rounded-full">
                        <Phone className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Teléfono</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">+34 912 345 678</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/40 p-3 rounded-full">
                        <MapPin className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Dirección</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Calle Innovación, 123<br />
                          28001 Madrid, España
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/40 p-3 rounded-full">
                        <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Horario de atención</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Lunes a Viernes: 9:00 - 18:00<br />
                          Fines de semana: Cerrado
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                    Preguntas frecuentes
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    ¿No encuentras la respuesta que buscas? Consulta nuestra sección de preguntas frecuentes.
                  </p>
                  <a 
                    href="/#faq" 
                    className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                  >
                    Ver preguntas frecuentes
                    <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
} 