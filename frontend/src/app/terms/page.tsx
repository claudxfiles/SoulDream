'use client';

import React from "react";
import { Footer } from "@/components/landing/footer/Footer";
import { Navbar } from "@/components/landing/Navbar";

export default function TermsPage() {
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
                Términos y Condiciones
              </h1>
              <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
                Por favor lea atentamente estos términos antes de utilizar nuestra plataforma.
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
                  Términos y Condiciones
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Última actualización: {currentDate}
                </p>
              </div>
              
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                  Acuerdo con Nuestros Términos Legales
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Estos Términos y Condiciones constituyen un acuerdo legalmente vinculante entre usted, ya sea personalmente o en nombre de una entidad ("usted") y SoulDream ("nosotros", "nos", o "nuestro"), en relación con su acceso y uso de la plataforma SoulDream, incluyendo cualquier contenido, funcionalidad y servicios ofrecidos en o a través de souldream.com o nuestras aplicaciones móviles (el "Servicio").
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  Al acceder o utilizar el Servicio, usted acepta estar vinculado por estos Términos y Condiciones. Si no está de acuerdo con alguna parte de estos Términos y Condiciones, entonces no tendrá acceso al Servicio.
                </p>

                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg p-6 my-8">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Derechos de Propiedad Intelectual
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    A menos que se indique lo contrario, el Servicio es propiedad de SoulDream y toda la fuente de códigos, bases de datos, funcionalidad, software, diseños de sitios web, audio, video, texto, fotografías y gráficos en el Servicio (colectivamente, el "Contenido") y las marcas comerciales, marcas de servicio y logotipos contenidos en el mismo (las "Marcas") son propiedad o están controlados por nosotros o licenciados a nosotros, y están protegidos por leyes de derechos de autor y marcas comerciales.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-10 mb-4">
                  Representaciones del Usuario
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Al utilizar el Servicio, usted declara y garantiza que:
                </p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-6 space-y-3">
                  <li>Toda la información de registro que envíe será verdadera, precisa, actual y completa.</li>
                  <li>Mantendrá la precisión de dicha información y actualizará prontamente dicha información según sea necesario.</li>
                  <li>Tiene la capacidad legal y acepta cumplir con estos Términos y Condiciones.</li>
                  <li>No es menor de 18 años.</li>
                  <li>No accederá al Servicio a través de medios automatizados o no humanos.</li>
                  <li>No utilizará el Servicio para ningún propósito ilegal o no autorizado.</li>
                  <li>Su uso del Servicio no violará ninguna ley o regulación aplicable.</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-10 mb-4">
                  Registro de Usuario
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Es posible que deba registrarse para utilizar el Servicio. Acepta mantener la confidencialidad de su contraseña y será responsable de todo el uso de su cuenta y contraseña. Nos reservamos el derecho de eliminar, reclamar o cambiar un nombre de usuario que seleccione si determinamos, a nuestra entera discreción, que dicho nombre de usuario es inapropiado, obsceno o de otra manera objetable.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-10 mb-4">
                  Productos y Servicios
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  Nos reservamos el derecho, pero no la obligación, de limitar las ventas de nuestros productos o servicios a cualquier persona, región geográfica o jurisdicción. Podemos ejercer este derecho caso por caso. Nos reservamos el derecho de limitar las cantidades de cualquier producto o servicio que ofrecemos. Todas las descripciones de productos o precios de productos están sujetos a cambios en cualquier momento sin previo aviso, a nuestra entera discreción.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-10 mb-4">
                  Política de Privacidad
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  Su envío de información personal a través del Servicio está regido por nuestra Política de Privacidad. Nuestra <a href="/privacy" className="text-indigo-600 dark:text-indigo-400 hover:underline">Política de Privacidad</a> establece cómo recopilamos, usamos, protegemos y divulgamos su información personal en relación con su uso de nuestro Servicio.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-10 mb-4">
                  Tarifas y Pagos
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Algunos de nuestros servicios requieren que pague tarifas. Al registrarse en ciertos servicios, acepta pagar todas las tarifas aplicables. Podemos suspender o cancelar su acceso a servicios pagos si no pagamos cualquier tarifa aplicable.
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  Todas las tarifas están sujetas a cambios con previo aviso. Será responsable de todos los impuestos aplicables, si los hubiera, en relación con su uso del Servicio y los pagos de cualquier tarifa.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-10 mb-4">
                  Cancelación
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Puede cancelar su suscripción o eliminar su cuenta en cualquier momento accediendo a la página de configuración de su cuenta. Si cancela su suscripción, no tendrá derecho a un reembolso por el período de suscripción actual.
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  Nos reservamos el derecho de cancelar o suspender su cuenta y acceso al Servicio inmediatamente, sin previo aviso o responsabilidad, a nuestra entera discreción, por cualquier motivo o sin motivo alguno, incluido, pero no limitado a un incumplimiento de estos Términos y Condiciones.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-10 mb-4">
                  Prohibiciones
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Usted acepta no:
                </p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-6 space-y-3">
                  <li>Utilizar el Servicio de manera que pueda dañar, desactivar, sobrecargar o deteriorar el Servicio.</li>
                  <li>Utilizar cualquier robot, araña u otro dispositivo automático para acceder al Servicio para cualquier propósito.</li>
                  <li>Introducir virus, troyanos, gusanos, bombas lógicas u otro material malicioso o tecnológicamente dañino.</li>
                  <li>Intentar obtener acceso no autorizado a cualquier parte del Servicio.</li>
                  <li>Interferir con el funcionamiento adecuado del Servicio.</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-10 mb-4">
                  Contribuciones del Usuario
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  El Servicio puede permitirle publicar, enlazar, almacenar, compartir y de otra manera poner a disposición cierta información, texto, gráficos, videos u otro material ("Contribuciones"). Sus Contribuciones deben cumplir con los contenidos y otros estándares establecidos en estos Términos y Condiciones.
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  Cualquier Contribución que publique en el Servicio se considerará no confidencial y no propietaria. Usted se compromete a no publicar ninguna información que sea obscena, vulgar, difamatoria, odiosa, amenazante, sexualmente explícita o que promueva la violencia, la discriminación o el comportamiento ilegal.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-10 mb-4">
                  Licencia de Contribuciones
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  Al proporcionar Contribuciones al Servicio, usted nos otorga una licencia mundial, no exclusiva, libre de regalías, sublicenciable y transferible para usar, reproducir, modificar, adaptar, publicar, traducir, crear trabajos derivados, distribuir y mostrar públicamente dichas Contribuciones. Esta licencia nos permite utilizar sus Contribuciones para proporcionar, promover y mejorar el Servicio.
                </p>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-6 my-8">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Gestión de la Plataforma
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Nos reservamos el derecho, pero no la obligación, de:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                    <li>Monitorear el Servicio en busca de violaciones de estos Términos y Condiciones.</li>
                    <li>Tomar acciones legales apropiadas contra cualquier persona que, a nuestro exclusivo criterio, viole la ley o estos Términos y Condiciones.</li>
                    <li>Eliminar o negarse a publicar cualquier Contribución por cualquier motivo o sin motivo alguno.</li>
                    <li>Terminar o denegar el acceso al Servicio a cualquier persona por cualquier motivo, a nuestra entera discreción.</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-10 mb-4">
                  Limitación de Responsabilidad
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  En ningún caso SoulDream, nuestros directores, empleados, socios, agentes, proveedores o afiliados serán responsables por cualquier daño indirecto, incidental, especial, consecuente o punitivo, incluyendo sin limitación, pérdida de beneficios, datos, uso, buena voluntad, u otras pérdidas intangibles, resultantes de (i) su acceso a o uso o incapacidad para acceder o usar el Servicio; (ii) cualquier conducta o contenido de cualquier tercero en el Servicio; (iii) cualquier contenido obtenido del Servicio; y (iv) acceso no autorizado, uso o alteración de sus transmisiones o contenido, ya sea basado en garantía, contrato, agravio (incluyendo negligencia) o cualquier otra teoría legal, independientemente de si hemos sido informados de la posibilidad de tales daños.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-10 mb-4">
                  Indemnización
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  Usted acepta defender, indemnizar y mantener indemne a SoulDream, nuestros afiliados, licenciantes y proveedores de servicios, y sus respectivos funcionarios, directores, empleados, contratistas, agentes, licenciantes, proveedores, sucesores y cesionarios de y contra cualquier reclamo, responsabilidad, daño, juicio, premio, pérdida, costo, gasto o tarifa (incluyendo honorarios razonables de abogados) que surjan de o estén relacionados con su violación de estos Términos y Condiciones.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-10 mb-4">
                  Datos del Usuario
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  Mantendremos ciertos datos que usted transmita al Servicio con el propósito de gestionar el rendimiento del Servicio, así como los datos relacionados con su uso del Servicio. Aunque realizamos copias de seguridad regulares de los datos, usted es el único responsable de todos los datos que transmite o que se relacionan con cualquier actividad que haya realizado utilizando el Servicio.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-10 mb-4">
                  Comunicaciones Electrónicas
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  Al utilizar el Servicio, usted consiente en recibir comunicaciones electrónicas de nosotros. Estas comunicaciones pueden incluir notificaciones sobre su cuenta, cambios a estos Términos y Condiciones, boletines informativos o información promocional, y cualquier otra información concerniente a su uso del Servicio.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-10 mb-4">
                  Misceláneos
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  Estos Términos y Condiciones y cualquier política o reglas de operación publicadas por nosotros en el Servicio constituyen el acuerdo y entendimiento completo entre usted y nosotros. Nuestro fracaso en ejercer o hacer cumplir cualquier derecho o provisión de estos Términos y Condiciones no operará como una renuncia a tal derecho o provisión. Estos Términos y Condiciones operan en la máxima medida permitida por la ley. Podemos asignar cualquiera o todos nuestros derechos y obligaciones a otros en cualquier momento. No seremos responsables de ninguna pérdida, daño, demora o falta de acción causada por cualquier causa fuera de nuestro control razonable.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-10 mb-4">
                  Modificaciones y Terminaciones
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Nos reservamos el derecho de modificar, suspender o discontinuar, temporal o permanentemente, el Servicio (o cualquier parte del mismo) con o sin previo aviso en cualquier momento. Usted acepta que no seremos responsables ante usted o cualquier tercero por cualquier modificación, suspensión o discontinuación del Servicio.
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  Podemos actualizar estos Términos y Condiciones de vez en cuando. Le notificaremos cualquier cambio publicando los nuevos Términos y Condiciones en esta página y actualizando la fecha de "Última actualización" al principio de estos Términos y Condiciones. Es su responsabilidad revisar estos Términos y Condiciones periódicamente para conocer los cambios. Al continuar accediendo o utilizando nuestro Servicio después de que los cambios entren en vigor, usted acepta estar vinculado por los Términos y Condiciones revisados.
                </p>

                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg p-6 mt-10">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Contacto
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Si tiene preguntas sobre estos Términos y Condiciones, por favor contáctenos en:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-2 space-y-2">
                    <li>
                      Correo electrónico: <a href="mailto:legal@souldream.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">legal@souldream.com</a>
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