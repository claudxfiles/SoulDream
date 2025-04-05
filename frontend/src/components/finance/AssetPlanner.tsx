'use client';

import React, { useState, useMemo } from 'react';
import { useFinance } from '@/hooks/useFinance';
import { FinancialGoal } from '@/lib/finance';
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
  DialogFooter,
  DialogDescription,
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
  Home,
  Car,
  Briefcase,
  Gift,
  Target,
  Edit2,
  Trash2,
  Plus,
  ChevronRight,
  DollarSign,
  Calendar as CalendarIcon
} from 'lucide-react';
import { format, addMonths, addYears, differenceInMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';

// Tipos para activos y planes financieros
interface FinancialAsset {
  id?: string;
  title: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date: Date;
  category: 'property' | 'vehicle' | 'investment' | 'travel' | 'education' | 'other';
  image_url?: string;
}

// Componente para formulario de activos
interface AssetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (asset: FinancialAsset) => void;
  initialData?: FinancialAsset;
  isEditing: boolean;
}

const AssetForm: React.FC<AssetFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isEditing
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [target_amount, setTargetAmount] = useState(initialData?.target_amount?.toString() || '');
  const [current_amount, setCurrentAmount] = useState(initialData?.current_amount?.toString() || '0');
  const [target_date, setTargetDate] = useState<Date>(initialData?.target_date || addYears(new Date(), 1));
  const [category, setCategory] = useState<'property' | 'vehicle' | 'investment' | 'travel' | 'education' | 'other'>(
    initialData?.category || 'property'
  );
  const [image_url, setImageUrl] = useState(initialData?.image_url || '');

  // Efecto para limpiar el formulario cuando se abre para crear uno nuevo
  React.useEffect(() => {
    if (open && !isEditing) {
      setTitle('');
      setDescription('');
      setTargetAmount('');
      setCurrentAmount('0');
      setTargetDate(addYears(new Date(), 1));
      setCategory('property');
      setImageUrl('');
    } else if (open && isEditing && initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setTargetAmount(initialData.target_amount.toString());
      setCurrentAmount(initialData.current_amount.toString());
      setTargetDate(initialData.target_date);
      setCategory(initialData.category);
      setImageUrl(initialData.image_url || '');
    }
  }, [open, isEditing, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...initialData,
      title,
      description,
      target_amount: parseFloat(target_amount),
      current_amount: parseFloat(current_amount),
      target_date,
      category,
      image_url
    });
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'property':
        return <Home className="w-5 h-5" />;
      case 'vehicle':
        return <Car className="w-5 h-5" />;
      case 'investment':
        return <Briefcase className="w-5 h-5" />;
      case 'travel':
        return <Gift className="w-5 h-5" />;
      case 'education':
        return <Target className="w-5 h-5" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar activo financiero' : 'Nuevo activo financiero'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Actualiza los detalles de tu activo financiero.' : 'Registra un nuevo activo financiero para tu planificación.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Casa propia, Coche, Viaje a Europa"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe brevemente tu meta financiera"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target_amount">Monto objetivo</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <Input
                    id="target_amount"
                    type="number"
                    value={target_amount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-8"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="current_amount">Monto actual</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <Input
                    id="current_amount"
                    type="number"
                    value={current_amount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha objetivo</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !target_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {target_date ? format(target_date, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={target_date}
                      onSelect={(date: Date | undefined) => date && setTargetDate(date)}
                      disabled={(date: Date) =>
                        date < new Date() || date > new Date(new Date().setFullYear(new Date().getFullYear() + 10))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select 
                  value={category} 
                  onValueChange={(value) => setCategory(value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="property">Propiedad</SelectItem>
                    <SelectItem value="vehicle">Vehículo</SelectItem>
                    <SelectItem value="investment">Inversión</SelectItem>
                    <SelectItem value="travel">Viaje</SelectItem>
                    <SelectItem value="education">Educación</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="image_url">URL de imagen (opcional)</Label>
              <Input
                id="image_url"
                value={image_url}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{isEditing ? 'Actualizar' : 'Crear'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Componente para mostrar una tarjeta de activo
const AssetCard: React.FC<{
  asset: FinancialAsset;
  onEdit: (asset: FinancialAsset) => void;
  onDelete: (id: string) => void;
}> = ({ asset, onEdit, onDelete }) => {
  const progress = (asset.current_amount / asset.target_amount) * 100;
  const monthsRemaining = differenceInMonths(asset.target_date, new Date());
  const yearsRemaining = Math.floor(monthsRemaining / 12);
  const remainingMonths = monthsRemaining % 12;

  const formatTimeRemaining = () => {
    if (yearsRemaining > 0) {
      return `${yearsRemaining} ${yearsRemaining === 1 ? 'año' : 'años'}${
        remainingMonths > 0 ? ` y ${remainingMonths} ${remainingMonths === 1 ? 'mes' : 'meses'}` : ''
      } restantes`;
    }
    return `${monthsRemaining} ${monthsRemaining === 1 ? 'mes restante' : 'meses restantes'}`;
  };

  const monthlySavingsNeeded = useMemo(() => {
    if (monthsRemaining <= 0) return 0;
    return (asset.target_amount - asset.current_amount) / monthsRemaining;
  }, [asset.target_amount, asset.current_amount, monthsRemaining]);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'property':
        return <Home className="w-5 h-5" />;
      case 'vehicle':
        return <Car className="w-5 h-5" />;
      case 'investment':
        return <Briefcase className="w-5 h-5" />;
      case 'travel':
        return <Gift className="w-5 h-5" />;
      case 'education':
        return <Target className="w-5 h-5" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  return (
    <Card className="overflow-hidden">
      {asset.image_url && (
        <div className="w-full h-40 overflow-hidden">
          <img 
            src={asset.image_url} 
            alt={asset.title} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {getCategoryIcon(asset.category)}
            <CardTitle className="text-lg">{asset.title}</CardTitle>
          </div>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onEdit(asset)}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => asset.id && onDelete(asset.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {asset.description && (
          <CardDescription>{asset.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Progreso:</span>
            <span className="text-sm font-medium">
              ${asset.current_amount.toLocaleString()} / ${asset.target_amount.toLocaleString()}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-1">
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {format(asset.target_date, "PPP", { locale: es })}
              </span>
            </div>
            <span>
              {formatTimeRemaining()}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-800">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ahorro mensual recomendado:</span>
              <span className="font-medium">
                ${monthlySavingsNeeded.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function AssetPlanner() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FinancialAsset | null>(null);
  const { financialAssets, addFinancialAsset, editFinancialAsset, removeFinancialAsset, loading, fetchFinancialAssets } = useFinance();
  const [activeTab, setActiveTab] = useState<string>('all');

  const handleOpenAdd = () => {
    setEditingAsset(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (asset: FinancialAsset) => {
    setEditingAsset(asset);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (asset: FinancialAsset) => {
    let success;
    if (editingAsset?.id) {
      success = await editFinancialAsset(editingAsset.id, asset);
    } else {
      success = await addFinancialAsset(asset);
    }
    
    if (success) {
      setIsDialogOpen(false);
      setEditingAsset(null);
      await fetchFinancialAssets();
    }
  };

  const handleDelete = async (id: string) => {
    const success = await removeFinancialAsset(id);
    if (success) {
      await fetchFinancialAssets();
    }
  };

  const filteredAssets = useMemo(() => {
    if (activeTab === 'all') return financialAssets;
    return financialAssets.filter(asset => asset.category === activeTab);
  }, [activeTab, financialAssets]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Planificador de Activos</h2>
        <p className="text-muted-foreground">
          Planifica y visualiza tus metas financieras para adquirir activos
        </p>
      </div>

      <div className="flex justify-between items-center">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="property">Propiedades</TabsTrigger>
            <TabsTrigger value="vehicle">Vehículos</TabsTrigger>
            <TabsTrigger value="investment">Inversiones</TabsTrigger>
            <TabsTrigger value="travel">Viajes</TabsTrigger>
            <TabsTrigger value="education">Educación</TabsTrigger>
            <TabsTrigger value="other">Otros</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button onClick={handleOpenAdd} className="ml-4">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo activo
        </Button>
      </div>

      {loading.assets ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin">
            <ChevronRight className="w-8 h-8" />
          </div>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No hay activos registrados en esta categoría</p>
          <Button onClick={handleOpenAdd} variant="outline" className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Agregar activo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <AssetForm
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleSubmit}
        initialData={editingAsset || undefined}
        isEditing={!!editingAsset}
      />
    </div>
  );
} 