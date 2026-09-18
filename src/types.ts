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
  self_order_url: string;
  /** Kalau true, kasir boleh mengubah harga per baris keranjang secara manual. */
  allow_price_edit: boolean;
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
  note: string;
  /**
   * Harga yang BENAR-BENAR dipakai untuk baris ini - mulai dari harga
   * produk aslinya, tapi bisa diubah manual kalau toko mengizinkan
   * (`store.allow_price_edit`). Dipisah dari `product.price` supaya
   * harga asli produk tidak pernah ikut berubah di data produknya.
   */
  price: number;
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

/** Hasil klaim kode self order - siap digabung ke keranjang kasir. */
export interface SelfOrderClaim {
  self_order_id: number;
  code: string;
  customer_name: string | null;
  note: string | null;
  items: {
    product_id: number;
    name: string;
    price: number;
    qty: number;
    note: string;
  }[];
  /** Nama menu yang dilewati karena sudah tidak tersedia (mis. stok habis). */
  skipped: string[];
}

/** Hasil cek kupon - dipakai buat pratinjau, nilai aslinya dihitung ulang di server saat checkout. */
export interface CouponCheckResult {
  code: string;
  name: string;
  discount_amount: number;
  has_gift: boolean;
  gift_product_name: string | null;
  gift_qty: number | null;
}

/** Pratinjau bill sebelum pembayaran benar-benar dikonfirmasi. */
export interface BillPreview {
  subtotal: number;
  discount: number;
  coupon_discount_amount: number;
  service_charge_amount: number;
  tax_amount: number;
  total: number;
  receipt_lines: string[];
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
  receipt_lines: string[];
}
