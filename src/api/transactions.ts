import { apiFetch } from './client';
import { PaymentMethod, Transaction } from '../types';

export interface CheckoutPayload {
  items: { product_id: number; qty: number }[];
  payment_method: PaymentMethod;
  /** Wajib diisi kalau payment_method === 'cash', diabaikan server untuk metode lain. */
  paid_amount?: number;
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
