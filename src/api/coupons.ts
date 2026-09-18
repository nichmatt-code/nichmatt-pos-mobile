import { apiFetch } from './client';
import { CouponCheckResult } from '../types';

interface ApiSingle<T> {
  data: T;
}

/**
 * Cek kupon untuk melihat besar diskonnya SEBELUM checkout. Ini cuma
 * pratinjau - saat checkout beneran, server menghitung ulang diskonnya
 * sendiri dari kode kupon, tidak pernah percaya angka dari sini.
 */
export async function checkCoupon(code: string, subtotal: number): Promise<CouponCheckResult> {
  const result = await apiFetch<ApiSingle<CouponCheckResult>>('/coupons/check', {
    method: 'POST',
    body: JSON.stringify({ code, subtotal }),
  });

  return result.data;
}
