'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Moon, Sun } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type ThemeType = 'light' | 'dark';

export function AppearanceSettings() {
  const { theme, setTheme } = useStore();
  
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-medium">Tema</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Selecciona el modo de visualización que prefieras para la aplicación
        </p>
      </div>
      
      <RadioGroup 
        value={theme} 
        onValueChange={(value) => {
          // Ensure value is a valid theme type
          if (value === 'light' || value === 'dark') {
            setTheme(value);
          }
        }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <ThemeOption 
          value="light" 
          label="Modo claro" 
          description="Interfaz con fondo claro" 
          icon={<Sun className="h-5 w-5" />} 
          currentValue={theme}
        />
        
        <ThemeOption 
          value="dark" 
          label="Modo oscuro" 
          description="Interfaz con fondo oscuro" 
          icon={<Moon className="h-5 w-5" />} 
          currentValue={theme}
        />
      </RadioGroup>
      
      <div className="space-y-1 pt-6">
        <h3 className="text-lg font-medium">Densidad de la interfaz</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Ajusta el espaciado entre elementos
        </p>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <RadioGroup defaultValue="comfortable" className="space-y-3">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="compact" id="density-compact" />
              <Label htmlFor="density-compact">Compacta</Label>
              <p className="text-xs ml-6 text-gray-500 dark:text-gray-400">
                Menor espaciado, más contenido visible
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="comfortable" id="density-comfortable" />
              <Label htmlFor="density-comfortable">Cómoda</Label>
              <p className="text-xs ml-6 text-gray-500 dark:text-gray-400">
                Espaciado equilibrado (recomendado)
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="spacious" id="density-spacious" />
              <Label htmlFor="density-spacious">Espaciosa</Label>
              <p className="text-xs ml-6 text-gray-500 dark:text-gray-400">
                Mayor espaciado, más fácil de leer
              </p>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
      
      <div className="space-y-1 pt-6">
        <h3 className="text-lg font-medium">Fuente</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Selecciona el tamaño de fuente
        </p>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <RadioGroup defaultValue="medium" className="space-y-3">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="small" id="font-small" />
              <Label htmlFor="font-small">Pequeña</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="medium" id="font-medium" />
              <Label htmlFor="font-medium">Mediana</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="large" id="font-large" />
              <Label htmlFor="font-large">Grande</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
      
      <div className="flex justify-end pt-6">
        <Button>Guardar preferencias</Button>
      </div>
    </div>
  );
}

// Componente auxiliar para la opción de tema
function ThemeOption({ 
  value, 
  label, 
  description, 
  icon, 
  currentValue 
}: { 
  value: ThemeType; 
  label: string; 
  description: string; 
  icon: React.ReactNode; 
  currentValue: string;
}) {
  const isSelected = value === currentValue;
  
  return (
    <div className={`
      relative flex flex-col items-center rounded-md border-2 p-4 cursor-pointer
      ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-accent'}
    `}>
      <RadioGroupItem value={value} id={`theme-${value}`} className="sr-only" />
      <Label
        htmlFor={`theme-${value}`}
        className="flex flex-col items-center gap-2 cursor-pointer"
      >
        <div className={`p-2 rounded-full ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
          {icon}
        </div>
        <span className="font-medium text-sm">{label}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {description}
        </span>
      </Label>
    </div>
  );
} 