/**
 * Palet warna ini SENGAJA disalin persis dari `tailwind.config.js` di
 * project NichmattPOSWeb (folder `theme.extend.colors.brand`) dan dari
 * warna default Tailwind (slate/rose/emerald) yang dipakai di halaman
 * login & kasir versi web.
 *
 * Tujuannya: kalau nanti warna brand di Web diganti, cukup samakan angka
 * di sini juga, supaya aplikasi mobile & web selalu terlihat satu
 * keluarga (konsisten), bukan dua aplikasi yang beda.
 */

type Scale10 = Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900, string>;
type Scale3 = Record<50 | 500 | 600, string>;

export interface Palette {
  brand: Scale10;
  slate: Scale10;
  rose: Scale3;
  emerald: Scale3;
  /** Literal putih, TIDAK pernah berubah antar tema - dipakai untuk teks/ikon
   * di atas tombol berwarna solid (mis. tombol brand/rose), bukan untuk latar
   * kartu/sheet (untuk itu pakai `surface`). */
  white: string;
  /** Latar kartu/sheet/header - putih di tema terang, abu gelap di tema gelap. */
  surface: string;
}

const brand: Scale10 = {
  50: '#eef1f8',
  100: '#dee5f4',
  200: '#c1cce8',
  300: '#96a8dc',
  400: '#6883d6',
  500: '#3d68fb',
  600: '#2a4ce0',
  700: '#33409e',
  800: '#2c3380',
  900: '#272a5c',
};

const lightSlate: Scale10 = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
};

/**
 * Skala slate versi gelap - dibalik urutannya (50 <-> 900, 100 <-> 800, dst),
 * meniru persis cara Tailwind `dark:` dipakai di versi web (mis. latar yang
 * di terang pakai `slate-50` selalu diberi `dark:bg-slate-900`, teks yang di
 * terang pakai `slate-900` selalu diberi `dark:text-slate-100`). Dengan
 * pembalikan ini, komponen yang SUDAH menulis `colors.slate[50]` untuk latar
 * dan `colors.slate[900]` untuk teks otomatis benar di kedua tema, tanpa
 * perlu menulis ulang warna di tiap komponen satu-satu.
 */
const darkSlate: Scale10 = {
  50: lightSlate[900],
  100: lightSlate[800],
  200: lightSlate[700],
  300: lightSlate[600],
  400: lightSlate[500],
  500: lightSlate[400],
  600: lightSlate[300],
  700: lightSlate[200],
  800: lightSlate[100],
  900: lightSlate[50],
};

const lightRose: Scale3 = { 50: '#fff1f2', 500: '#f43f5e', 600: '#e11d48' };
const darkRose: Scale3 = { 50: '#4c0519', 500: '#fb7185', 600: '#fda4af' };

const lightEmerald: Scale3 = { 50: '#ecfdf5', 500: '#10b981', 600: '#059669' };
const darkEmerald: Scale3 = { 50: '#022c22', 500: '#34d399', 600: '#6ee7b7' };

export const lightPalette: Palette = {
  brand,
  slate: lightSlate,
  rose: lightRose,
  emerald: lightEmerald,
  white: '#ffffff',
  surface: '#ffffff',
};

export const darkPalette: Palette = {
  brand,
  slate: darkSlate,
  rose: darkRose,
  emerald: darkEmerald,
  white: '#ffffff',
  surface: lightSlate[800],
};

/** Default statis - hanya untuk kode lama yang belum sempat ikut ThemeProvider. */
export const colors = lightPalette;
