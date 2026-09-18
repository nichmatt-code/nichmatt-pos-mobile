import { useEffect, useState } from 'react';

/**
 * "Debounce" artinya: tunda dulu, jangan langsung reaksi tiap ketukan tombol.
 * `debouncedValue` baru ikut berubah `delayMs` mili-detik SETELAH user
 * berhenti mengetik - supaya kita tidak menembak API di setiap huruf yang
 * diketik user di kolom pencarian.
 */
export function useDebouncedValue(value: string, delayMs: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debouncedValue;
}
