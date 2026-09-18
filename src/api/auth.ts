import { Platform } from 'react-native';
import { apiFetch, setAuthToken } from './client';
import { User } from '../types';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

/**
 * Login ke API. Kalau berhasil, token langsung disimpan di dalam client.ts
 * (lewat setAuthToken) supaya semua panggilan API SETELAH ini otomatis
 * ikut mengirim token tersebut - kode yang manggil login() tidak perlu
 * mengurus token sama sekali, cukup pakai `user` yang dibalikin.
 */
export async function login({ email, password }: LoginCredentials): Promise<User> {
  const response = await apiFetch<LoginResponse>('/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      // Laravel mewajibkan "device_name" supaya token di halaman admin bisa
      // dikenali ini login dari device/aplikasi mana.
      device_name: `${Platform.OS} - Kasir App`,
    }),
  });

  setAuthToken(response.token);

  return response.user;
}

/**
 * Logout dari server (mencabut token yang sedang dipakai) sekaligus
 * menghapus token yang tersimpan di HP. Dibungkus try/finally supaya
 * token lokal TETAP terhapus walau permintaan ke server gagal (misalnya
 * HP sedang tidak ada internet) - user tidak boleh "terjebak" logged-in.
 */
export async function logout(): Promise<void> {
  try {
    await apiFetch('/logout', { method: 'POST' });
  } finally {
    setAuthToken(null);
  }
}
