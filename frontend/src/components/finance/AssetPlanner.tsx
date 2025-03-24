'use client';

import React, { useState } from 'react';
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
  Calendar,
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
import { format, addMonths, addYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Tipos para activos y planes financieros
interface FinancialAsset {
  id?: string;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  category: 'property' | 'vehicle' | 'investment' | 'travel' | 'education' | 'other';
  imageUrl?: string;
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
  const [targetAmount, setTargetAmount] = useState(initialData?.targetAmount?.toString() || '');
  const [currentAmount, setCurrentAmount] = useState(initialData?.currentAmount?.toString() || '0');
  const [targetDate, setTargetDate] = useState<Date>(initialData?.targetDate || addYears(new Date(), 1));
  const [category, setCategory] = useState<'property' | 'vehicle' | 'investment' | 'travel' | 'education' | 'other'>(
    initialData?.category || 'property'
  );
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...initialData,
      title,
      description,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount),
      targetDate,
      category,
      imageUrl
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
                <Label htmlFor="targetAmount">Monto objetivo</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <Input
                    id="targetAmount"
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-8"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currentAmount">Monto actual</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <Input
                    id="currentAmount"
                    type="number"
                    value={currentAmount}
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
                        !targetDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {targetDate ? format(targetDate, "PPP", { locale: es }) : "Selecciona una fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={targetDate}
                      onSelect={(date) => date && setTargetDate(date)}
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
              <Label htmlFor="imageUrl">URL de imagen (opcional)</Label>
              <Input
                id="imageUrl"
                value={imageUrl}
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
  const progress = (asset.currentAmount / asset.targetAmount) * 100;
  const monthsLeft = Math.ceil((asset.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30));
  
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
      {asset.imageUrl && (
        <div className="w-full h-40 overflow-hidden">
          <img 
            src={asset.imageUrl} 
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
              ${asset.currentAmount.toLocaleString()} / ${asset.targetAmount.toLocaleString()}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary"
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-1">
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {format(asset.targetDate, "MMM yyyy", { locale: es })}
              </span>
            </div>
            <span>
              {monthsLeft > 0 
                ? `${monthsLeft} meses restantes` 
                : "¡Fecha alcanzada!"}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-800">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ahorro mensual recomendado:</span>
              <span className="font-medium">
                ${monthsLeft > 0 
                  ? Math.ceil((asset.targetAmount - asset.currentAmount) / monthsLeft).toLocaleString()
                  : 0}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function AssetPlanner() {
  // Estados locales para este ejemplo
  const [assets, setAssets] = useState<FinancialAsset[]>([
    {
      id: '1',
      title: 'Comprar casa',
      description: 'Casa de 3 dormitorios en la zona norte',
      targetAmount: 250000,
      currentAmount: 50000,
      targetDate: addYears(new Date(), 5),
      category: 'property',
      imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=1000&ixlib=rb-4.0.3'
    },
    {
      id: '2',
      title: 'Nuevo auto',
      description: 'SUV familiar',
      targetAmount: 30000,
      currentAmount: 10000,
      targetDate: addYears(new Date(), 2),
      category: 'vehicle',
      imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=1000&ixlib=rb-4.0.3'
    },
    {
      id: '3',
      title: 'Viaje a Japón',
      description: 'Vacaciones de 3 semanas en Japón',
      targetAmount: 8000,
      currentAmount: 3000,
      targetDate: addYears(new Date(), 1),
      category: 'travel',
      imageUrl: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&q=80&w=1000&ixlib=rb-4.0.3'
    }
  ]);

  const [open, setOpen] = useState(false);
  const [currentAsset, setCurrentAsset] = useState<FinancialAsset | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const handleOpenAdd = () => {
    setCurrentAsset(undefined);
    setIsEditing(false);
    setOpen(true);
  };

  const handleOpenEdit = (asset: FinancialAsset) => {
    setCurrentAsset(asset);
    setIsEditing(true);
    setOpen(true);
  };

  const handleSubmit = (asset: FinancialAsset) => {
    if (isEditing && currentAsset?.id) {
      // Actualizar existente
      setAssets(assets.map(a => a.id === currentAsset.id ? { ...asset, id: currentAsset.id } : a));
    } else {
      // Agregar nuevo
      setAssets([...assets, { ...asset, id: Date.now().toString() }]);
    }
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    setAssets(assets.filter(a => a.id !== id));
  };

  const filteredAssets = activeTab === 'all' 
    ? assets 
    : assets.filter(a => a.category === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Planificador de Activos</h2>
          <p className="text-muted-foreground">
            Planifica y visualiza tus metas financieras para adquirir activos
          </p>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo activo
        </Button>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="property">Propiedades</TabsTrigger>
          <TabsTrigger value="vehicle">Vehículos</TabsTrigger>
          <TabsTrigger value="investment">Inversiones</TabsTrigger>
          <TabsTrigger value="travel">Viajes</TabsTrigger>
          <TabsTrigger value="education">Educación</TabsTrigger>
          <TabsTrigger value="other">Otros</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssets.map(asset => (
              <AssetCard 
                key={asset.id} 
                asset={asset} 
                onEdit={handleOpenEdit} 
                onDelete={handleDelete}
              />
            ))}

            {filteredAssets.length === 0 && (
              <div className="col-span-full p-8 text-center">
                <p className="text-muted-foreground">No hay activos planificados en esta categoría.</p>
                <Button variant="outline" onClick={handleOpenAdd} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" /> Agregar activo
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AssetForm
        open={open}
        onOpenChange={setOpen}
        onSubmit={handleSubmit}
        initialData={currentAsset}
        isEditing={isEditing}
      />
    </div>
  );
} 