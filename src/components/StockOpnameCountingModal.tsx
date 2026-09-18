import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { saveStockOpnameCounts, finishStockOpname } from '../api/stockOpname';
import { ApiError } from '../api/client';
import { StockOpname } from '../types';

interface Props {
  /** `null` berarti modal tertutup / belum ada sesi yang dibuka. */
  stockOpname: StockOpname | null;
  onClose: () => void;
  /** Dipanggil setelah simpan/selesaikan berhasil, supaya daftar di layar sebelumnya ikut ter-update. */
  onUpdated: (updated: StockOpname) => void;
}

const TYPE_LABELS: Record<string, string> = {
  product: 'Produk',
  inventory: 'Bahan Baku',
};

/**
 * Layar hitung fisik satu sesi stock opname - input jumlah fisik per
 * item, simpan (bisa dicicil), lalu selesaikan (baru di titik ini stok
 * asli benar-benar disesuaikan - lihat StockOpnameController::finish()).
 */
export default function StockOpnameCountingModal({ stockOpname, onClose, onUpdated }: Props) {
  // Disimpan sebagai teks (bukan angka) supaya kolom kosong tetap bisa
  // diketik ulang tanpa "0" yang mengganggu; dikonversi balik saat kirim.
  const [countTexts, setCountTexts] = useState<Record<number, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  if (!stockOpname) {
    return null;
  }

  const isDraft = stockOpname.status === 'draft';

  function textFor(itemId: number, fallback: number | null): string {
    if (itemId in countTexts) {
      return countTexts[itemId];
    }
    return fallback === null ? '' : String(fallback);
  }

  function handleChangeCount(itemId: number, text: string) {
    setCountTexts(current => ({ ...current, [itemId]: text.replace(/[^0-9]/g, '') }));
  }

  async function handleSave() {
    if (!stockOpname) {
      return;
    }

    const counts = Object.entries(countTexts).map(([itemId, text]) => ({
      itemId: Number(itemId),
      countedQty: text === '' ? null : Number(text),
    }));

    if (counts.length === 0) {
      Alert.alert('Belum ada perubahan', 'Isi dulu jumlah fisik minimal satu item.');
      return;
    }

    setIsSaving(true);

    try {
      const updated = await saveStockOpnameCounts(stockOpname.id, counts);
      setCountTexts({});
      onUpdated(updated);
      Alert.alert('Tersimpan', 'Hitungan berhasil disimpan.');
    } catch (error) {
      Alert.alert(
        'Gagal menyimpan',
        error instanceof ApiError ? error.message : 'Coba lagi sebentar.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleFinish() {
    Alert.alert(
      'Selesaikan Stock Opname?',
      'Stok asli akan langsung disesuaikan mengikuti hasil hitungan. Tindakan ini tidak bisa dibatalkan.',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Selesaikan', style: 'destructive', onPress: confirmFinish },
      ],
    );
  }

  async function confirmFinish() {
    if (!stockOpname) {
      return;
    }

    setIsFinishing(true);

    try {
      const updated = await finishStockOpname(stockOpname.id);
      onUpdated(updated);
      Alert.alert('Selesai', 'Stock opname selesai, stok sudah disesuaikan.');
    } catch (error) {
      Alert.alert(
        'Gagal menyelesaikan',
        error instanceof ApiError ? error.message : 'Coba lagi sebentar.',
      );
    } finally {
      setIsFinishing(false);
    }
  }

  return (
    <Modal visible transparent={false} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{stockOpname.code}</Text>
            <Text style={styles.subtitle}>
              {TYPE_LABELS[stockOpname.type] ?? stockOpname.type} ·{' '}
              {stockOpname.status === 'draft' ? 'Draft' : 'Selesai'}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>Tutup</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.columnLabels}>
          <Text style={[styles.columnLabelText, styles.columnLabelName]}>Item</Text>
          <Text style={styles.columnLabelText}>Sistem</Text>
          <Text style={styles.columnLabelText}>Fisik</Text>
        </View>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {stockOpname.items.map(item => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemNameColumn}>
                <Text style={styles.itemName}>{item.item_name}</Text>
                {!!item.unit && <Text style={styles.itemUnit}>{item.unit}</Text>}
              </View>
              <Text style={styles.systemQtyText}>{item.system_qty}</Text>
              {isDraft ? (
                <TextInput
                  style={styles.countInput}
                  value={textFor(item.id, item.counted_qty)}
                  onChangeText={text => handleChangeCount(item.id, text)}
                  keyboardType="number-pad"
                  placeholder="-"
                  placeholderTextColor={colors.slate[400]}
                />
              ) : (
                <Text style={styles.countedQtyText}>{item.counted_qty ?? '-'}</Text>
              )}
            </View>
          ))}
        </ScrollView>

        {isDraft && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={isSaving || isFinishing}>
              {isSaving ? (
                <ActivityIndicator color={colors.slate[700]} />
              ) : (
                <Text style={styles.saveButtonText}>Simpan Hitungan</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.finishButton, isFinishing && styles.buttonDisabled]}
              onPress={handleFinish}
              disabled={isSaving || isFinishing}>
              {isFinishing ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.finishButtonText}>Selesaikan</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.slate[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[200],
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.slate[900],
  },
  subtitle: {
    fontSize: 12,
    color: colors.slate[500],
    marginTop: 2,
  },
  closeText: {
    color: colors.slate[500],
    fontWeight: '600',
  },
  columnLabels: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  columnLabelText: {
    width: 70,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '600',
    color: colors.slate[400],
    textTransform: 'uppercase',
  },
  columnLabelName: {
    flex: 1,
    width: undefined,
    textAlign: 'left',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.slate[200],
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  itemNameColumn: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 13,
    color: colors.slate[900],
  },
  itemUnit: {
    fontSize: 11,
    color: colors.slate[400],
    marginTop: 1,
  },
  systemQtyText: {
    width: 70,
    textAlign: 'right',
    fontSize: 13,
    color: colors.slate[500],
  },
  countedQtyText: {
    width: 70,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '700',
    color: colors.slate[900],
  },
  countInput: {
    width: 70,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 13,
    color: colors.slate[900],
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.slate[200],
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.slate[100],
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 8,
  },
  saveButtonText: {
    color: colors.slate[700],
    fontWeight: '700',
  },
  finishButton: {
    flex: 1,
    backgroundColor: colors.brand[600],
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  finishButtonText: {
    color: colors.white,
    fontWeight: '700',
  },
});
