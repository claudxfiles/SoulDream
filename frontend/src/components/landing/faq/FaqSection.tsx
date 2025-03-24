"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface FaqItem {
  question: string;
  answer: string;
}

export function FaqSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const faqs: FaqItem[] = [
    {
      question: '¿Qué hace diferente a SoulDream de otras aplicaciones?',
      answer: 'SoulDream integra todas tus herramientas de productividad, finanzas, hábitos y fitness en una sola plataforma, potenciada por IA. A diferencia de otras soluciones que se centran en un solo aspecto, nosotros te ofrecemos una visión holística de tu vida y te ayudamos a mejorar en todas las áreas.'
    },
    {
      question: '¿Cómo funciona el asistente de IA?',
      answer: 'Nuestro asistente de IA analiza tus patrones, objetivos y hábitos para ofrecerte recomendaciones personalizadas. Puede ayudarte a planificar mejor tu día, sugerir mejoras en tus finanzas, crear rutinas de ejercicio adaptadas a tus metas y mucho más. La IA aprende continuamente para ofrecerte sugerencias cada vez más precisas.'
    },
    {
      question: '¿Puedo cancelar mi suscripción en cualquier momento?',
      answer: 'Sí, puedes cancelar tu suscripción cuando quieras. No hay contratos a largo plazo ni penalizaciones. Si cancelas durante los primeros 14 días, te devolveremos el dinero sin hacer preguntas. Tras la cancelación, mantendrás acceso hasta el final del período pagado.'
    },
    {
      question: '¿Mis datos están seguros?',
      answer: 'La seguridad de tus datos es nuestra prioridad. Utilizamos encriptación de nivel bancario, almacenamiento seguro en la nube y nunca compartimos tus datos con terceros. Cumplimos con todas las regulaciones de protección de datos, incluyendo RGPD. Además, siempre mantienes el control total sobre tus datos y puedes exportarlos o eliminarlos cuando lo desees.'
    },
    {
      question: '¿Funciona SoulDream en todos los dispositivos?',
      answer: 'Sí, SoulDream funciona perfectamente en ordenadores, tablets y smartphones. Tenemos aplicaciones nativas para iOS y Android, así como una versión web que se adapta a cualquier tamaño de pantalla. Todos tus datos se sincronizan automáticamente entre dispositivos para que puedas acceder desde donde quieras.'
    },
    {
      question: '¿Cómo puedo importar mis datos desde otras aplicaciones?',
      answer: 'Ofrecemos herramientas de importación para las plataformas más populares. Puedes importar tareas desde Todoist y Asana, hábitos desde Habitica, datos financieros en formato CSV, y sincronizar con Google Calendar. Si necesitas ayuda con la importación, nuestro equipo de soporte estará encantado de asistirte.'
    },
    {
      question: '¿Qué soporte ofrecen?',
      answer: 'En el plan gratuito, ofrecemos soporte por email con tiempo de respuesta de 48 horas y acceso a nuestra base de conocimientos. Los usuarios Premium tienen soporte prioritario por email con respuesta en 24 horas. Los usuarios de plan Business tienen soporte prioritario con respuesta en 4 horas y acceso a un gestor de cuenta dedicado.'
    },
    {
      question: '¿Ofrecen descuentos para equipos o educación?',
      answer: 'Sí, ofrecemos descuentos especiales para equipos a partir de 10 usuarios. También tenemos un programa de descuentos para estudiantes y profesores con un 50% de descuento en el plan Premium. Contáctanos para más información sobre estos programas.'
    }
  ];

  // Animación para el contenedor
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Animación para cada elemento
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <section id="faq" className="py-24 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block px-3 py-1 text-sm font-medium rounded-full text-indigo-600 bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-300">
            Preguntas Frecuentes
          </span>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Resolvemos tus dudas
          </h2>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
            Todo lo que necesitas saber antes de comenzar con SoulDream
          </p>
        </motion.div>

        <motion.div 
          className="mt-16 max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div key={index} variants={itemVariants}>
                <AccordionItem value={`item-${index}`} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <AccordionTrigger className="px-6 py-4 text-left text-base md:text-lg font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 pt-0 text-gray-600 dark:text-gray-300">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>

        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <p className="text-gray-600 dark:text-gray-400">
            ¿No encuentras la respuesta que buscas?{' '}
            <a 
              href="/contact" 
              className="text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              Contáctanos
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
} 