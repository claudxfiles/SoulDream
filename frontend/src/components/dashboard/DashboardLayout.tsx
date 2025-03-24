"use client";

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  CheckSquare, 
  Calendar, 
  BarChart2, 
  DollarSign, 
  Dumbbell, 
  MessageSquare, 
  Settings, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  LogOut,
  User,
  Target,
  CheckCircle2,
  Bot,
  Sparkles,
  Activity,
  Timer,
  ListTodo,
  Bookmark,
  BarChart3,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Brain,
  LineChart,
  Cog,
  Star,
  Compass
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
  indented?: boolean;
}

interface NavGroupProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function NavItem({ href, icon, label, isActive, onClick, indented = false }: NavItemProps) {
  return (
    <Link 
      href={href} 
      className={cn(
        "group relative flex items-center p-2 text-sm rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700",
        isActive ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" : "text-gray-700 dark:text-gray-300",
        indented && "ml-3 pl-6"
      )}
      onClick={onClick}
    >
      <div className={cn(
        "flex min-w-5 h-5 items-center justify-center mr-3",
        isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
      )}>
        {icon}
      </div>
      <span className="truncate">{label}</span>
      {isActive && (
        <div className="absolute inset-y-0 left-0 w-1 bg-indigo-600 dark:bg-indigo-400 rounded-r-full" />
      )}
    </Link>
  );
}

