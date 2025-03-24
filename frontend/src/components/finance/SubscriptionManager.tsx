import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface Subscription {
  id: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'annual';
  nextBillingDate: Date;
  category: string;
  status: 'active' | 'cancelled' | 'pending';
  autoRenewal: boolean;
  paymentMethod: string;
}

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
    billingCycle: initialData?.billingCycle || 'monthly',
    nextBillingDate: initialData?.nextBillingDate || new Date(),
    category: initialData?.category || CATEGORIES[0],
    status: initialData?.status || 'active',
    autoRenewal: initialData?.autoRenewal || true,
    paymentMethod: initialData?.paymentMethod || PAYMENT_METHODS[0],
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
          <Label htmlFor="billingCycle">Ciclo de Facturación</Label>
          <Select
            value={formData.billingCycle}
            onValueChange={(value: 'monthly' | 'annual') => 
              setFormData({ ...formData, billingCycle: value })}
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
          checked={formData.autoRenewal}
          onCheckedChange={(checked) => setFormData({ ...formData, autoRenewal: checked })}
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
              {subscription.billingCycle === 'monthly' ? 'Mensual' : 'Anual'}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            Próximo cobro: {format(subscription.nextBillingDate, 'dd/MM/yyyy')}
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
              onClick={() => onToggleStatus(subscription.id)}
            >
              {subscription.status === 'active' ? 
                <X className="h-4 w-4" /> : 
                <Check className="h-4 w-4" />
              }
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(subscription.id)}
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

  const filteredSubscriptions = subscriptions
    .filter((sub) => {
      const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || sub.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'amount') {
        return b.amount - a.amount;
      }
      return b.nextBillingDate.getTime() - a.nextBillingDate.getTime();
    });

  const totalMonthly = filteredSubscriptions
    .filter(sub => sub.status === 'active')
    .reduce((acc, sub) => {
      if (sub.billingCycle === 'monthly') {
        return acc + sub.amount;
      }
      return acc + (sub.amount / 12);
    }, 0);

  const handleAddSubscription = (newSubscription: Omit<Subscription, 'id'>) => {
    const subscription: Subscription = {
      ...newSubscription,
      id: Math.random().toString(36).substr(2, 9),
    };
    setSubscriptions([...subscriptions, subscription]);
  };

  const handleEditSubscription = (updatedSubscription: Subscription) => {
    setSubscriptions(subscriptions.map(sub =>
      sub.id === updatedSubscription.id ? updatedSubscription : sub
    ));
    setEditingSubscription(null);
  };

  const handleDeleteSubscription = (id: string) => {
    setSubscriptions(subscriptions.filter(sub => sub.id !== id));
  };

  const handleToggleStatus = (id: string) => {
    setSubscriptions(subscriptions.map(sub =>
      sub.id === id
        ? { ...sub, status: sub.status === 'active' ? 'cancelled' : 'active' }
        : sub
    ));
  };

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