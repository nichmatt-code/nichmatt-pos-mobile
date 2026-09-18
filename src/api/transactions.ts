import { apiFetch } from './client';
import { PaymentMethod, Transaction } from '../types';

export interface CheckoutPayload {
  items: { product_id: number; qty: number; note?: string; price?: number }[];
  payment_method: PaymentMethod;
  /** Wajib diisi kalau payment_method === 'cash', diabaikan server untuk metode lain. */
  paid_amount?: number;
  /** Diisi kalau kasir memilih pelanggan/member yang sudah ada dari pencarian. */
  customer_id?: number;
  /** Nama pelanggan bebas (dipakai kalau tidak memilih dari pencarian). */
  customer_name?: string;
  note?: string;
  /**
   * Cuma kode-nya yang dikirim, BUKAN nominal diskonnya - server selalu
   * menghitung ulang diskon kupon sendiri dari kode ini saat checkout.
   */
  coupon_code?: string;
  /** Diisi kalau transaksi ini berasal dari kode self order yang sudah diklaim. */
  self_order_id?: number;
}

interface ApiSingle<T> {
  data: T;
}

/**
 * Kirim keranjang belanja ke server untuk dijadikan transaksi resmi.
 * PENTING: kita cuma mengirim product_id + qty, TIDAK mengirim harga.
 * Harga selalu dihitung ulang oleh server dari data produk yang sebenarnya,
 * supaya aplikasi mobile tidak bisa "dibohongi" untuk kirim harga sendiri.
 */
export async function checkout(payload: CheckoutPayload): Promise<Transaction> {
  const result = await apiFetch<ApiSingle<Transaction>>('/transactions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return result.data;
}

/** Ambil detail lengkap satu transaksi (item + receipt_lines) dari riwayat. */
export async function getTransaction(id: number): Promise<Transaction> {
  const result = await apiFetch<ApiSingle<Transaction>>(`/transactions/${id}`);

  return result.data;
}
