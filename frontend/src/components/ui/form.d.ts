import * as React from 'react';
import { ControllerProps, FieldValues, Path } from 'react-hook-form';

export interface FormProps<TFieldValues extends FieldValues = FieldValues>
  extends React.HTMLAttributes<HTMLFormElement> {
  form: TFieldValues;
}

export interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>
> extends Omit<ControllerProps<TFieldValues, TName>, 'render'> {
  render: (props: {
    field: {
      onChange: (...event: any[]) => void;
      onBlur: () => void;
      value: any;
      name: string;
      ref: React.Ref<any>;
    };
  }) => React.ReactElement;
}

export interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export interface FormControlProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export interface FormDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

declare const Form: React.FC<FormProps>;
declare const FormField: <
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>
>(
  props: FormFieldProps<TFieldValues, TName>
) => React.ReactElement;
declare const FormItem: React.FC<FormItemProps>;
declare const FormLabel: React.FC<FormLabelProps>;
declare const FormControl: React.FC<FormControlProps>;
declare const FormMessage: React.FC<FormMessageProps>;
declare const FormDescription: React.FC<FormDescriptionProps>;

export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
}; 