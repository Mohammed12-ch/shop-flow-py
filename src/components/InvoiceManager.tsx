import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { getProducts, getInvoices, addInvoice, exportToCSV } from '@/lib/storage';
import { Product, Invoice, InvoiceItem } from '@/types';
import { Plus, Download, Search, Trash2, ShoppingCart } from 'lucide-react';

const InvoiceManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProducts(getProducts());
    setInvoices(getInvoices());
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setCustomerName('');
    setCustomerEmail('');
    setInvoiceItems([]);
    setSelectedProductId('');
    setQuantity('');
  };

  const addItemToInvoice = () => {
    if (!selectedProductId || !quantity) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un produit et indiquer la quantité",
        variant: "destructive",
      });
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const qty = parseInt(quantity);
    if (qty > product.quantity) {
      toast({
        title: "Erreur",
        description: "Quantité insuffisante en stock",
        variant: "destructive",
      });
      return;
    }

    // Check if product already in invoice
    const existingIndex = invoiceItems.findIndex(item => item.productId === selectedProductId);
    
    if (existingIndex >= 0) {
      const newItems = [...invoiceItems];
      const newQty = newItems[existingIndex].quantity + qty;
      
      if (newQty > product.quantity) {
        toast({
          title: "Erreur",
          description: "Quantité totale insuffisante en stock",
          variant: "destructive",
        });
        return;
      }
      
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        quantity: newQty,
        total: newQty * product.price,
      };
      setInvoiceItems(newItems);
    } else {
      const newItem: InvoiceItem = {
        productId: product.id,
        productName: product.name,
        quantity: qty,
        unitPrice: product.price,
        total: qty * product.price,
      };
      setInvoiceItems([...invoiceItems, newItem]);
    }

    setSelectedProductId('');
    setQuantity('');
  };

  const removeItemFromInvoice = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const calculateInvoiceTotals = () => {
    const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.2; // 20% TVA
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handleCreateInvoice = () => {
    if (!customerName || invoiceItems.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir le nom du client et ajouter des articles",
        variant: "destructive",
      });
      return;
    }

    const { subtotal, tax, total } = calculateInvoiceTotals();

    try {
      addInvoice({
        customerName,
        customerEmail: customerEmail || undefined,
        items: invoiceItems,
        subtotal,
        tax,
        total,
      });

      toast({
        title: "Succès",
        description: "Facture créée avec succès",
      });

      loadData();
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la création de la facture",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    const exportData = invoices.map(invoice => ({
      id: invoice.id,
      client: invoice.customerName,
      email: invoice.customerEmail || '',
      articles: invoice.items.length,
      sousTotal: invoice.subtotal.toFixed(2),
      tva: invoice.tax.toFixed(2),
      total: invoice.total.toFixed(2),
      date: new Date(invoice.createdAt).toLocaleDateString('fr-FR'),
    }));
    
    exportToCSV(exportData, 'factures.csv');
    toast({
      title: "Succès",
      description: "Factures exportées en CSV",
    });
  };

  const { subtotal, tax, total } = calculateInvoiceTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher une facture..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exporter CSV
          </Button>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Créer Facture
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Créer une nouvelle facture</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerName">Nom du client *</Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nom du client"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerEmail">Email (optionnel)</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="email@exemple.com"
                    />
                  </div>
                </div>

                {/* Add Product Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Ajouter un produit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Sélectionner un produit" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.filter(p => p.quantity > 0).map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - {product.price}€ (Stock: {product.quantity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="Qté"
                        className="w-20"
                      />
                      
                      <Button onClick={addItemToInvoice}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Invoice Items */}
                {invoiceItems.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Articles de la facture</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produit</TableHead>
                            <TableHead className="text-right">Prix unitaire</TableHead>
                            <TableHead className="text-right">Quantité</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoiceItems.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.productName}</TableCell>
                              <TableCell className="text-right">{item.unitPrice.toFixed(2)}€</TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell className="text-right">{item.total.toFixed(2)}€</TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeItemFromInvoice(index)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      
                      <div className="mt-4 space-y-2 border-t pt-4">
                        <div className="flex justify-between">
                          <span>Sous-total:</span>
                          <span>{subtotal.toFixed(2)}€</span>
                        </div>
                        <div className="flex justify-between">
                          <span>TVA (20%):</span>
                          <span>{tax.toFixed(2)}€</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span>Total:</span>
                          <span>{total.toFixed(2)}€</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreateInvoice}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Créer la facture
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Invoices Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Factures ({filteredInvoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Aucune facture trouvée' : 'Aucune facture créée'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Facture</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Articles</TableHead>
                    <TableHead className="text-right">Total HT</TableHead>
                    <TableHead className="text-right">TVA</TableHead>
                    <TableHead className="text-right">Total TTC</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-sm">
                        {invoice.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="font-medium">{invoice.customerName}</TableCell>
                      <TableCell>{invoice.customerEmail || '-'}</TableCell>
                      <TableCell className="text-right">{invoice.items.length}</TableCell>
                      <TableCell className="text-right">{invoice.subtotal.toFixed(2)}€</TableCell>
                      <TableCell className="text-right">{invoice.tax.toFixed(2)}€</TableCell>
                      <TableCell className="text-right font-medium">{invoice.total.toFixed(2)}€</TableCell>
                      <TableCell>
                        {new Date(invoice.createdAt).toLocaleDateString('fr-FR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceManager;