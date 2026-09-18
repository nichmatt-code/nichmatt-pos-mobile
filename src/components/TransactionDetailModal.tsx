import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../theme/colors';
import { formatRupiah } from '../utils/currency';
import { printReceiptLines } from '../utils/print';
import { Transaction } from '../types';

interface Props {
  /** `null` berarti modal tertutup / belum ada transaksi yang dipilih. */
  transaction: Transaction | null;
  isLoading: boolean;
  onClose: () => void;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Tunai',
  qris: 'QRIS',
  kartu: 'Kartu',
};

/** Detail satu transaksi dari riwayat - item, rincian total, dan cetak ulang struk. */
export default function TransactionDetailModal({ transaction, isLoading, onClose }: Props) {
  const visible = isLoading || transaction !== null;
  const [isPrinting, setIsPrinting] = useState(false);

  async function handlePrint() {
    if (!transaction) {
      return;
    }

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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {isLoading || !transaction ? (
            <Text style={styles.loadingText}>Memuat transaksi...</Text>
          ) : (
            <>
              <Text style={styles.title}>{transaction.transaction_no}</Text>
              <Text style={styles.subtitle}>
                {new Date(transaction.created_at).toLocaleString('id-ID')}
              </Text>
              {!!transaction.customer_name && (
                <Text style={styles.subtitle}>Customer: {transaction.customer_name}</Text>
              )}

              <ScrollView style={styles.itemsBox}>
                {transaction.items.map((item, index) => (
                  <View key={`${item.product_id}-${index}`} style={styles.itemRow}>
                    <View style={styles.itemNameColumn}>
                      <Text style={styles.itemName}>{item.product_name}</Text>
                      {!!item.note && <Text style={styles.itemNote}>{item.note}</Text>}
                      <Text style={styles.itemQty}>
                        {item.qty} x {formatRupiah(item.price)}
                      </Text>
                    </View>
                    <Text style={styles.itemSubtotal}>{formatRupiah(item.subtotal)}</Text>
                  </View>
                ))}
              </ScrollView>

              <View style={styles.totalsBox}>
                <TotalRow label="Subtotal" value={transaction.subtotal} />
                {transaction.discount > 0 && (
                  <TotalRow label="Diskon" value={-transaction.discount} />
                )}
                {transaction.coupon_discount_amount > 0 && (
                  <TotalRow label="Diskon Kupon" value={-transaction.coupon_discount_amount} />
                )}
                {transaction.service_charge_amount > 0 && (
                  <TotalRow label="Service Charge" value={transaction.service_charge_amount} />
                )}
                {transaction.tax_amount > 0 && (
                  <TotalRow label="Pajak" value={transaction.tax_amount} />
                )}
                <TotalRow label="Total" value={transaction.total} emphasized />
                <TotalRow
                  label={`Bayar (${PAYMENT_METHOD_LABELS[transaction.payment_method] ?? transaction.payment_method})`}
                  value={transaction.paid_amount}
                />
                <TotalRow label="Kembalian" value={transaction.change_amount} />
              </View>

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
                  disabled={isPrinting}>
                  {isPrinting ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.printButtonText}>Cetak Struk</Text>
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

function TotalRow({
  label,
  value,
  emphasized,
}: {
  label: string;
  value: number;
  emphasized?: boolean;
}) {
  return (
    <View style={styles.totalRow}>
      <Text style={[styles.totalLabel, emphasized && styles.totalLabelEmphasized]}>{label}</Text>
      <Text style={[styles.totalValue, emphasized && styles.totalValueEmphasized]}>
        {formatRupiah(value)}
      </Text>
    </View>
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
    maxHeight: '85%',
  },
  loadingText: {
    color: colors.slate[500],
    paddingVertical: 40,
    textAlign: 'center',
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
  },
  itemsBox: {
    marginTop: 12,
    maxHeight: 220,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[100],
  },
  itemNameColumn: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 14,
    color: colors.slate[900],
  },
  itemNote: {
    fontSize: 11,
    color: colors.slate[500],
    fontStyle: 'italic',
    marginTop: 1,
  },
  itemQty: {
    fontSize: 12,
    color: colors.slate[500],
    marginTop: 2,
  },
  itemSubtotal: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.slate[900],
  },
  totalsBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.slate[200],
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalLabel: {
    fontSize: 13,
    color: colors.slate[500],
  },
  totalLabelEmphasized: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.slate[900],
  },
  totalValue: {
    fontSize: 13,
    color: colors.slate[900],
  },
  totalValueEmphasized: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.brand[600],
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
