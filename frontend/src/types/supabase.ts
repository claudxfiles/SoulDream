import { Database } from './database.types';

export type Tables = Database['public']['Tables'];
export type TablesInsert = {
  [TableName in keyof Tables]: Tables[TableName]['Insert']
};
export type TablesUpdate = {
  [TableName in keyof Tables]: Tables[TableName]['Update']
};
export type TablesRow = {
  [TableName in keyof Tables]: Tables[TableName]['Row']
};

// Tipado para las funciones de Supabase
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

Need to install the following packages:
  supabase@2.19.7 