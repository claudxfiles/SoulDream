import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Calendario | SoulDream',
  description: 'Visualiza y gestiona todos tus eventos en un solo lugar',
};

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 