import { Product, Invoice, StockMovement } from '@/types';

const STORAGE_KEYS = {
  PRODUCTS: 'inventory_products',
  INVOICES: 'inventory_invoices',
  STOCK_MOVEMENTS: 'inventory_stock_movements',
};

// Products
export const getProducts = (): Product[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
  return stored ? JSON.parse(stored) : [];
};

export const saveProducts = (products: Product[]): void => {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
};

export const addProduct = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
  const products = getProducts();
  const newProduct: Product = {
    ...product,
    id: crypto.randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  products.push(newProduct);
  saveProducts(products);
  return newProduct;
};

export const updateProduct = (id: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>): Product | null => {
  const products = getProducts();
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return null;
  
  products[index] = { ...products[index], ...updates, updatedAt: new Date() };
  saveProducts(products);
  return products[index];
};

export const deleteProduct = (id: string): boolean => {
  const products = getProducts();
  const filtered = products.filter(p => p.id !== id);
  if (filtered.length === products.length) return false;
  
  saveProducts(filtered);
  return true;
};

// Invoices
export const getInvoices = (): Invoice[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.INVOICES);
  return stored ? JSON.parse(stored) : [];
};

export const saveInvoices = (invoices: Invoice[]): void => {
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
};

export const addInvoice = (invoice: Omit<Invoice, 'id' | 'createdAt'>): Invoice => {
  const invoices = getInvoices();
  const newInvoice: Invoice = {
    ...invoice,
    id: crypto.randomUUID(),
    createdAt: new Date(),
  };
  invoices.push(newInvoice);
  saveInvoices(invoices);
  
  // Update stock quantities
  invoice.items.forEach(item => {
    updateProduct(item.productId, { 
      quantity: getProducts().find(p => p.id === item.productId)!.quantity - item.quantity 
    });
  });
  
  return newInvoice;
};

// CSV Export/Import
export const exportToCSV = (data: any[], filename: string): void => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const importFromCSV = (file: File, callback: (data: any[]) => void): void => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const csv = e.target?.result as string;
    const lines = csv.split('\n');
    const headers = lines[0].split(',');
    const data = lines.slice(1).map(line => {
      const values = line.split(',');
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index]?.replace(/"/g, '') || '';
      });
      return obj;
    });
    callback(data);
  };
  reader.readAsText(file);
};