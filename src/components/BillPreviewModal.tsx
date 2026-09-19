import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Palette } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeContext';
import { BillPreview } from '../types';
import { printReceiptLines } from '../utils/print';

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
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const visible = isLoading || bill !== null;
  const [isPrinting, setIsPrinting] = useState(false);

  async function handlePrint() {
    if (!bill) {
      return;
    }

    setIsPrinting(true);

    try {
      await printReceiptLines(bill.receipt_lines);
    } catch {
      Alert.alert('Gagal mencetak', 'Coba lagi, atau pastikan printer sudah terhubung ke HP.');
    } finally {
      setIsPrinting(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent>
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

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.closeButton]}
              onPress={onClose}
              disabled={isPrinting}>
              <Text style={styles.closeButtonText}>Tutup</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.printButton]}
              onPress={handlePrint}
              disabled={isLoading || isPrinting}>
              {isPrinting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.printButtonText}>Cetak</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
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
  actionRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: colors.slate[100],
    marginRight: 8,
  },
  closeButtonText: {
    color: colors.slate[700],
    fontWeight: '700',
  },
  printButton: {
    backgroundColor: colors.brand[600],
  },
  printButtonText: {
    color: colors.white,
    fontWeight: '700',
  },
  });
}
