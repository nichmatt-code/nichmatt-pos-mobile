import { apiFetch } from './client';
import { LossRecord } from '../types';

export interface LossRecordPayload {
  items: { product_id: number; qty: number }[];
  reason: string;
}

interface ApiSingle<T> {
  data: T;
}

/**
 * Catat produk yang rusak/hilang/kadaluarsa - stoknya berkurang TANPA
 * dianggap terjual. Harga modal (cost_price) selalu dihitung server dari
 * data produk asli, aplikasi ini cuma kirim product_id + qty.
 */
export async function submitLossRecord(payload: LossRecordPayload): Promise<LossRecord> {
  const result = await apiFetch<ApiSingle<LossRecord>>('/loss-records', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return result.data;
}
