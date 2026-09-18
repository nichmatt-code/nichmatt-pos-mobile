import { apiFetch } from './client';
import { StockOpname, StockOpnameType } from '../types';

interface ApiSingle<T> {
  data: T;
}

interface ApiCollection<T> {
  data: T[];
}

/** Daftar sesi stock opname toko ini (draft & selesai), terbaru dulu. */
export async function listStockOpnames(): Promise<StockOpname[]> {
  const result = await apiFetch<ApiCollection<StockOpname>>('/stock-opnames');
  return result.data;
}

/**
 * Mulai sesi stock opname baru - server langsung mengambil snapshot stok
 * SAAT INI untuk semua produk (atau bahan baku, tergantung `type`) yang
 * berlaku dihitung, siap diisi jumlah fisiknya satu per satu.
 */
export async function createStockOpname(
  type: StockOpnameType,
  note?: string,
): Promise<StockOpname> {
  const result = await apiFetch<ApiSingle<StockOpname>>('/stock-opnames', {
    method: 'POST',
    body: JSON.stringify({ type, note }),
  });

  return result.data;
}

export async function getStockOpname(id: number): Promise<StockOpname> {
  const result = await apiFetch<ApiSingle<StockOpname>>(`/stock-opnames/${id}`);
  return result.data;
}

/**
 * Simpan jumlah hasil hitung fisik untuk beberapa baris sekaligus (bukan
 * satu-satu tiap ketik, supaya tidak boros koneksi/baterai di HP). Tidak
 * berpengaruh apa-apa kalau sesinya sudah "selesai" (server abaikan).
 */
export async function saveStockOpnameCounts(
  id: number,
  counts: { itemId: number; countedQty: number | null }[],
): Promise<StockOpname> {
  const result = await apiFetch<ApiSingle<StockOpname>>(`/stock-opnames/${id}/counts`, {
    method: 'PUT',
    body: JSON.stringify({
      counts: counts.map(c => ({ item_id: c.itemId, counted_qty: c.countedQty })),
    }),
  });

  return result.data;
}

/**
 * Terapkan semua selisih hitungan ke stok asli (produk/bahan baku) dan
 * tandai sesi ini selesai - tidak bisa dibatalkan/diulang setelah ini.
 */
export async function finishStockOpname(id: number): Promise<StockOpname> {
  const result = await apiFetch<ApiSingle<StockOpname>>(`/stock-opnames/${id}/finish`, {
    method: 'POST',
  });

  return result.data;
}

export async function deleteStockOpname(id: number): Promise<void> {
  await apiFetch(`/stock-opnames/${id}`, { method: 'DELETE' });
}
