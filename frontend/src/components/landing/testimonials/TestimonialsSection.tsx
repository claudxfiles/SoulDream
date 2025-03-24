"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface Testimonial {
  content: string;
  author: string;
  role: string;
  avatar: string;
  rating: number;
}

export function TestimonialsSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const testimonials: Testimonial[] = [
    {
      content: "SoulDream ha transformado mi forma de organizar mi vida. Antes usaba 5 apps diferentes para gestionar mis actividades, ahora todo está centralizado en un solo lugar.",
      author: "Maria García",
      role: "Empresaria",
      avatar: "https://randomuser.me/api/portraits/women/1.jpg",
      rating: 5
    },
    {
      content: "El asistente de IA me ha ayudado a establecer metas más realistas y a mantenerme enfocado en lo importante. He mejorado mi productividad en un 40%.",
      author: "Carlos Mendoza",
      role: "Desarrollador de Software",
      avatar: "https://randomuser.me/api/portraits/men/2.jpg",
      rating: 5
    },
    {
      content: "La función de seguimiento de finanzas me ha permitido ahorrar más dinero en 3 meses que en todo el año pasado. Las recomendaciones son muy acertadas.",
      author: "Laura Sánchez",
      role: "Contadora",
      avatar: "https://randomuser.me/api/portraits/women/3.jpg",
      rating: 4
    },
    {
      content: "Como entrenador personal, recomiendo SoulDream a todos mis clientes. La integración entre metas, hábitos y ejercicio es simplemente perfecta.",
      author: "Roberto Álvarez",
      role: "Entrenador Personal",
      avatar: "https://randomuser.me/api/portraits/men/4.jpg",
      rating: 5
    }
  ];

  // Animación para el contenedor
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  // Animación para cada testimonio
  const testimonialVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <section id="testimonials" className="py-24 bg-gradient-to-b from-indigo-50 to-white dark:from-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block px-3 py-1 text-sm font-medium rounded-full text-indigo-600 bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-300">
            Testimonios
          </span>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Historias de éxito de nuestros usuarios
          </h2>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
            Descubre cómo SoulDream está transformando la vida de personas reales
          </p>
        </motion.div>

        <motion.div 
          className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div 
              key={index} 
              className="relative"
              variants={testimonialVariants}
            >
              <div className="relative h-full">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-200"></div>
                <div className="relative h-full bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex flex-col">
                  {/* Estrellas de valoración */}
                  <div className="flex text-amber-400 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${i < testimonial.rating ? 'fill-current' : 'stroke-current fill-none'}`} 
                      />
                    ))}
                  </div>
                  
                  {/* Contenido */}
                  <p className="text-gray-700 dark:text-gray-300 italic flex-grow">
                    "{testimonial.content}"
                  </p>
                  
                  {/* Autor */}
                  <div className="mt-6 flex items-center">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.author} 
                      className="w-10 h-10 rounded-full object-cover mr-3"
                    />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {testimonial.author}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Métricas */}
        <motion.div 
          className="mt-24 grid grid-cols-2 gap-8 sm:grid-cols-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="text-center">
            <div className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">10K+</div>
            <div className="mt-2 text-base font-medium text-gray-500 dark:text-gray-400">Usuarios activos</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">92%</div>
            <div className="mt-2 text-base font-medium text-gray-500 dark:text-gray-400">Tasa de retención</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">4.8/5</div>
            <div className="mt-2 text-base font-medium text-gray-500 dark:text-gray-400">Valoración promedio</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">30M+</div>
            <div className="mt-2 text-base font-medium text-gray-500 dark:text-gray-400">Tareas completadas</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 