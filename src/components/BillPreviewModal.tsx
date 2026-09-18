import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';
import { BillPreview } from '../types';

interface Props {
  /** `null` berarti modal tertutup / belum ada pratinjau untuk ditampilkan. */
  bill: BillPreview | null;
  isLoading: boolean;
  onClose: () => void;
}

/**
 * Menampilkan pratinjau bill (belum dibayar) sebelum kasir konfirmasi
 * pembayaran - meniru tombol "Cetak Bill" di versi web.
 *
 * CATATAN: versi web bisa mengirim bill ini langsung ke printer thermal
 * lewat Bluetooth (Web Bluetooth API di browser). Aplikasi mobile ini
 * BELUM bisa mencetak ke printer Bluetooth beneran - itu butuh modul
 * native yang tidak didukung Expo Go - jadi untuk sekarang teksnya
 * cuma ditampilkan di layar (bisa dibacakan/ditunjukkan ke pelanggan).
 */
export default function BillPreviewModal({ bill, isLoading, onClose }: Props) {
  const visible = isLoading || bill !== null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Bill Sementara</Text>
          <Text style={styles.subtitle}>Belum dibayar - tunjukkan ini ke pelanggan sebelum bayar.</Text>

          {isLoading ? (
            <Text style={styles.loadingText}>Menghitung bill...</Text>
          ) : (
            <ScrollView style={styles.linesBox}>
              {bill?.receipt_lines.map((line, index) => (
                // Teks struk baris demi baris - pakai font monospace supaya
                // rata seperti struk printer beneran, dan `line || ' '`
                // supaya baris kosong tetap punya tinggi (tidak collapse).
                <Text key={index} style={styles.line}>
                  {line || ' '}
                </Text>
              ))}
            </ScrollView>
          )}

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
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.slate[900],
  },
  subtitle: {
    fontSize: 13,
    color: colors.slate[500],
    marginTop: 2,
    marginBottom: 12,
  },
  loadingText: {
    color: colors.slate[500],
    paddingVertical: 24,
    textAlign: 'center',
  },
  linesBox: {
    backgroundColor: colors.slate[50],
    borderRadius: 12,
    padding: 14,
  },
  line: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: colors.slate[900],
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: colors.brand[600],
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.white,
    fontWeight: '700',
  },
});
