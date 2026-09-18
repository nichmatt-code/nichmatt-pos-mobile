import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { API_ORIGIN, apiFetch, setAuthToken } from './client';
import { User } from '../types';

// Wajib dipanggil sekali di awal (efek samping saat file ini pertama kali
// di-import) supaya kalau app ini ditutup/dibuka lagi tepat saat browser
// login sedang terbuka, sesi login-nya tetap bisa selesai dengan benar.
WebBrowser.maybeCompleteAuthSession();

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

interface MeResponse {
  data: User;
}

/**
 * Login pakai akun Google, TANPA harus mengajak aplikasi mobile bicara
 * langsung ke Google (Google menolak alamat redirect aplikasi mobile, dan
 * cara lama Expo untuk itu - proxy auth.expo.io - sudah ditutup karena ada
 * celah keamanan).
 *
 * Triknya: aplikasi ini cuma membuka browser ke alur "Login dengan Google"
 * yang SUDAH ADA di halaman web (persis seperti kalau kamu klik tombol itu
 * di browser komputer). Begitu login di Google selesai, server Laravel
 * yang mengarahkan balik ke aplikasi ini sambil membawa token - Google
 * sendiri tidak pernah tahu soal aplikasi mobile ini sama sekali.
 *
 * Balikannya `null` (bukan error) kalau user sendiri yang menutup/membatalkan
 * jendela browsernya - itu bukan kegagalan, cuma perubahan pikiran.
 */
export async function loginWithGoogle(): Promise<User | null> {
  // Alamat "pulang" yang cuma dikenali oleh HP kamu sendiri (bukan Google) -
  // Expo yang otomatis memilih bentuk yang tepat, baik lewat Expo Go
  // maupun build sendiri nantinya.
  const redirectUri = AuthSession.makeRedirectUri();

  const authUrl = `${API_ORIGIN}/auth/google/redirect?mobile_redirect=${encodeURIComponent(redirectUri)}`;

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

  if (result.type !== 'success' || !result.url) {
    // 'cancel' / 'dismiss' - user menutup browser sendiri.
    return null;
  }

  const queryString = result.url.split('?')[1] ?? '';
  const token = new URLSearchParams(queryString).get('token');

  if (!token) {
    throw new Error('Login dengan Google gagal - token tidak ditemukan.');
  }

  setAuthToken(token);

  const me = await apiFetch<MeResponse>('/me');

  return me.data;
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
