'use client';

import { Suspense } from 'react';
import LoginContent from '@/components/auth/LoginContent';
import { LoadingSpinner } from '@/components/ui/loading';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LoginContent />
    </Suspense>
  );
} 