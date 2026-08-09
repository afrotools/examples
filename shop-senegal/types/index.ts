export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // integer XOF
  category: string;
  imageUrl: string | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  hydrated: boolean;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

export interface CheckoutFormData {
  name: string;
  email: string;
  phone?: string;
}

export interface CreateOrderRequest {
  items: CartItem[];
  customer: CheckoutFormData;
}

export type PaymentStatus = "pending" | "succeeded" | "failed" | "cancelled";

// Row shape returned by Supabase for the `payments` table.
export interface Payment {
  id: string;
  orderReference: string;
  status: PaymentStatus;
  currency: string;
  amountTotal: number;
  items: Array<{
    productId: string;
    name: string;
    unitPrice: number;
    quantity: number;
  }>;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  provider: string | null;
  providerTransactionId: string | null;
  createdAt: string;
  updatedAt: string;
}
