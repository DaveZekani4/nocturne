export type TicketTier = {
  id: string;
  name: string; // "Early Bird", "General Admission", "Pay at Entry"
  slug: string;
  description: string | null;
  price: number; // kobo
  total_quantity: number; // admin-editable
  quantity_sold: number;
  is_active: boolean;
  online_checkout_enabled: boolean; // false = gate-only, no stepper/checkout
  sort_order: number;
  created_at: string;
};

export type OrderStatus = "pending" | "success" | "failed";

export type OrderLineItem = {
  tier_id: string;
  tier_name: string;
  quantity: number;
  unit_price: number; // kobo
};

export type Order = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  items: OrderLineItem[];
  amount: number; // kobo, total
  paystack_ref: string;
  status: OrderStatus;
  checked_in: boolean;
  created_at: string;
};

export type MerchProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number; // kobo
  sizes: string[];
  image_urls: string[];
  stock_quantity: number;
  stock_sold: number;
  is_active: boolean;
  created_at: string;
};

export type CartItem = {
  product_id: string;
  name: string;
  price: number;
  size: string | null;
  quantity: number;
  image_url: string | null;
};

export type MerchOrderStatus = "pending" | "success" | "failed";
export type FulfillmentStatus = "pending" | "fulfilled";

export type MerchOrder = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  cart_items: CartItem[];
  amount: number;
  paystack_ref: string;
  status: MerchOrderStatus;
  fulfillment_status: FulfillmentStatus;
  created_at: string;
};

export type TicketPass = {
  id: string;
  order_id: string;
  tier_id: string | null;
  tier_name: string;
  code: string;
  full_name: string;
  email: string;
  checked_in: boolean;
  checked_in_at: string | null;
  created_at: string;
};

export type AdminProfile = {
  id: string;
  full_name: string | null;
  created_at: string;
};