function NavGroup({ title, icon, children, defaultOpen = false }: NavGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="mb-2">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <div className="flex items-center">
          <div className="flex min-w-5 h-5 items-center justify-center mr-3 text-gray-500 dark:text-gray-400">
            {icon}
          </div>
          <span className="font-medium">{title}</span>
        </div>
        <div className="text-gray-500 dark:text-gray-400">
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>
      <div 
        className={cn(
          "mt-1 ml-2 space-y-1 overflow-hidden transition-all duration-200", 
          isOpen ? "max-h-96" : "max-h-0"
        )}
      >
        {children}
      </div>
    </div>
  );
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { sidebarOpen, toggleSidebar, setSidebarOpen, theme, setTheme } = useStore();
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    // Actualizar estado en Zustand
    setTheme(newTheme);
    
    // Actualizar clase en el documento HTML
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    
    // Guardar preferencia en localStorage
    localStorage.setItem('theme', newTheme);
  };

  // Function to check if a path is active
  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') {
      return true;
    }
    return path !== '/dashboard' && pathname.startsWith(path);
  };

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed top-0 left-0 z-40 h-screen transition-all duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          sidebarCollapsed ? "w-16" : "w-64",
          "md:translate-x-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700",
          "flex flex-col"
        )}
      >
        <div className="flex items-center justify-between h-16 px-3 border-b border-gray-200 dark:border-gray-700">
          <Link href="/dashboard" className="flex items-center">
            {!sidebarCollapsed ? (
              <span className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">SoulDream</span>
            ) : (
              <div className="w-8 h-8 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            )}
          </Link>
          <div className="flex">
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-1.5"
              title={sidebarCollapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
            >
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <button 
              onClick={toggleSidebar}
              className="md:hidden text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-1.5"
              title="Cerrar menú"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        
        <div className="h-full px-3 py-4 overflow-y-auto flex flex-col">
          <div className="space-y-1 mb-4">
            <NavItem 
              href="/dashboard" 
              icon={<Home size={18} />}
              label="Dashboard" 
              isActive={isActive('/dashboard')}
            />
          </div>

          {!sidebarCollapsed ? (
            <>
              <NavGroup title="Productividad" icon={<Compass size={18} />} defaultOpen={true}>
                <NavItem 
                  href="/dashboard/tasks" 
                  icon={<CheckSquare size={18} />}
                  label="Tareas" 
                  isActive={isActive('/dashboard/tasks')}
                  indented
                />
                <NavItem 
                  href="/dashboard/goals" 
                  icon={<Target size={18} />}
                  label="Metas" 
                  isActive={isActive('/dashboard/goals')}
                  indented
                />
                <NavItem 
                  href="/dashboard/calendar" 
                  icon={<Calendar size={18} />}
                  label="Calendario" 
                  isActive={isActive('/dashboard/calendar')}
                  indented
                />
              </NavGroup>

              <NavGroup title="Bienestar" icon={<Star size={18} />} defaultOpen={true}>
                <NavItem 
                  href="/dashboard/habits" 
                  icon={<CheckCircle2 size={18} />}
                  label="Hábitos" 
                  isActive={isActive('/dashboard/habits')}
                  indented
                />
                <NavItem 
                  href="/dashboard/workout" 
                  icon={<Dumbbell size={18} />}
                  label="Workout" 
                  isActive={isActive('/dashboard/workout')}
                  indented
                />
              </NavGroup>

              <NavGroup title="Finanzas" icon={<DollarSign size={18} />} defaultOpen={true}>
                <NavItem 
                  href="/dashboard/finance" 
                  icon={<DollarSign size={18} />}
                  label="Finanzas" 
                  isActive={isActive('/dashboard/finance')}
                  indented
                />
              </NavGroup>

              <NavGroup title="Inteligencia" icon={<Brain size={18} />} defaultOpen={true}>
                <NavItem 
                  href="/dashboard/ai-assistant" 
                  icon={<MessageSquare size={18} />}
                  label="Asistente IA" 
                  isActive={isActive('/dashboard/ai-assistant')}
                  indented
                />
                <NavItem 
                  href="/dashboard/analytics" 
                  icon={<LineChart size={18} />}
                  label="Analítica" 
                  isActive={isActive('/dashboard/analytics')}
                  indented
                />
              </NavGroup>
            </>
          ) : (
            // Collapsed sidebar view shows only icons
            <>
              <div className="space-y-1 mb-4">
                <NavItem 
                  href="/dashboard/tasks" 
                  icon={<CheckSquare size={18} />}
                  label="Tareas" 
                  isActive={isActive('/dashboard/tasks')}
                />
                <NavItem 
                  href="/dashboard/goals" 
                  icon={<Target size={18} />}
                  label="Metas" 
                  isActive={isActive('/dashboard/goals')}
                />
                <NavItem 
                  href="/dashboard/calendar" 
                  icon={<Calendar size={18} />}
                  label="Calendario" 
                  isActive={isActive('/dashboard/calendar')}
                />
                <NavItem 
                  href="/dashboard/habits" 
                  icon={<CheckCircle2 size={18} />}
                  label="Hábitos" 
                  isActive={isActive('/dashboard/habits')}
                />
                <NavItem 
                  href="/dashboard/workout" 
                  icon={<Dumbbell size={18} />}
                  label="Workout" 
                  isActive={isActive('/dashboard/workout')}
                />
                <NavItem 
                  href="/dashboard/finance" 
                  icon={<DollarSign size={18} />}
                  label="Finanzas" 
                  isActive={isActive('/dashboard/finance')}
                />
                <NavItem 
                  href="/dashboard/ai-assistant" 
                  icon={<MessageSquare size={18} />}
                  label="Asistente IA" 
                  isActive={isActive('/dashboard/ai-assistant')}
                />
                <NavItem 
                  href="/dashboard/analytics" 
                  icon={<LineChart size={18} />}
                  label="Analítica" 
                  isActive={isActive('/dashboard/analytics')}
                />
              </div>
            </>
          )}
          
          <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700 space-y-1">
            <NavItem 
              href="/dashboard/profile" 
              icon={<User size={18} />}
              label="Mi Perfil" 
              isActive={isActive('/dashboard/profile')}
            />
            <button 
              onClick={toggleTheme}
              className={cn(
                "w-full group relative flex items-center p-2 text-sm rounded-lg transition-all duration-200",
                "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
              title={theme === 'light' ? "Activar modo oscuro" : "Activar modo claro"}
            >
              <div className="flex min-w-5 h-5 items-center justify-center mr-3 text-gray-500 dark:text-gray-400">
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </div>
              {!sidebarCollapsed && (
                <span>{theme === 'light' ? 'Modo oscuro' : 'Modo claro'}</span>
              )}
            </button>
            <button 
              onClick={signOut}
              className={cn(
                "w-full group relative flex items-center p-2 text-sm rounded-lg transition-all duration-200",
                "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
              title="Cerrar sesión"
            >
              <div className="flex min-w-5 h-5 items-center justify-center mr-3 text-gray-500 dark:text-gray-400">
                <LogOut size={18} />
              </div>
              {!sidebarCollapsed && (
                <span>Cerrar sesión</span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn(
        "flex flex-col flex-1",
        sidebarCollapsed ? "md:ml-16" : "md:ml-64"
      )}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3 flex justify-between items-center">
            <div className="flex items-center">
              <button 
                onClick={toggleSidebar}
                className="md:hidden text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 mr-2"
                title="Abrir menú"
              >
                <Menu size={20} />
              </button>
              {/* Current page title could go here */}
            </div>
            
            <div className="flex items-center">
              {user && (
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden md:block">
                    {user.email}
                  </div>
                  <Link href="/dashboard/profile">
                    <div className="relative w-8 h-8 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600 cursor-pointer hover:ring-2 hover:ring-indigo-500" title="Mi perfil">
                      <svg className="absolute w-10 h-10 text-gray-400 -left-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                      </svg>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>
        
        {/* Content */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
} 