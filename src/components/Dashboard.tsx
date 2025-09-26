import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getProducts, getInvoices } from '@/lib/storage';
import { Package, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';

const Dashboard = () => {
  const products = getProducts();
  const invoices = getInvoices();

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, product) => sum + product.quantity, 0);
    const lowStockProducts = products.filter(product => product.quantity < 10).length;
    
    const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const totalOrders = invoices.length;
    
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentInvoices = invoices.filter(invoice => 
      new Date(invoice.createdAt) >= thirtyDaysAgo
    );
    const monthlyRevenue = recentInvoices.reduce((sum, invoice) => sum + invoice.total, 0);

    return {
      totalProducts,
      totalStock,
      lowStockProducts,
      totalRevenue,
      totalOrders,
      monthlyRevenue,
    };
  }, [products, invoices]);

  const statsCards = [
    {
      title: 'Produits totaux',
      value: stats.totalProducts,
      icon: Package,
      color: 'text-primary',
    },
    {
      title: 'Stock total',
      value: stats.totalStock,
      icon: TrendingUp,
      color: 'text-success',
    },
    {
      title: 'Commandes',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'text-warning',
    },
    {
      title: 'Chiffre d\'affaires',
      value: `${stats.totalRevenue.toFixed(2)}€`,
      icon: DollarSign,
      color: 'text-accent',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Alertes Stock</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.lowStockProducts > 0 ? (
              <div className="text-warning">
                <p className="font-medium">{stats.lowStockProducts} produit(s) en stock faible</p>
                <p className="text-sm text-muted-foreground">Moins de 10 unités restantes</p>
              </div>
            ) : (
              <div className="text-success">
                <p className="font-medium">Tous les stocks sont corrects</p>
                <p className="text-sm text-muted-foreground">Aucune alerte de stock faible</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Performance Mensuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">CA ce mois</span>
                <span className="font-medium">{stats.monthlyRevenue.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Commandes récentes</span>
                <span className="font-medium">{invoices.filter(i => 
                  new Date(i.createdAt) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                ).length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Products */}
      {products.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Produits Récents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {products.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Stock: {product.quantity} • Prix: {product.price.toFixed(2)}€
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    product.quantity < 10 
                      ? 'bg-warning/10 text-warning' 
                      : 'bg-success/10 text-success'
                  }`}>
                    {product.quantity < 10 ? 'Stock faible' : 'OK'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;