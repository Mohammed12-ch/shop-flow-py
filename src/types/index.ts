export interface Product {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  customerName: string;
  customerEmail?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: Date;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: 'sale' | 'restock' | 'adjustment';
  quantity: number;
  reason?: string;
  createdAt: Date;
}