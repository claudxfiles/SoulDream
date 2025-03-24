import Link from 'next/link';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Github,
  Youtube
} from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  // Términos legales completos para ser utilizados en páginas dedicadas
  const termsContent = `
    TÉRMINOS DE SERVICIO

    Fecha de última actualización: ${new Date().toLocaleDateString()}

    1. ACUERDO CON NUESTROS TÉRMINOS LEGALES

    Estos Términos de Servicio constituyen un acuerdo legalmente vinculante entre usted, ya sea personalmente o en nombre de una entidad, y SoulDream, en relación con su acceso y uso de la plataforma SoulDream, incluyendo cualquier aplicación móvil asociada.

    2. DERECHOS DE PROPIEDAD INTELECTUAL

    Nuestra plataforma y todo su contenido, características y funcionalidades son propiedad de SoulDream y están protegidos por leyes internacionales de derechos de autor, marcas registradas, patentes, secretos comerciales y otras leyes de propiedad intelectual.

    3. REPRESENTACIONES DEL USUARIO

    Al utilizar nuestra plataforma, usted declara y garantiza que: (1) toda la información de registro que envíe será verdadera, precisa, actual y completa; (2) mantendrá la precisión de dicha información; (3) tiene capacidad legal y acepta cumplir con estos Términos de Servicio.

    4. REGISTRO DE USUARIO

    Para acceder a ciertas funciones de la plataforma, es posible que deba registrarse y mantener una cuenta activa con información precisa y completa. Usted es responsable de mantener la confidencialidad de su cuenta y contraseña.

    5. PRODUCTOS Y SERVICIOS

    Proporcionamos una plataforma all-in-one para gestión personal con herramientas potenciadas por inteligencia artificial. Nos reservamos el derecho de modificar, suspender o descontinuar cualquier parte de nuestros servicios.

    6. POLÍTICA DE PRIVACIDAD

    Su privacidad es importante para nosotros. Nuestra Política de Privacidad describe cómo recopilamos, usamos y compartimos su información personal. Al utilizar nuestra plataforma, usted acepta las prácticas descritas en nuestra Política de Privacidad.

    7. CUOTAS Y PAGOS

    Ciertos aspectos de la plataforma pueden requerir una suscripción o pago. Los detalles de nuestros planes se encuentran en la sección de Precios. Todos los pagos son finales y no reembolsables, excepto cuando lo exija la ley.

    8. CANCELACIÓN

    Puede cancelar su suscripción en cualquier momento. La cancelación será efectiva al final del período de facturación actual. No proporcionamos reembolsos por el período de suscripción no utilizado.

    9. PROHIBICIONES

    Usted acepta no utilizar la plataforma para: (a) violar cualquier ley aplicable; (b) infringir los derechos de propiedad intelectual; (c) transmitir material que sea dañino, fraudulento o objetable; (d) interferir con el funcionamiento normal de la plataforma.

    10. CONTRIBUCIONES DEL USUARIO

    Nuestra plataforma puede invitarle a chatear, contribuir o participar en blogs, foros y otras funcionalidades. Cualquier contenido que usted proporcione debe ser preciso y cumplir con las leyes aplicables.

    11. LICENCIA DE CONTRIBUCIONES

    Al publicar contenido en nuestra plataforma, usted nos otorga una licencia no exclusiva, mundial, libre de regalías para usar, reproducir y distribuir dicho contenido en conexión con nuestros servicios.

    12. GESTIÓN DE LA PLATAFORMA

    Nos reservamos el derecho, pero no la obligación, de: (1) monitorear la plataforma para violaciones; (2) tomar acciones legales contra cualquier usuario que viole estos términos; (3) rechazar, limitar o terminar el acceso a la plataforma.

    13. LIMITACIÓN DE RESPONSABILIDAD

    En ningún caso SoulDream o sus directores, empleados o agentes serán responsables por cualquier daño indirecto, incidental, especial, consecuente o punitivo derivado de su uso de la plataforma.

    14. INDEMNIZACIÓN

    Usted acepta defender, indemnizar y mantener indemne a SoulDream de y contra cualquier reclamación, responsabilidad, daño, pérdida y gasto, derivados de su violación de estos Términos de Servicio.

    15. DATOS DEL USUARIO

    Mantendremos ciertos datos que usted transmita a la plataforma con el propósito de gestionar el rendimiento de la plataforma, así como los datos relacionados con su uso. Aunque realizamos copias de seguridad regulares, usted es el único responsable de todos los datos que transmite o que se relacionan con cualquier actividad que haya realizado utilizando la plataforma.

    16. COMUNICACIONES ELECTRÓNICAS

    Al utilizar nuestra plataforma, usted acepta recibir comunicaciones electrónicas de nosotros. Estas comunicaciones pueden incluir notificaciones sobre su cuenta, actualizaciones de la plataforma o información promocional.

    17. MISCELÁNEOS

    Estos Términos de Servicio y cualquier política o regla operativa publicada por nosotros constituyen el acuerdo completo entre usted y SoulDream. Nuestro fracaso en ejercer o hacer cumplir cualquier derecho o disposición de estos Términos de Servicio no funcionará como una renuncia a tal derecho o disposición.

    18. MODIFICACIONES Y TERMINACIONES

    Nos reservamos el derecho de modificar estos Términos de Servicio en cualquier momento. Los cambios entrarán en vigor inmediatamente después de su publicación. Su uso continuado de la plataforma después de dichas modificaciones constituye su aceptación de los términos modificados.
  `;

  // Política de privacidad basada en Vectal.ai, adaptada para SoulDream
  const privacyContent = `
    # Política de Privacidad

    Última actualización: ${new Date().toLocaleDateString()}

    ## Introducción

    SoulDream ("nosotros", "nuestro" o "nos") está comprometido con la protección de su privacidad mientras le proporcionamos nuestro servicio de gestión personal. Esta Política de Privacidad explica cómo recopilamos, utilizamos, compartimos y protegemos su información personal. Al iniciar la autenticación o intentar acceder a nuestro servicio, usted acepta explícitamente las prácticas descritas en esta Política de Privacidad y nuestros Términos de Servicio.

    ## Información que recopilamos

    ### Información personal

    * Información de cuenta: Cuando se registra utilizando autenticación con Google o Supabase, recopilamos su nombre y dirección de correo electrónico.
    * Datos de tareas y metas: Recopilamos y almacenamos las tareas, metas, hábitos y registros financieros que crea y gestiona dentro de nuestro servicio.
    
    ### Cómo utilizamos su información

    Utilizamos su información personal para:

    * Proporcionar y mantener nuestro servicio de gestión personal
    * Autenticar su identidad a través de nuestro sistema de inicio de sesión
    * Almacenar y gestionar sus tareas, metas y hábitos
    * Comunicarnos con usted sobre su cuenta o nuestros servicios
    * Procesar sus pagos a través de nuestro procesador de pagos
    * Mejorar y optimizar nuestro servicio
    * Proteger contra accesos no autorizados y fraude

    ## Almacenamiento y seguridad de datos

    * Almacenamos sus datos de forma segura en nuestros servidores utilizando medidas de encriptación y seguridad estándar de la industria
    * Utilizamos Supabase para nuestra infraestructura de base de datos
    * Cuando inicia sesión, almacenamos y procesamos sus datos para proporcionarle nuestros servicios y mejorar continuamente su experiencia
    * Para mantener la calidad del servicio y cumplir con obligaciones legales, algunos de sus datos pueden conservarse durante un período de tiempo después de la eliminación de la cuenta
    * Utilizamos PayPal para el procesamiento de pagos, que mantiene sus propias medidas de seguridad y política de privacidad

    ## Compartición de datos

    Compartimos su información personal únicamente en las siguientes circunstancias:

    * Con proveedores de servicios de terceros que nos ayudan a operar nuestro servicio (Google Auth, PayPal, Supabase)
    * Cuando es requerido por ley o para proteger nuestros derechos legales
    * Con su consentimiento explícito

    No vendemos su información personal a terceros.

    ## Comunicaciones de marketing

    * Al acceder a nuestro servicio, usted acepta recibir comunicaciones de marketing y actualizaciones
    * Podemos enviarle materiales promocionales a través de correo electrónico, notificaciones en la aplicación, SMS u otros canales
    * Puede optar por no recibir comunicaciones de marketing en cualquier momento enviándonos un correo electrónico a contact@souldream.com
    * Le enviaremos actualizaciones importantes del servicio e información relacionada con la cuenta para mantenerlo informado

    ## Sus derechos

    Sujeto a nuestros Términos de Servicio y requisitos legales, usted tiene derecho a:

    * Acceder a su información personal
    * Corregir datos inexactos
    * Excluirse de las comunicaciones de marketing (manteniendo las comunicaciones esenciales del servicio)
    * Solicitar información sobre cómo se utiliza su información

    Para ejercer estos derechos, contáctenos en contact@souldream.com

    ## Servicios de terceros

    Nuestro servicio se integra con:

    * Google Authentication para el inicio de sesión de usuarios
    * PayPal para el procesamiento de pagos
    * Supabase para el almacenamiento de datos
    * OpenRouter como proxy para modelos de IA

    Cada uno de estos servicios tiene su propia política de privacidad que rige cómo manejan sus datos.

    ## Cambios en esta política

    Podemos actualizar esta Política de Privacidad de vez en cuando. Le notificaremos cualquier cambio publicando la nueva Política de Privacidad en esta página y actualizando la fecha de "Última actualización".

    ## Contáctenos

    Si tiene preguntas sobre esta Política de Privacidad o nuestras prácticas de datos, contáctenos en:

    * Correo electrónico: contact@souldream.com
    * Sitio web: www.souldream.com

    ## Política de cookies

    Utilizamos solo cookies esenciales necesarias para el funcionamiento de nuestro servicio, incluida la gestión de sesiones y la autenticación. No utilizamos cookies para publicidad o fines de seguimiento.
  `;

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Logo y descripción */}
            <div>
              <div className="flex items-center">
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">SoulDream</span>
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Plataforma all-in-one para gestión personal: metas, hábitos, finanzas, fitness y más. 
                Potenciada por inteligencia artificial para optimizar tu productividad y bienestar.
              </p>
              <div className="mt-6 flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                  <span className="sr-only">Facebook</span>
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                  <span className="sr-only">Twitter</span>
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                  <span className="sr-only">Instagram</span>
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                  <span className="sr-only">LinkedIn</span>
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Secciones agrupadas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {/* Enlaces */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Producto</h3>
                <ul className="mt-4 space-y-2">
                  <li>
                    <a href="#pricing" className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                      Precios
                    </a>
                  </li>
                  <li>
                    <a href="#features" className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                      Características
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                      Guías
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Empresa</h3>
                <ul className="mt-4 space-y-2">
                  <li>
                    <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                      Acerca de
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Legal</h3>
                <ul className="mt-4 space-y-2">
                  <li>
                    <a href="/privacy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                      Privacidad
                    </a>
                  </li>
                  <li>
                    <a href="/terms" className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                      Términos
                    </a>
                  </li>
                  <li>
                    <a href="/cookies" className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                      Cookies
                    </a>
                  </li>
                  <li>
                    <a href="/licenses" className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                      Licencias
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Soporte</h3>
                <ul className="mt-4 space-y-2">
                  <li>
                    <a href="/contact" className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                      Contacto
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                      Centro de ayuda
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                      Comunidad
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                      Tutoriales
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Línea separadora */}
        <div className="border-t border-gray-200 dark:border-gray-800 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              &copy; {currentYear} SoulDream. Todos los derechos reservados.
            </p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                Mapa del sitio
              </a>
              <a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                Accesibilidad
              </a>
              <a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                Preferencias de cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 