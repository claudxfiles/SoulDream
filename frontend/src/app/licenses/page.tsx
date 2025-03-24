'use client';

import React from "react";
import { Footer } from "@/components/landing/footer/Footer";
import { Navbar } from "@/components/landing/Navbar";

export default function LicensesPage() {
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
                Licencias de Software
              </h1>
              <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
                SoulDream utiliza múltiples tecnologías de código abierto. Reconocemos y agradecemos a las comunidades que hacen posible nuestro servicio.
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
                  Información sobre licencias
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Última actualización: {currentDate}
                </p>
              </div>
              
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                  Tecnologías utilizadas
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  SoulDream utiliza diversas tecnologías de código abierto y propietario para ofrecer nuestro servicio. A continuación, se presenta un listado de las principales tecnologías y sus respectivas licencias:
                </p>

                <div className="overflow-x-auto mt-6 mb-8">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Tecnología
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Versión
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Licencia
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Enlace
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">React</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">18.x</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">MIT</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <a href="https://github.com/facebook/react" className="text-indigo-600 dark:text-indigo-400 hover:underline" target="_blank" rel="noopener noreferrer">
                            GitHub
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">Next.js</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">14.x</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">MIT</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <a href="https://github.com/vercel/next.js" className="text-indigo-600 dark:text-indigo-400 hover:underline" target="_blank" rel="noopener noreferrer">
                            GitHub
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">Tailwind CSS</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">3.x</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">MIT</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <a href="https://github.com/tailwindlabs/tailwindcss" className="text-indigo-600 dark:text-indigo-400 hover:underline" target="_blank" rel="noopener noreferrer">
                            GitHub
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">TypeScript</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">5.x</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">Apache-2.0</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <a href="https://github.com/microsoft/TypeScript" className="text-indigo-600 dark:text-indigo-400 hover:underline" target="_blank" rel="noopener noreferrer">
                            GitHub
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">Framer Motion</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">10.x</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">MIT</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <a href="https://github.com/framer/motion" className="text-indigo-600 dark:text-indigo-400 hover:underline" target="_blank" rel="noopener noreferrer">
                            GitHub
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">Shadcn UI</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">Latest</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">MIT</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <a href="https://github.com/shadcn/ui" className="text-indigo-600 dark:text-indigo-400 hover:underline" target="_blank" rel="noopener noreferrer">
                            GitHub
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">FastAPI</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">0.100.x</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">MIT</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <a href="https://github.com/tiangolo/fastapi" className="text-indigo-600 dark:text-indigo-400 hover:underline" target="_blank" rel="noopener noreferrer">
                            GitHub
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">Supabase</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">Latest</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">Apache-2.0</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <a href="https://github.com/supabase/supabase" className="text-indigo-600 dark:text-indigo-400 hover:underline" target="_blank" rel="noopener noreferrer">
                            GitHub
                          </a>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-10 mb-4">
                  Licencia MIT
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  La mayoría de las dependencias que utilizamos están bajo la licencia MIT:
                </p>
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-5 my-6">
                  <pre className="text-gray-700 dark:text-gray-300 text-sm font-mono whitespace-pre-wrap">
                    MIT License

                    Copyright (c) [año] [titular del copyright]

                    Permission is hereby granted, free of charge, to any person obtaining a copy
                    of this software and associated documentation files (the "Software"), to deal
                    in the Software without restriction, including without limitation the rights
                    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
                    copies of the Software, and to permit persons to whom the Software is
                    furnished to do so, subject to the following conditions:

                    The above copyright notice and this permission notice shall be included in all
                    copies or substantial portions of the Software.

                    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
                    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
                    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
                    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
                    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
                    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
                    SOFTWARE.
                  </pre>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-10 mb-4">
                  Licencia de SoulDream
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  El software SoulDream se proporciona bajo la licencia MIT. Nuestro código fuente personalizado, interfaces de usuario y diseños están protegidos por derechos de autor y no pueden ser utilizados sin autorización explícita fuera de los términos de la licencia.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-10 mb-4">
                  Derechos de terceros
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  SoulDream respeta los derechos de propiedad intelectual de terceros. Si cree que algún contenido dentro de nuestra plataforma infringe sus derechos, contáctenos a través de la información proporcionada a continuación.
                </p>

                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg p-6 mt-10 mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Contacto
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Si tiene preguntas sobre nuestras licencias de software o cualquier otra consulta legal, contáctenos en:
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