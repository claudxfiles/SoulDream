'use client';

import React from "react";
import { Footer } from "@/components/landing/footer/Footer";
import { Navbar } from "@/components/landing/Navbar";

export default function PrivacyPolicy() {
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
                Política de Privacidad
              </h1>
              <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
                Valoramos y protegemos tu privacidad. Aquí te explicamos cómo tratamos tus datos personales.
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
                  Política de Privacidad
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Última actualización: {currentDate}
                </p>
              </div>
              
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  En SoulDream, nos tomamos muy en serio la protección de sus datos personales. Esta Política de Privacidad explica cómo recopilamos, utilizamos, procesamos y protegemos su información cuando utiliza nuestra plataforma de gestión de tareas y productividad. Al utilizar nuestro servicio, usted acepta las prácticas descritas en esta política.
                </p>
                
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-10 mb-4">
                  Información que recopilamos
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Para proporcionar y mejorar nuestros servicios, recopilamos diferentes tipos de información:
                </p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-6 space-y-3">
                  <li>
                    <strong>Información de registro:</strong> Cuando crea una cuenta, recopilamos su nombre, dirección de correo electrónico y contraseña.
                  </li>
                  <li>
                    <strong>Información de perfil:</strong> Puede optar por proporcionar información adicional como foto de perfil, biografía, y preferencias de notificación.
                  </li>
                  <li>
                    <strong>Datos de uso:</strong> Recopilamos información sobre cómo interactúa con nuestra plataforma, incluyendo las tareas que crea, las listas que organiza, y las características que utiliza.
                  </li>
                  <li>
                    <strong>Información del dispositivo:</strong> Podemos recopilar información sobre el dispositivo que utiliza para acceder a nuestros servicios, como el modelo de hardware, sistema operativo, y configuración del navegador.
                  </li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-10 mb-4">
                  Cómo utilizamos su información
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Utilizamos la información que recopilamos para los siguientes propósitos:
                </p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-6 space-y-3">
                  <li>Proporcionar, mantener y mejorar nuestros servicios</li>
                  <li>Procesar y completar transacciones</li>
                  <li>Enviar información técnica, actualizaciones, alertas de seguridad y mensajes de soporte</li>
                  <li>Responder a sus comentarios, preguntas y solicitudes</li>
                  <li>Desarrollar nuevos productos y servicios</li>
                  <li>Monitorear y analizar tendencias, uso y actividades en relación con nuestros servicios</li>
                  <li>Personalizar su experiencia</li>
                  <li>Proteger la seguridad e integridad de nuestros servicios</li>
                </ul>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-6 my-8">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Almacenamiento y seguridad de datos
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Tomamos medidas para proteger su información contra acceso no autorizado, alteración, divulgación o destrucción:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                    <li>Utilizamos cifrado SSL/TLS para proteger la transmisión de datos</li>
                    <li>Implementamos medidas de seguridad técnicas y organizativas apropiadas</li>
                    <li>Limitamos el acceso a la información personal a empleados y contratistas que necesitan conocer esa información</li>
                    <li>Almacenamos datos en servidores seguros ubicados en la Unión Europea</li>
                    <li>Realizamos auditorías de seguridad periódicas</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-10 mb-4">
                  Compartir información
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  No vendemos, alquilamos ni compartimos su información personal con terceros sin su consentimiento, excepto en las siguientes circunstancias:
                </p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-6 space-y-3">
                  <li>
                    <strong>Proveedores de servicios:</strong> Trabajamos con proveedores de servicios de confianza que realizan servicios y funciones en nuestro nombre. Estos proveedores tienen acceso a su información personal solo para realizar estas tareas y están obligados contractualmente a proteger y utilizar su información únicamente para los fines para los que se les proporcionó.
                  </li>
                  <li>
                    <strong>Requisitos legales:</strong> Podemos divulgar su información si creemos de buena fe que dicha acción es necesaria para cumplir con una obligación legal, proteger y defender nuestros derechos o propiedad, prevenir o investigar posibles abusos en relación con el servicio, proteger la seguridad personal de los usuarios del servicio o del público, o proteger contra responsabilidad legal.
                  </li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-10 mb-4">
                  Comunicaciones de marketing
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Podemos utilizar su información para contactarle con boletines informativos, materiales de marketing o promocionales y otra información que pueda ser de su interés. Puede optar por no recibir cualquiera, o todas, estas comunicaciones de nuestra parte siguiendo las instrucciones de cancelación de suscripción proporcionadas en cualquier correo electrónico que le enviemos o contactándonos directamente.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-10 mb-4">
                  Sus derechos
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Dependiendo de su ubicación, puede tener ciertos derechos con respecto a su información personal:
                </p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-6 space-y-3">
                  <li>El derecho a acceder a la información que tenemos sobre usted</li>
                  <li>El derecho a rectificar, actualizar o eliminar la información que tenemos sobre usted</li>
                  <li>El derecho a la portabilidad de datos</li>
                  <li>El derecho a retirar el consentimiento para el procesamiento de sus datos personales</li>
                  <li>El derecho a oponerse al procesamiento de sus datos personales</li>
                  <li>El derecho a presentar una queja ante una autoridad de protección de datos</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  Para ejercer estos derechos, por favor contáctenos utilizando la información proporcionada al final de esta política.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-10 mb-4">
                  Servicios de terceros
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Nuestra plataforma puede contener enlaces a sitios web, productos o servicios de terceros. No somos responsables de las prácticas de privacidad de estos terceros. Le recomendamos que lea las políticas de privacidad de cualquier sitio web o servicio de terceros que visite o utilice.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-10 mb-4">
                  Cambios a esta política
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Podemos actualizar nuestra Política de Privacidad de vez en cuando. Le notificaremos cualquier cambio publicando la nueva Política de Privacidad en esta página y/o enviándole un correo electrónico. Le recomendamos que revise esta Política de Privacidad periódicamente para cualquier cambio.
                </p>

                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg p-6 mt-10 mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Contacto
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Si tiene preguntas sobre esta Política de Privacidad, por favor contáctenos en:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-2 space-y-2">
                    <li>
                      Correo electrónico: <a href="mailto:privacy@souldream.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">privacy@souldream.com</a>
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