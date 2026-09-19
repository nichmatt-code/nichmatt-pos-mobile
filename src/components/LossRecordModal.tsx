import React, { useEffect, useMemo, useState } from 'react';
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
import { Palette } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeContext';
import { formatRupiah } from '../utils/currency';
import { useDebouncedValue } from '../utils/useDebouncedValue';
import { getProducts } from '../api/catalog';
import { submitLossRecord } from '../api/lossRecords';
import { ApiError } from '../api/client';
import { Product } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
}

interface LossLine {
  product: Product;
  qty: number;
}

/**
 * "Catat Kerugian" - untuk barang rusak/hilang/kadaluarsa. Stok berkurang
 * TANPA dianggap terjual (beda dari checkout biasa) - meniru fitur yang
 * sama di kasir versi web.
 */
export default function LossRecordModal({ visible, onClose }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [items, setItems] = useState<LossLine[]>([]);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!visible || debouncedSearch.trim() === '') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchResults([]);
      return;
    }

    let isCancelled = false;
    setIsSearching(true);

    getProducts({ search: debouncedSearch })
      .then(result => {
        if (!isCancelled) {
          setSearchResults(result);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setSearchResults([]);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsSearching(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [visible, debouncedSearch]);

  function handleAddProduct(product: Product) {
    setItems(current => {
      const existing = current.find(line => line.product.id === product.id);

      if (existing) {
        return current.map(line =>
          line.product.id === product.id ? { ...line, qty: line.qty + 1 } : line,
        );
      }

      return [...current, { product, qty: 1 }];
    });
    setSearch('');
    setSearchResults([]);
  }

  function changeQty(productId: number, delta: number) {
    setItems(current =>
      current
        .map(line => (line.product.id === productId ? { ...line, qty: line.qty + delta } : line))
        .filter(line => line.qty > 0),
    );
  }

  function handleClose() {
    setSearch('');
    setSearchResults([]);
    setItems([]);
    setReason('');
    onClose();
  }

  async function handleSubmit() {
    if (items.length === 0) {
      Alert.alert('Belum ada produk', 'Pilih dulu produk yang mau dicatat sebagai kerugian.');
      return;
    }

    if (!reason.trim()) {
      Alert.alert('Alasan wajib diisi', 'Tulis alasan kerugiannya, mis. "Gelas pecah".');
      return;
    }

    setIsSubmitting(true);

    try {
      const lossRecord = await submitLossRecord({
        items: items.map(line => ({ product_id: line.product.id, qty: line.qty })),
        reason: reason.trim(),
      });

      Alert.alert(
        'Kerugian dicatat',
        `${lossRecord.loss_no}\nTotal nilai kerugian: ${formatRupiah(lossRecord.total_cost_value)}`,
      );
      handleClose();
    } catch (error) {
      Alert.alert(
        'Gagal mencatat kerugian',
        error instanceof ApiError ? error.message : 'Coba lagi sebentar.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const totalCost = items.reduce((sum, line) => sum + line.product.price * line.qty, 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
      navigationBarTranslucent>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Catat Kerugian</Text>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.closeText}>Tutup</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchWrapper}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Cari produk yang rusak/hilang..."
            placeholderTextColor={colors.slate[400]}
          />
          {isSearching && (
            <ActivityIndicator style={styles.searchSpinner} size="small" color={colors.brand[600]} />
          )}
          {searchResults.length > 0 && (
            <View style={styles.searchResultsBox}>
              {searchResults.map(product => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.searchResultRow}
                  onPress={() => handleAddProduct(product)}>
                  <Text style={styles.searchResultName}>{product.name}</Text>
                  <Text style={styles.searchResultPrice}>{formatRupiah(product.price)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {items.length === 0 ? (
            <Text style={styles.emptyText}>Belum ada produk dipilih.</Text>
          ) : (
            items.map(line => (
              <View key={line.product.id} style={styles.itemRow}>
                <View style={styles.itemNameColumn}>
                  <Text style={styles.itemName}>{line.product.name}</Text>
                  <Text style={styles.itemPrice}>
                    {formatRupiah(line.product.price)} / {line.product.unit ?? 'unit'}
                  </Text>
                </View>
                <View style={styles.qtyControls}>
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => changeQty(line.product.id, -1)}>
                    <Text style={styles.qtyButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyValue}>{line.qty}</Text>
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => changeQty(line.product.id, 1)}>
                    <Text style={styles.qtyButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        <View style={styles.footer}>
          {items.length > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Perkiraan Nilai Kerugian</Text>
              <Text style={styles.totalValue}>{formatRupiah(totalCost)}</Text>
            </View>
          )}

          <Text style={styles.fieldLabel}>Alasan</Text>
          <TextInput
            style={styles.reasonInput}
            value={reason}
            onChangeText={setReason}
            placeholder="mis. Gelas pecah, ayam jatuh, kadaluarsa"
            placeholderTextColor={colors.slate[400]}
          />

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>Catat Kerugian</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
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
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[200],
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.slate[900],
  },
  closeText: {
    color: colors.slate[500],
    fontWeight: '600',
  },
  searchWrapper: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.slate[900],
  },
  searchSpinner: {
    position: 'absolute',
    right: 14,
    top: 12,
  },
  searchResultsBox: {
    marginTop: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 10,
    overflow: 'hidden',
  },
  searchResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[100],
  },
  searchResultName: {
    fontSize: 13,
    color: colors.slate[900],
  },
  searchResultPrice: {
    fontSize: 12,
    color: colors.brand[600],
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  emptyText: {
    color: colors.slate[400],
    textAlign: 'center',
    marginTop: 24,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
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
  itemPrice: {
    fontSize: 11,
    color: colors.slate[500],
    marginTop: 2,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.slate[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.slate[700],
  },
  qtyValue: {
    width: 32,
    textAlign: 'center',
    fontWeight: '600',
    color: colors.slate[900],
  },
  footer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.slate[200],
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 13,
    color: colors.slate[500],
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.rose[600],
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate[600],
    marginBottom: 6,
  },
  reasonInput: {
    backgroundColor: colors.slate[50],
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.slate[900],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButton: {
    backgroundColor: colors.rose[600],
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonText: {
    color: colors.white,
    fontWeight: '700',
  },
  });
}
