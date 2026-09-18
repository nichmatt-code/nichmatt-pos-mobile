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
export const colors = {
  brand: {
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
  },
  slate: {
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
  },
  rose: {
    50: '#fff1f2',
    500: '#f43f5e',
    600: '#e11d48',
  },
  emerald: {
    50: '#ecfdf5',
    500: '#10b981',
    600: '#059669',
  },
  white: '#ffffff',
};
