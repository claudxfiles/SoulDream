"use client";

import { LandingButton } from '@/components/landing/LandingButton';

export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Button Test Page</h1>
      
      <div className="space-y-4">
        <LandingButton href="/auth/register" variant="primary">
          Registrarse
        </LandingButton>
        
        <LandingButton href="#features" variant="outline">
          Ver funcionalidades
        </LandingButton>
      </div>
    </div>
  );
} 