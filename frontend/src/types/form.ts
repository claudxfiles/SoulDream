import { ControllerRenderProps, FieldValues, Path } from 'react-hook-form';

export type FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>
> = {
  field: ControllerRenderProps<TFieldValues, TName>;
}; 