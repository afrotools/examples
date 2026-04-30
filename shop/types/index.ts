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
  phone?: string; // required for Djomy
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

// LengoPay create_payment response
export interface LengoPayCreateResponse {
  status: string;
  pay_id: string;
  payment_url: string;
}

// LengoPay verify_payment response — POST /api/v1/transaction/status (v1.2.0+)
// status is UPPERCASE strict: "SUCCESS" | "FAILED" | "PENDING"
export interface LengoPayVerifyResponse {
  pay_id: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
  amount: number;
  date: string;
}

export interface LengoPayError {
  message: string;
}

// Djomy create_payment_gateway response data
export interface DjomyCreateGatewayData {
  transactionId: string;
  status: string;
  paidAmount: number;
  paymentMethod: string;
  merchantPaymentReference?: string;
  redirectUrl: string;
  paymentUrl?: string;
  allowedPaymentMethods: string[];
  createdAt: string;
  metadata: Record<string, unknown>;
}

// Djomy verify_payment response data
// status === "SUCCESS" is the ONLY safe condition to fulfill an order
export interface DjomyVerifyData {
  transactionId: string;
  status: "CREATED" | "PENDING" | "FAILED" | "SUCCESS" | "REDIRECTED" | "CANCELLED" | "TIMEOUT" | "REFUNDED";
  paidAmount: number;
  receivedAmount: number; // amount after Djomy fees — use for accounting
  fees: number;
  paymentMethod: string;
  payerIdentifier: string;
  currency: string; // Djomy non-ISO strings: "GNF" | "FCFA" | "Dollar" | "Leones"
  merchantPaymentReference: string;
  createdAt: string;
  providerReference: string;
  allowedPaymentMethods: string[];
  metadata: Record<string, unknown>;
}

// Djomy webhook payload — POSTed to your callback_url on each lifecycle event
export interface DjomyWebhookPayload {
  eventType: "payment.created" | "payment.pending" | "payment.success" | "payment.failed";
  eventId: string;
  message: string;
  data: Record<string, unknown>;
  paymentLinkReference?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// Webhook payload — LengoPay POSTs this to callback_url
export interface LengoPayWebhookPayload {
  pay_id: string;
  status: "SUCCESS" | "FAILED";
  amount: number;
  message: string;
  Client?: string; // phone number of payer — may be absent
  metadata?: Record<string, unknown>;
}
