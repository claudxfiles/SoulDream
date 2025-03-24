'use client';

import React, { useState } from 'react';
import { useFinance } from '@/hooks/useFinance';
import { Transaction, incomeCategories, expenseCategories } from '@/lib/finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  PlusCircle,
  DollarSign,
  Calendar as CalendarIcon,
  Filter,
  MoreVertical,
  PieChart,
  TrendingUp,
  TrendingDown,
  Edit,
  Trash2,
} from 'lucide-react';

// Componente para mostrar una transacción individual
const TransactionItem = ({ 
  transaction, 
  onEdit, 
  onDelete 
}: { 
  transaction: Transaction; 
  onEdit: (transaction: Transaction) => void; 
  onDelete: (id: string) => void;
}) => {
  const isIncome = transaction.type === 'income';
  
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'alimentación':
      case 'comida':
        return '🍔';
      case 'transporte':
        return '🚗';
      case 'entretenimiento':
        return '🎬';
      case 'salud':
        return '🏥';
      case 'vivienda':
      case 'hogar':
        return '🏠';
      case 'educación':
        return '📚';
      case 'salario':
        return '💼';
      case 'inversiones':
        return '📈';
      case 'ropa':
        return '👕';
      case 'servicios':
        return '💡';
      case 'regalos':
        return '🎁';
      default:
        return isIncome ? '💰' : '💸';
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
      <div className="flex items-center flex-1">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 mr-3">
          <span className="text-lg">{getCategoryIcon(transaction.category)}</span>
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-900 dark:text-white">{transaction.description}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {transaction.category} • {format(new Date(transaction.date), 'dd MMM yyyy', { locale: es })}
          </p>
        </div>
      </div>
      <div className="flex items-center">
        <span className={`font-medium mr-4 ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {isIncome ? '+' : '-'}${transaction.amount.toFixed(2)}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(transaction)}>
              <Edit className="mr-2 h-4 w-4" />
              <span>Editar</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(transaction.id!)} 
              className="text-red-600 dark:text-red-400"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Eliminar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

// Componente para crear/editar transacciones
interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Transaction;
  onSubmit: (data: Transaction) => Promise<void>;
  isEditing: boolean;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  isEditing
}) => {
  const [date, setDate] = useState<Date>(
    initialData ? new Date(initialData.date) : new Date()
  );
  const [type, setType] = useState<'income' | 'expense'>(
    initialData?.type || 'expense'
  );
  const [amount, setAmount] = useState<string>(
    initialData?.amount ? initialData.amount.toString() : ''
  );
  const [description, setDescription] = useState<string>(
    initialData?.description || ''
  );
  const [category, setCategory] = useState<string>(
    initialData?.category || ''
  );
  const [paymentMethod, setPaymentMethod] = useState<string>(
    initialData?.payment_method || ''
  );
  
  const resetForm = () => {
    setDate(new Date());
    setType('expense');
    setAmount('');
    setDescription('');
    setCategory('');
    setPaymentMethod('');
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData: Transaction = {
      ...initialData,
      type,
      amount: parseFloat(amount),
      description,
      category,
      date: date.toISOString(),
      payment_method: paymentMethod || undefined
    };
    
    await onSubmit(formData);
    if (!isEditing) {
      resetForm();
    }
  };
  
  const categories = type === 'income' ? incomeCategories : expenseCategories;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar transacción' : 'Nueva transacción'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Actualiza los detalles de la transacción.' 
              : 'Agrega una nueva transacción a tu registro financiero.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as 'income' | 'expense')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Ingreso</SelectItem>
                  <SelectItem value="expense">Gasto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-7"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción de la transacción"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select
                value={category}
                onValueChange={setCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP', { locale: es }) : "Selecciona una fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Método de pago</Label>
              <Select
                value={paymentMethod}
                onValueChange={setPaymentMethod}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un método de pago (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Efectivo">Efectivo</SelectItem>
                  <SelectItem value="Tarjeta de crédito">Tarjeta de crédito</SelectItem>
                  <SelectItem value="Tarjeta de débito">Tarjeta de débito</SelectItem>
                  <SelectItem value="Transferencia">Transferencia</SelectItem>
                  <SelectItem value="Domiciliación">Domiciliación</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {isEditing ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Componente principal de gestión de transacciones
export function TransactionManager() {
  const {
    transactions,
    loading,
    addTransaction,
    editTransaction,
    removeTransaction,
    updateFilters,
    filters,
    fetchTransactions
  } = useFinance();
  
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | undefined>(undefined);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  // Manejar la creación/edición de transacciones
  const handleSubmitTransaction = async (data: Transaction) => {
    if (isEditing && currentTransaction?.id) {
      await editTransaction(currentTransaction.id, data);
    } else {
      await addTransaction(data);
    }
    
    setIsFormOpen(false);
    setCurrentTransaction(undefined);
    setIsEditing(false);
  };
  
  // Abrir el formulario para editar
  const handleEdit = (transaction: Transaction) => {
    setCurrentTransaction(transaction);
    setIsEditing(true);
    setIsFormOpen(true);
  };
  
  // Abrir el formulario para crear
  const handleAdd = () => {
    setCurrentTransaction(undefined);
    setIsEditing(false);
    setIsFormOpen(true);
  };
  
  // Eliminar una transacción
  const handleDelete = async (id: string) => {
    await removeTransaction(id);
  };
  
  // Aplicar filtros
  const applyFilters = () => {
    updateFilters({
      startDate: startDate ? startDate.toISOString() : '',
      endDate: endDate ? endDate.toISOString() : '',
      type: activeTab === 'all' ? '' : activeTab
    });
    setIsFilterOpen(false);
  };
  
  // Limpiar filtros
  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    updateFilters({
      startDate: '',
      endDate: '',
      type: activeTab === 'all' ? '' : activeTab
    });
    setIsFilterOpen(false);
  };
  
  // Filtrar transacciones por tipo
  const displayedTransactions = transactions.filter(transaction => {
    if (activeTab === 'all') return true;
    return transaction.type === activeTab;
  });
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Transacciones</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => setIsFilterOpen(true)}>
            <Filter className="h-4 w-4 mr-2" />
            Filtrar
          </Button>
          <Button onClick={handleAdd}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Nueva transacción
          </Button>
        </div>
      </div>
      
      <Tabs 
        defaultValue="all" 
        value={activeTab} 
        onValueChange={(value) => {
          setActiveTab(value);
          updateFilters({ type: value === 'all' ? '' : value });
        }}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="income">Ingresos</TabsTrigger>
          <TabsTrigger value="expense">Gastos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {loading.transactions ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : displayedTransactions.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {displayedTransactions.map(transaction => (
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <p className="text-gray-500 dark:text-gray-400 mb-2">No hay transacciones registradas</p>
                  <Button variant="outline" onClick={handleAdd}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Agregar una transacción
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="income" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {loading.transactions ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : displayedTransactions.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {displayedTransactions.map(transaction => (
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <p className="text-gray-500 dark:text-gray-400 mb-2">No hay ingresos registrados</p>
                  <Button variant="outline" onClick={handleAdd}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Agregar un ingreso
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="expense" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {loading.transactions ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : displayedTransactions.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {displayedTransactions.map(transaction => (
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <p className="text-gray-500 dark:text-gray-400 mb-2">No hay gastos registrados</p>
                  <Button variant="outline" onClick={handleAdd}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Agregar un gasto
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Formulario para crear/editar transacciones */}
      <TransactionForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialData={currentTransaction}
        onSubmit={handleSubmitTransaction}
        isEditing={isEditing}
      />
      
      {/* Diálogo de filtros */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Filtrar transacciones</DialogTitle>
            <DialogDescription>
              Selecciona los filtros para las transacciones.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Rango de fechas</Label>
              <div className="flex space-x-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="startDate">Desde</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="startDate"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'P', { locale: es }) : "Fecha inicial"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="endDate">Hasta</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="endDate"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'P', { locale: es }) : "Fecha final"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={clearFilters}>
              Limpiar filtros
            </Button>
            <Button onClick={applyFilters}>
              Aplicar filtros
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 