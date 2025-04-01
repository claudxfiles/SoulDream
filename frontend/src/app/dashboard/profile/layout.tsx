import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Perfil | SoulDream',
  description: 'Gestiona tu perfil y detalles de suscripción',
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 