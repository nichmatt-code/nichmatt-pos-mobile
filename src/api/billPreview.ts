import { apiFetch } from './client';
import { BillPreview } from '../types';

export interface BillPreviewPayload {
  items: { product_id: number; qty: number; note?: string; price?: number }[];
  discount?: number;
  coupon_code?: string;
}

interface ApiSingle<T> {
  data: T;
}

/**
 * Hitung total bill dari keranjang saat ini TANPA benar-benar membuat
 * transaksi - buat "Cetak Bill" (bill sementara, belum dibayar) yang
 * ditunjukkan ke pelanggan sebelum kasir konfirmasi pembayaran.
 *
 * `receipt_lines` adalah teks struk siap-cetak (format yang sama dengan
 * yang dikirim ke printer thermal Bluetooth di versi web) - aplikasi
 * mobile ini belum bisa mencetak ke printer Bluetooth beneran (butuh
 * modul native yang tidak didukung Expo Go), jadi untuk sekarang cuma
 * ditampilkan sebagai teks di layar.
 */
export async function previewBill(payload: BillPreviewPayload): Promise<BillPreview> {
  const result = await apiFetch<ApiSingle<BillPreview>>('/bill-preview', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return result.data;
}
