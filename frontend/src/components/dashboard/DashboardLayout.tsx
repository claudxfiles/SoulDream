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
  Compass,
  Bell
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
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed top-0 left-0 z-40 h-screen transition-transform duration-300 ease-in-out",
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

      {/* Main Content */}
      <main 
        className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "md:ml-16" : "md:ml-64",
          "min-h-screen"
        )}
      >
        {/* Page Content */}
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
} 