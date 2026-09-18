/**
 * Tipe-tipe data (TypeScript types) di file ini SENGAJA dibuat sama persis
 * dengan bentuk JSON yang dikirim balik oleh API Laravel (lihat
 * app/Http/Resources/*.php di project NichmattPOSWeb).
 *
 * Kalau di Laravel field-nya berubah nama atau tipe, cukup ubah di sini
 * juga - nanti TypeScript otomatis kasih tahu (garis merah) di semua
 * tempat yang perlu ikut disesuaikan.
 */

export interface Store {
  id: number;
  name: string;
  has_access: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  store: Store;
}

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  category_id: number | null;
  name: string;
  description: string | null;
  sku: string | null;
  barcode: string | null;
  price: number;
  stock_qty: number;
  unit: string | null;
  image_url: string | null;
  is_unlimited_stock: boolean;
  is_available: boolean;
}

/** Satu baris di keranjang belanja kasir: produk + berapa banyak dibeli. */
export interface CartItem {
  product: Product;
  qty: number;
}

export type PaymentMethod = 'cash' | 'qris' | 'kartu';

export interface TransactionItem {
  product_id: number;
  package_id: number | null;
  product_name: string;
  price: number;
  qty: number;
  note: string | null;
  subtotal: number;
}

/** Struk transaksi yang dibalikin server setelah checkout berhasil. */
export interface Transaction {
  id: number;
  transaction_no: string;
  customer_name: string | null;
  note: string | null;
  subtotal: number;
  discount: number;
  coupon_discount_amount: number;
  tax_amount: number;
  service_charge_amount: number;
  total: number;
  payment_method: PaymentMethod;
  paid_amount: number;
  change_amount: number;
  status: string;
  created_at: string;
  items: TransactionItem[];
}
