/**
 * Ubah angka jadi format Rupiah untuk ditampilkan, contoh:
 * formatRupiah(15000) -> "Rp15.000"
 *
 * Pakai Intl.NumberFormat bawaan JavaScript, jadi tidak perlu install
 * library tambahan apa pun.
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
