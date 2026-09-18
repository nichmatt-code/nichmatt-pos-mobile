# NichmattPOS Mobile

Aplikasi kasir mobile (React Native + Expo) untuk NichmattPOS, terhubung ke API di project `NichmattPOSWeb`.

App ini terhubung langsung ke NichmattPOSWeb yang sudah live di **<https://nichmattpos.store>** (lihat `API_BASE_URL` di [src/api/client.ts](src/api/client.ts)) - artinya semua transaksi lewat app ini adalah transaksi **production sungguhan**, bukan simulasi, dan HP tidak perlu satu WiFi dengan laptop.

## Menjalankan lewat Expo Go

1. Install aplikasi **Expo Go** dari Play Store/App Store di HP kamu.
2. Di folder ini, jalankan:

   ```bash
   npm start
   ```

3. Scan QR code yang muncul di terminal pakai aplikasi Expo Go (Android: menu "Scan QR code" di dalam Expo Go; iOS: pakai Camera bawaan).

Kalau suatu saat mau testing ke server LOKAL (bukan production) lagi, ganti `API_BASE_URL` ke IP laptop kamu di jaringan WiFi (cek `ipconfig`) dan jalankan Laravel dengan `php artisan serve --host=0.0.0.0` - HP dan laptop harus di WiFi yang sama untuk mode ini.

## Struktur kode

Lihat `src/` - `api/` (koneksi ke Laravel), `screens/` (LoginScreen, KasirScreen), `components/`, `theme/`, `types.ts`.

## Perintah lain

- `npm test` - jalankan test.
- `npm run lint` - jalankan ESLint.
