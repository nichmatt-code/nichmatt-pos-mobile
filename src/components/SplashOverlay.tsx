import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Palette } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeContext';

/**
 * Layar logo singkat yang tampil begitu KODE aplikasi ini mulai jalan.
 *
 * CATATAN: layar loading paling awal (sebelum ini) - waktu HP masih
 * mengunduh/memuat aplikasi lewat Expo Go - itu tampilan bawaan Expo Go
 * sendiri (cuma nama project, teks polos) dan TIDAK bisa diganti selama
 * masih pakai Expo Go (butuh build sendiri/Dev Client). Begitu bagian itu
 * selesai dan kode kita mulai jalan, layar inilah yang pertama muncul -
 * jadi logo NichmattPOS tetap terlihat secepat mungkin dari sisi kita.
 */
export default function SplashOverlay() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
    </View>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    logo: {
      width: 200,
      height: 110,
    },
  });
}
