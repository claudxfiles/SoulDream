"use client";

import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle2 } from 'lucide-react';

// Esquema de validación con Zod
const contactFormSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  email: z.string().email({ message: "Introduce un email válido" }),
  subject: z.string().min(1, { message: "Selecciona un asunto" }),
  message: z.string().min(10, { message: "El mensaje debe tener al menos 10 caracteres" }),
  terms: z.boolean().refine(val => val === true, {
    message: "Debes aceptar los términos y condiciones"
  })
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

// Valores por defecto del formulario
const defaultValues: Partial<ContactFormValues> = {
  name: "",
  email: "",
  subject: "general",
  message: "",
  terms: false,
};

// Componente de mensaje de éxito
const SuccessMessage = ({ onReset }: { onReset: () => void }) => (
  <div className="text-center space-y-4 py-6">
    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
      <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 dark:text-white">¡Mensaje enviado!</h3>
    <p className="text-gray-600 dark:text-gray-400">
      Gracias por contactarnos. Hemos recibido tu mensaje y te responderemos a la brevedad.
    </p>
    <Button onClick={onReset} variant="outline" className="mt-4">
      Enviar otro mensaje
    </Button>
  </div>
);

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues,
  });

  async function onSubmit(data: ContactFormValues) {
    setIsSubmitting(true);
    
    try {
      // Enviar datos al endpoint de la API
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Server error details:', result);
        
        // Use the specific error message from the server if available
        const errorMessage = result.error || 'Error al enviar el mensaje';
        
        if (errorMessage.includes('API key') || errorMessage.includes('configuración')) {
          throw new Error('Error de configuración del servidor. Por favor, contacta al administrador.');
        } else {
          throw new Error(errorMessage);
        }
      }
      
      toast({
        title: "Mensaje enviado",
        description: "Nos pondremos en contacto contigo a la brevedad.",
      });
      
      setIsSuccess(true);
      form.reset();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error al enviar",
        description: error instanceof Error ? error.message : "Hubo un problema al enviar tu mensaje. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleReset = () => {
    setIsSuccess(false);
  };

  if (isSuccess) {
    return <SuccessMessage onReset={handleReset} />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre completo</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Juan Pérez" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo electrónico</FormLabel>
              <FormControl>
                <Input placeholder="correo@ejemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Asunto</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <div className="w-full">
                      <SelectValue placeholder="Selecciona un asunto" />
                    </div>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="general">Consulta general</SelectItem>
                  <SelectItem value="support">Soporte técnico</SelectItem>
                  <SelectItem value="billing">Facturación</SelectItem>
                  <SelectItem value="partnerships">Asociaciones</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mensaje</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Escribe tu mensaje aquí..." 
                  className="min-h-[120px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="terms"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Acepto los términos y condiciones
                </FormLabel>
                <FormDescription>
                  Al enviar este formulario, aceptas nuestra política de privacidad.
                </FormDescription>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Enviando...
            </>
          ) : "Enviar mensaje"}
        </Button>
      </form>
    </Form>
  );
} 