import { apiFetch } from './client';
import { TransactionSummary } from '../types';

export interface TransactionHistoryParams {
  from?: string;
  to?: string;
  search?: string;
  page?: number;
}

export interface TransactionHistoryPage {
  data: TransactionSummary[];
  currentPage: number;
  lastPage: number;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
  };
}

/**
 * Cari/tampilkan riwayat transaksi yang sudah selesai. Tanpa `from`/`to`,
 * server otomatis membatasi ke bulan berjalan (sama seperti laporan
 * penjualan di versi web) - supaya daftar tidak pernah tanpa sengaja
 * memuat SELURUH riwayat toko sekaligus.
 */
export async function getTransactionHistory(
  params: TransactionHistoryParams = {},
): Promise<TransactionHistoryPage> {
  const query = new URLSearchParams();

  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', String(params.page));

  const queryString = query.toString();
  const path = queryString ? `/transactions?${queryString}` : '/transactions';

  const result = await apiFetch<PaginatedResponse<TransactionSummary>>(path);

  return {
    data: result.data,
    currentPage: result.meta.current_page,
    lastPage: result.meta.last_page,
  };
}
