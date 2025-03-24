'use client';

import React from "react";
import { Footer } from "@/components/landing/footer/Footer";
import { Navbar } from "@/components/landing/Navbar";

export default function CookiesPage() {
  const currentDate: string = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-950 dark:to-gray-900">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="pt-24 pb-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <span className="inline-block px-3 py-1 text-sm font-medium rounded-full text-indigo-600 bg-indigo-100 dark:bg-indigo-900/60 dark:text-indigo-300">
                Legal
              </span>
              <h1 className="mt-4 text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl">
                Política de Cookies
              </h1>
              <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
                Entendemos que tu privacidad es importante. Así es como utilizamos las cookies en nuestra plataforma.
              </p>
            </div>
          </div>
        </section>
        
        {/* Content Section */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Uso mínimo y transparente
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Última actualización: {currentDate}
                </p>
              </div>
              
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                  ¿Qué son las cookies?
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Las cookies son pequeños archivos de texto que los sitios web colocan en su dispositivo cuando los visita. Estas cookies ayudan a que el sitio web recuerde información sobre su visita, como su idioma preferido y otras configuraciones. Esto puede hacer que su próxima visita sea más fácil y que el sitio sea más útil para usted.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-10 mb-4">
                  Cookies que utilizamos
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  En SoulDream, utilizamos solamente cookies esenciales necesarias para el funcionamiento básico de nuestro servicio. Estas cookies son fundamentales para permitirle navegar por nuestro sitio web y utilizar sus características, como el acceso a áreas seguras.
                </p>

                <h4 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
                  Cookies esenciales
                </h4>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-6 space-y-3">
                  <li>
                    <strong>Cookies de sesión:</strong> Estas cookies son temporales y se eliminan cuando cierra su navegador. Utilizamos cookies de sesión para mantener su estado de inicio de sesión mientras navega por nuestra plataforma.
                  </li>
                  <li>
                    <strong>Cookies de autenticación:</strong> Estas cookies nos ayudan a identificarlo cuando inicia sesión en nuestra plataforma, permitiéndole acceder a áreas seguras y personalizadas de nuestro servicio.
                  </li>
                  <li>
                    <strong>Cookies de preferencias:</strong> Estas cookies nos permiten recordar sus preferencias básicas, como el modo oscuro/claro, para mejorar su experiencia en nuestro sitio.
                  </li>
                </ul>

                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg p-6 my-8">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Lo que NO hacemos con las cookies
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    A diferencia de muchos otros sitios web, en SoulDream:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                    <li>No utilizamos cookies para publicidad dirigida</li>
                    <li>No utilizamos cookies para rastrear su comportamiento en otros sitios web</li>
                    <li>No vendemos información recopilada a través de cookies a terceros</li>
                    <li>No permitimos que terceros coloquen cookies en nuestro sitio para fines de seguimiento</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-10 mb-4">
                  Gestión de cookies
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  La mayoría de los navegadores web permiten cierto control de la mayoría de las cookies a través de la configuración del navegador. Para saber más sobre las cookies, incluido cómo ver qué cookies se han establecido y cómo administrarlas y eliminarlas, visite <a href="http://www.allaboutcookies.org/" className="text-indigo-600 dark:text-indigo-400 hover:underline">allaboutcookies.org</a>.
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Puede configurar su navegador para rechazar todas las cookies, aceptar solo cookies de origen, o avisarle cuando se establece una cookie. Sin embargo, si configura su navegador para deshabilitar las cookies (especialmente las cookies esenciales), es posible que no pueda acceder a ciertas partes de nuestro servicio o que algunas funcionalidades no trabajen correctamente.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-10 mb-4">
                  Cambios en nuestra política de cookies
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Podemos actualizar esta Política de Cookies de vez en cuando. Le notificaremos cualquier cambio publicando la nueva Política de Cookies en esta página y actualizando la fecha de "Última actualización".
                </p>

                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg p-6 mt-10 mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Contacto
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Si tiene preguntas sobre esta Política de Cookies, por favor contáctenos en:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-2 space-y-2">
                    <li>
                      Correo electrónico: <a href="mailto:contact@souldream.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">contact@souldream.com</a>
                    </li>
                    <li>
                      Sitio web: <a href="https://www.souldream.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">www.souldream.com</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
} 