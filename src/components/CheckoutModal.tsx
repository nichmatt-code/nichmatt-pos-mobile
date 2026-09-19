import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { formatRupiah } from '../utils/currency';
import { Palette } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeContext';
import { printReceiptLines } from '../utils/print';
import { PaymentMethod, Transaction } from '../types';

interface Props {
  /** Modal RN cuma tampil kalau `visible` true - ini yang mengatur buka/tutup. */
  visible: boolean;
  total: number;
  isSubmitting: boolean;
  /**
   * Kalau ada isinya, modal ini menampilkan layar "Transaksi Berhasil"
   * (meniru panel sukses di kasir versi web) alih-alih form pembayaran.
   */
  completedTransaction: Transaction | null;
  onClose: () => void;
  onConfirm: (paymentMethod: PaymentMethod, paidAmount?: number) => void;
}

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Tunai' },
  { value: 'qris', label: 'QRIS' },
  { value: 'kartu', label: 'Kartu' },
];

/**
 * Popup konfirmasi pembayaran. Dipisah dari KasirScreen supaya file kasir
 * utama tidak terlalu panjang, dan supaya modal ini gampang dipakai ulang
 * kalau nanti ada layar lain yang butuh alur pembayaran serupa.
 */
export default function CheckoutModal({
  visible,
  total,
  isSubmitting,
  completedTransaction,
  onClose,
  onConfirm,
}: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paidAmountText, setPaidAmountText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Ubah teks input ("50000") jadi angka. Kalau user belum ketik apa-apa
  // atau ketik teks aneh, anggap saja 0.
  const paidAmount = Number(paidAmountText.replace(/[^0-9]/g, '')) || 0;
  const change = paidAmount - total;

  function handleConfirm() {
    if (paymentMethod === 'cash' && paidAmount < total) {
      setError('Uang yang dibayar kurang dari total belanja.');
      return;
    }

    setError(null);
    onConfirm(paymentMethod, paymentMethod === 'cash' ? paidAmount : undefined);
  }

  function handleClose() {
    // Reset supaya modal berikutnya dibuka dalam keadaan bersih lagi.
    setPaymentMethod('cash');
    setPaidAmountText('');
    setError(null);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
      statusBarTranslucent
      navigationBarTranslucent>
      {/* Latar belakang gelap transparan di belakang kotak modal. */}
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {completedTransaction ? (
            <SuccessView transaction={completedTransaction} onDone={handleClose} />
          ) : (
            <>
              <Text style={styles.title}>Pembayaran</Text>

              <Text style={styles.totalLabel}>Total belanja</Text>
              <Text style={styles.totalValue}>{formatRupiah(total)}</Text>

              <Text style={styles.label}>Metode pembayaran</Text>
              <View style={styles.methodRow}>
                {PAYMENT_OPTIONS.map(option => {
                  const isActive = option.value === paymentMethod;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.methodChip, isActive && styles.methodChipActive]}
                      onPress={() => setPaymentMethod(option.value)}>
                      <Text
                        style={[styles.methodChipText, isActive && styles.methodChipTextActive]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {paymentMethod === 'cash' && (
                <>
                  <Text style={styles.label}>Uang diterima</Text>
                  <TextInput
                    style={styles.input}
                    value={paidAmountText}
                    onChangeText={setPaidAmountText}
                    placeholder="0"
                    placeholderTextColor={colors.slate[400]}
                    keyboardType="number-pad"
                  />
                  <Text style={styles.changeText}>
                    Kembalian: {formatRupiah(Math.max(change, 0))}
                  </Text>
                </>
              )}

              {error && <Text style={styles.errorText}>{error}</Text>}

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={handleClose}
                  disabled={isSubmitting}>
                  <Text style={styles.cancelButtonText}>Batal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.confirmButton]}
                  onPress={handleConfirm}
                  disabled={isSubmitting}>
                  {isSubmitting ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.confirmButtonText}>Selesaikan</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

/** Layar sukses setelah transaksi tersimpan - meniru panel hijau di kasir web. */
function SuccessView({ transaction, onDone }: { transaction: Transaction; onDone: () => void }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isPrinting, setIsPrinting] = useState(false);

  async function handlePrintReceipt() {
    setIsPrinting(true);

    try {
      await printReceiptLines(transaction.receipt_lines);
    } catch {
      Alert.alert('Gagal mencetak', 'Coba lagi, atau pastikan printer sudah terhubung ke HP.');
    } finally {
      setIsPrinting(false);
    }
  }

  return (
    <View style={styles.successContainer}>
      <View style={styles.successBadge}>
        <Text style={styles.successBadgeIcon}>✓</Text>
      </View>
      <Text style={styles.successTitle}>Transaksi Berhasil</Text>
      <Text style={styles.successSubtle}>{transaction.transaction_no}</Text>
      {!!transaction.customer_name && (
        <Text style={styles.successSubtle}>Customer: {transaction.customer_name}</Text>
      )}
      <Text style={styles.successTotal}>{formatRupiah(transaction.total)}</Text>
      {transaction.payment_method === 'cash' && (
        <Text style={styles.successSubtle}>
          Kembalian: {formatRupiah(transaction.change_amount)}
        </Text>
      )}

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={handlePrintReceipt}
          disabled={isPrinting}>
          {isPrinting ? (
            <ActivityIndicator color={colors.slate[700]} />
          ) : (
            <Text style={styles.cancelButtonText}>Cetak Struk</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.confirmButton]} onPress={onDone}>
          <Text style={styles.confirmButtonText}>Transaksi Baru</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.slate[900],
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 13,
    color: colors.slate[500],
  },
  totalValue: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.brand[600],
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.slate[700],
    marginBottom: 8,
  },
  methodRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  methodChip: {
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    backgroundColor: colors.surface,
  },
  methodChipActive: {
    backgroundColor: colors.brand[600],
    borderColor: colors.brand[600],
  },
  methodChipText: {
    color: colors.slate[600],
    fontWeight: '600',
  },
  methodChipTextActive: {
    color: colors.white,
  },
  input: {
    backgroundColor: colors.slate[50],
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 8,
    color: colors.slate[900],
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.slate[900],
    marginBottom: 8,
  },
  errorText: {
    color: colors.rose[600],
    fontSize: 13,
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.slate[100],
    marginRight: 8,
  },
  cancelButtonText: {
    color: colors.slate[700],
    fontWeight: '700',
  },
  confirmButton: {
    backgroundColor: colors.brand[600],
  },
  confirmButtonText: {
    color: colors.white,
    fontWeight: '700',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  successBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.emerald[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successBadgeIcon: {
    fontSize: 26,
    color: colors.emerald[600],
    fontWeight: '700',
  },
  successTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.emerald[600],
    marginBottom: 4,
  },
  successSubtle: {
    fontSize: 13,
    color: colors.slate[500],
    marginBottom: 2,
  },
  successTotal: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.slate[900],
    marginTop: 8,
    marginBottom: 4,
  },
  });
}
