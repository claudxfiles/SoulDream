import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Calendar,
  CreditCard,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  Search,
  ArrowUpDown,
  Check,
  X,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { 
  getSubscriptions, 
  createSubscription, 
  updateSubscription, 
  deleteSubscription, 
  toggleSubscriptionStatus,
  Subscription
} from '@/services/financeSubscriptions';

const CATEGORIES = [
  'Entretenimiento',
  'Software',
  'Servicios',
  'Streaming',
  'Gimnasio',
  'Educación',
  'Otros'
];

const PAYMENT_METHODS = [
  'Tarjeta de Crédito',
  'Tarjeta de Débito',
  'PayPal',
  'Transferencia Bancaria'
];

const SubscriptionForm: React.FC<{
  onSubmit: (subscription: Omit<Subscription, 'id'>) => void;
  initialData?: Subscription;
  onClose: () => void;
}> = ({ onSubmit, initialData, onClose }) => {
  const [formData, setFormData] = useState<Omit<Subscription, 'id'>>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    amount: initialData?.amount || 0,
    currency: initialData?.currency || 'USD',
    billing_cycle: initialData?.billing_cycle || 'monthly',
    next_billing_date: initialData?.next_billing_date || new Date(),
    category: initialData?.category || CATEGORIES[0],
    status: initialData?.status || 'active',
    auto_renewal: initialData?.auto_renewal || true,
    payment_method: initialData?.payment_method || PAYMENT_METHODS[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Monto</Label>
          <Input
            id="amount"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Categoría</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="billing_cycle">Ciclo de Facturación</Label>
          <Select
            value={formData.billing_cycle}
            onValueChange={(value: 'monthly' | 'annual') => 
              setFormData({ ...formData, billing_cycle: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Mensual</SelectItem>
              <SelectItem value="annual">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.auto_renewal}
          onCheckedChange={(checked) => setFormData({ ...formData, auto_renewal: checked })}
        />
        <Label>Renovación Automática</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" type="button" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
          {initialData ? 'Actualizar' : 'Crear'} Suscripción
        </Button>
      </div>
    </form>
  );
};

const SubscriptionCard: React.FC<{
  subscription: Subscription;
  onEdit: (subscription: Subscription) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}> = ({ subscription, onEdit, onDelete, onToggleStatus }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {subscription.name}
        </CardTitle>
        <Badge variant="outline" className={getStatusColor(subscription.status)}>
          {subscription.status === 'active' ? 'Activa' : 
           subscription.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">
              {formatCurrency(subscription.amount, subscription.currency)}
            </span>
            <span className="text-sm text-muted-foreground">
              {subscription.billing_cycle === 'monthly' ? 'Mensual' : 'Anual'}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            Próximo cobro: {format(new Date(subscription.next_billing_date), 'dd/MM/yyyy')}
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(subscription)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleStatus(subscription.id as string)}
            >
              {subscription.status === 'active' ? 
                <X className="h-4 w-4" /> : 
                <Check className="h-4 w-4" />
              }
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(subscription.id as string)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const SubscriptionManager: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'amount' | 'date'>('amount');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Cargar suscripciones al iniciar
  useEffect(() => {
    const loadSubscriptions = async () => {
      setIsLoading(true);
      try {
        const data = await getSubscriptions();
        setSubscriptions(data);
      } catch (error) {
        console.error('Error loading subscriptions:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las suscripciones',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSubscriptions();
  }, [toast]);

  const filteredSubscriptions = subscriptions
    .filter((sub) => {
      const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sub.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || sub.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'amount') {
        return b.amount - a.amount;
      }
      return new Date(b.next_billing_date).getTime() - new Date(a.next_billing_date).getTime();
    });

  const totalMonthly = filteredSubscriptions
    .filter(sub => sub.status === 'active')
    .reduce((acc, sub) => {
      if (sub.billing_cycle === 'monthly') {
        return acc + sub.amount;
      }
      return acc + (sub.amount / 12);
    }, 0);

  const handleAddSubscription = async (newSubscription: Omit<Subscription, 'id'>) => {
    try {
      const createdSubscription = await createSubscription(newSubscription);
      if (createdSubscription) {
        setSubscriptions([...subscriptions, createdSubscription]);
        toast({
          title: 'Suscripción creada',
          description: 'La suscripción se ha creado exitosamente'
        });
      } else {
        throw new Error('No se pudo crear la suscripción');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la suscripción',
        variant: 'destructive',
      });
    }
  };

  const handleEditSubscription = async (updatedSubscription: Subscription) => {
    try {
      const success = await updateSubscription(
        updatedSubscription.id as string, 
        updatedSubscription
      );
      
      if (success) {
        setSubscriptions(subscriptions.map(sub =>
          sub.id === updatedSubscription.id ? updatedSubscription : sub
        ));
        setEditingSubscription(null);
        toast({
          title: 'Suscripción actualizada',
          description: 'La suscripción se ha actualizado exitosamente'
        });
      } else {
        throw new Error('No se pudo actualizar la suscripción');
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la suscripción',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    try {
      const success = await deleteSubscription(id);
      if (success) {
        setSubscriptions(subscriptions.filter(sub => sub.id !== id));
        toast({
          title: 'Suscripción eliminada',
          description: 'La suscripción se ha eliminado exitosamente'
        });
      } else {
        throw new Error('No se pudo eliminar la suscripción');
      }
    } catch (error) {
      console.error('Error deleting subscription:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la suscripción',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const success = await toggleSubscriptionStatus(id);
      if (success) {
        // Refrescar la lista de suscripciones
        const updatedSubscriptions = await getSubscriptions();
        setSubscriptions(updatedSubscriptions);
        toast({
          title: 'Estado actualizado',
          description: 'El estado de la suscripción se ha actualizado exitosamente'
        });
      } else {
        throw new Error('No se pudo actualizar el estado de la suscripción');
      }
    } catch (error) {
      console.error('Error toggling subscription status:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado de la suscripción',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Gestor de Suscripciones</h2>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Suscripción
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nueva Suscripción</DialogTitle>
            </DialogHeader>
            <SubscriptionForm
              onSubmit={handleAddSubscription}
              onClose={() => setShowAddDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold mb-2">
            Gasto Mensual Total: {new Intl.NumberFormat('es-ES', {
              style: 'currency',
              currency: 'USD'
            }).format(totalMonthly)}
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredSubscriptions.filter(sub => sub.status === 'active').length} suscripciones activas
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 mb-4">
        <div className="flex-1 relative">
          <Input
            placeholder="Buscar suscripciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10"
          />
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        </div>
        <Select
          value={selectedCategory}
          onValueChange={setSelectedCategory}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => setSortBy(sortBy === 'amount' ? 'date' : 'amount')}
        >
          <ArrowUpDown className="mr-2 h-4 w-4" />
          Ordenar por {sortBy === 'amount' ? 'fecha' : 'monto'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSubscriptions.map((subscription) => (
          <SubscriptionCard
            key={subscription.id}
            subscription={subscription}
            onEdit={setEditingSubscription}
            onDelete={handleDeleteSubscription}
            onToggleStatus={handleToggleStatus}
          />
        ))}
      </div>

      {editingSubscription && (
        <Dialog open={!!editingSubscription} onOpenChange={() => setEditingSubscription(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Suscripción</DialogTitle>
              <DialogDescription>
                Actualiza los detalles de tu suscripción recurrente.
              </DialogDescription>
            </DialogHeader>
            <SubscriptionForm
              initialData={editingSubscription}
              onSubmit={(updated) => handleEditSubscription({ ...updated, id: editingSubscription.id })}
              onClose={() => setEditingSubscription(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}; 