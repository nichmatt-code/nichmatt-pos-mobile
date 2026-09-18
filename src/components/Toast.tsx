import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

export interface ToastPayload {
  /** Dibuat unik tiap kali toast dipicu (lihat komentar di bawah). */
  id: number;
  message: string;
}

interface Props {
  toast: ToastPayload | null;
  /** Jarak dari bawah layar, supaya toast tidak ketutupan panel keranjang. */
  bottomOffset?: number;
}

/**
 * Notifikasi kecil yang muncul sebentar lalu hilang sendiri (mis. "Produk
 * ditambahkan ke keranjang") - meniru komponen <x-toast> di kasir versi web.
 *
 * `toast.id` sengaja dibuat berbeda setiap kali dipanggil, walaupun teks
 * pesannya sama persis (mis. tap produk yang sama dua kali berturut-turut).
 * Ini penting karena useEffect di bawah cuma jalan ulang kalau *id*-nya
 * berubah - kalau cuma mengandalkan `message`, tap kedua dengan teks yang
 * sama tidak akan mengulang animasinya dari awal.
 */
export default function Toast({ toast, bottomOffset = 24 }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    if (!toast) {
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();

    const timeoutId = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 8, duration: 150, useNativeDriver: true }),
      ]).start();
    }, 2500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast?.id]);

  if (!toast) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, { bottom: bottomOffset, opacity, transform: [{ translateY }] }]}>
      <Text style={styles.check}>✓</Text>
      <Text style={styles.message} numberOfLines={2}>
        {toast.message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.slate[900],
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: colors.slate[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  check: {
    color: colors.emerald[500],
    fontWeight: '700',
    marginRight: 8,
  },
  message: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
});
