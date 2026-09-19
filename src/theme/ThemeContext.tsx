import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { darkPalette, lightPalette, Palette } from './colors';

interface ThemeContextValue {
  colors: Palette;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Menyediakan tema gelap/terang untuk seluruh aplikasi. Defaultnya ikut
 * pengaturan HP (`useColorScheme`), tapi begitu tombol bulan/matahari di
 * navbar ditekan, pilihan manual itu yang menang sampai app ditutup - sama
 * seperti tombol "Ganti tema" di versi web (disimpan di localStorage di
 * sana; di sini sengaja tidak disimpan permanen, karena token login pun
 * memang belum disimpan permanen di app ini).
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [manualOverride, setManualOverride] = useState<'light' | 'dark' | null>(null);

  const isDark = (manualOverride ?? systemScheme ?? 'light') === 'dark';

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: isDark ? darkPalette : lightPalette,
      isDark,
      toggleTheme: () => setManualOverride(isDark ? 'light' : 'dark'),
    }),
    [isDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);

  if (!ctx) {
    throw new Error('useAppTheme() harus dipanggil di dalam <ThemeProvider>.');
  }

  return ctx;
}
