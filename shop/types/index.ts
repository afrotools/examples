export interface Product {
  id: string;
  name: string;
  nameFr: string;
  description: string;
  descriptionFr: string;
  price: number; // integer GNF
  category: string;
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
}

export interface CreatePaymentRequest {
  items: CartItem[];
  customer: CheckoutFormData;
}

// Paycard create_payment response
export interface PaycardCreateResponse {
  code: number;
  error_message: string;
  operation_reference: string;
  payment_amount: number;
  payment_amount_formatted: string;
  payment_description: string;
  payment_url: string;
}

// Paycard verify_payment response — GET /epay/{c}/{ref}/status
// code: 0 = transaction found (NOT necessarily paid — check status field)
export interface PaycardVerifyResponse {
  code: number;
  error_message: string;
  reference: string;
  payment_amount: number;
  payment_amount_formatted: string;
  merchant_name: string;
  status: string; // "success" = paid, "new" = pending — check case-insensitively
  status_description: string | null;
  ecommerce_description: string | null;
  payment_method: string | null;
  payment_method_reference: string | null;
  payment_reference: string | null;
  payment_description: string | null;
  transaction_date: string | null;
}

export interface PaycardError {
  code: number;
  error_message: string;
}

// Webhook payload (server-to-server POST, only when paycard-redirect-with-get is off)
export interface PaycardWebhookPayload {
  operation_reference?: string;
  "paycard-operation-reference"?: string;
}
