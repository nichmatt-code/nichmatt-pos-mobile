import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { colors } from '../theme/colors';

interface Props {
  visible: boolean;
  /** Link menu self order toko - inilah yang di-encode jadi QR code. */
  url: string;
  onClose: () => void;
}

/**
 * Menampilkan QR code yang, kalau di-scan pelanggan pakai kamera HP
 * mereka, membuka menu self order toko ini (halaman yang sama dengan
 * yang dibuka lewat tombol QR di kasir versi web).
 */
export default function SelfOrderQrModal({ visible, url, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>QR Self Order</Text>
          <Text style={styles.subtitle}>Pelanggan scan ini untuk pesan sendiri dari HP mereka.</Text>

          <View style={styles.qrBox}>
            <QRCode value={url} size={220} />
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Tutup</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.slate[900],
  },
  subtitle: {
    fontSize: 13,
    color: colors.slate[500],
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  qrBox: {
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.slate[200],
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: colors.brand[600],
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  closeButtonText: {
    color: colors.white,
    fontWeight: '700',
  },
});
