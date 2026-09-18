import { apiFetch } from './client';
import { SelfOrderClaim } from '../types';

interface ApiSingle<T> {
  data: T;
}

/**
 * Klaim kode self order pelanggan (6 karakter) supaya bisa digabung ke
 * keranjang kasir untuk dibayar. Kode cuma bisa diklaim SEKALI - begitu
 * berhasil, server langsung menandainya "sudah diambil" supaya kasir lain
 * tidak bisa mengambil kode yang sama.
 */
export async function claimSelfOrder(code: string): Promise<SelfOrderClaim> {
  const result = await apiFetch<ApiSingle<SelfOrderClaim>>('/self-orders/claim', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });

  return result.data;
}
