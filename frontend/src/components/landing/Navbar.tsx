"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Menu, X, Moon, Sun } from 'lucide-react';
import { LandingButton } from '@/components/landing/LandingButton';
import { useTheme } from '@/app/providers';

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Detectar scroll para cambiar el estilo de la barra
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    setMounted(true);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // No renderizar en el servidor
  if (!mounted) return null;

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled 
          ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-800' 
          : 'bg-transparent dark:bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              href="/" 
              className="flex items-center"
            >
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-500 dark:from-indigo-400 dark:to-indigo-300">
                SoulDream
              </span>
            </Link>
          </div>
          
          {/* Navegación de escritorio */}
          <nav className="hidden md:flex space-x-10">
            <a href="#features" className="text-base font-medium text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition">
              Características
            </a>
            <a href="#pricing" className="text-base font-medium text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition">
              Precios
            </a>
            <a href="#testimonials" className="text-base font-medium text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition">
              Testimonios
            </a>
            <a href="#faq" className="text-base font-medium text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition">
              FAQ
            </a>
          </nav>
          
          {/* Acciones de escritorio */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white focus:outline-none"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            
            <Link 
              href="/auth/login" 
              className="text-base font-medium text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Iniciar sesión
            </Link>
            
            <LandingButton href="/auth/register" variant="primary">
              Registrarse
            </LandingButton>
          </div>
          
          {/* Botón de menú móvil */}
          <div className="flex items-center md:hidden space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white focus:outline-none"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Menú móvil */}
      {mobileMenuOpen && (
        <motion.div 
          className="md:hidden"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <a 
              href="#features" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              Características
            </a>
            <a 
              href="#pricing" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              Precios
            </a>
            <a 
              href="#testimonials" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              Testimonios
            </a>
            <a 
              href="#faq" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              FAQ
            </a>
          </div>
          
          <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between px-4">
              <Link 
                href="/auth/login" 
                className="block text-base font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
                onClick={() => setMobileMenuOpen(false)}
              >
                Iniciar sesión
              </Link>
              
              <LandingButton 
                href="/auth/register" 
                size="sm" 
                onClick={() => setMobileMenuOpen(false)}
              >
                Registrarse
              </LandingButton>
            </div>
          </div>
        </motion.div>
      )}
    </header>
  );
} 