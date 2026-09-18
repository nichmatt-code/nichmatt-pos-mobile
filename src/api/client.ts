/**
 * Satu pintu keluar untuk semua panggilan ke API Laravel (NichmattPOSWeb).
 * File-file lain di folder src/api (auth.ts, catalog.ts, transactions.ts)
 * semuanya lewat sini, supaya:
 *  - alamat server cuma ditulis di SATU tempat,
 *  - format error dari Laravel dibaca dengan cara yang sama di mana-mana.
 */

// --- Alamat server ---------------------------------------------------
//
// "10.0.2.2" adalah alamat khusus dari emulator Android untuk menunjuk ke
// "localhost" komputer kamu (tempat `php artisan serve` / Laragon jalan).
// Ini BUKAN bug, memang begitu cara emulator Android bekerja.
//
// - Kalau kamu test pakai emulator Android -> biarkan seperti ini.
// - Kalau kamu test pakai HP fisik yang disambungkan lewat USB/WiFi -> ganti
//   "10.0.2.2" dengan alamat IP laptop kamu di jaringan yang sama,
//   misalnya "http://192.168.1.5:8000/api/v1" (cek dengan `ipconfig`).
const API_BASE_URL = 'http://10.0.2.2:8000/api/v1';

// Token login (Bearer token dari Sanctum) disimpan di variabel biasa di
// memori aplikasi. Artinya: kalau aplikasi ditutup total, token ini hilang
// dan user harus login lagi - itu sudah cukup untuk versi awal ini.
let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

/**
 * Error yang dilempar kalau Laravel membalas dengan status gagal
 * (400/401/403/422/429/500/dst). `message` sudah siap ditampilkan ke user,
 * dan `fieldErrors` (kalau ada) berisi detail per-field dari validasi
 * Laravel, contoh: { email: ["Email wajib diisi."] }.
 */
export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string[]>;

  constructor(message: string, status: number, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Wrapper tipis di atas `fetch` bawaan React Native.
 * `T` adalah generic TypeScript: tipe data yang diharapkan balik dari API,
 * supaya pemanggilnya dapat auto-complete & pengecekan tipe.
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    // fetch() gagal total (bukan Laravel yang menolak, tapi jaringan/HP-nya
    // yang tidak bisa menghubungi server sama sekali).
    throw new ApiError(
      'Tidak bisa menghubungi server. Periksa koneksi internet dan alamat server (API_BASE_URL).',
      0,
    );
  }

  // Balasan 204 (mis. beberapa endpoint logout) tidak punya body sama sekali.
  const body = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const message = body?.message ?? `Permintaan gagal (status ${response.status}).`;
    throw new ApiError(message, response.status, body?.errors);
  }

  return body as T;
}
