import { ReactNode } from 'react';

export interface FormFieldProps {
  control: any;
  name: string;
  render: (props: { field: any }) => ReactNode;
}

export interface FormProps {
  children: ReactNode;
  onSubmit?: (data: any) => void;
}

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export interface ButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface InputProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export interface SelectProps {
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  children: ReactNode;
}

export interface TextareaProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
}

export interface CalendarProps {
  mode?: 'single' | 'multiple' | 'range';
  selected?: Date | Date[] | { from: Date; to: Date };
  onSelect?: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  initialFocus?: boolean;
} 