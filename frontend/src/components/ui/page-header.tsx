import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
}

export function PageHeader({ title, description, icon }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {icon}
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      </div>
      {description && (
        <p className="text-muted-foreground">{description}</p>
      )}
    </div>
  );
} 