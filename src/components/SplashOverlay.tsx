import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

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
  return (
    <View style={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  logo: {
    width: 200,
    height: 110,
  },
});
