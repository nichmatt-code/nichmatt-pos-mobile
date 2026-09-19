import React, { useEffect, useMemo, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeContext';
import {
  createStockOpname,
  deleteStockOpname,
  listStockOpnames,
} from '../api/stockOpname';
import { ApiError } from '../api/client';
import { StockOpname, StockOpnameType } from '../types';
import StockOpnameCountingModal from './StockOpnameCountingModal';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const TYPE_LABELS: Record<StockOpnameType, string> = {
  product: 'Produk',
  inventory: 'Bahan Baku',
};

/**
 * Daftar sesi stock opname toko + tombol buat sesi baru (pilih jenis:
 * produk jadi atau bahan baku/inventory) - meniru fitur yang sama di web.
 */
export default function StockOpnameModal({ visible, onClose }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [stockOpnames, setStockOpnames] = useState<StockOpname[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<StockOpnameType | null>(null);
  const [openStockOpname, setOpenStockOpname] = useState<StockOpname | null>(null);

  function loadList() {
    setIsLoading(true);
    setLoadError(null);

    listStockOpnames()
      .then(setStockOpnames)
      .catch(error => {
        setLoadError(error instanceof ApiError ? error.message : 'Gagal memuat daftar.');
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    if (visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadList();
    }
  }, [visible]);

  async function handleCreate(type: StockOpnameType) {
    setIsCreating(type);

    try {
      const created = await createStockOpname(type);
      setStockOpnames(current => [created, ...current]);
      setOpenStockOpname(created);
    } catch (error) {
      Alert.alert(
        'Gagal membuat sesi',
        error instanceof ApiError ? error.message : 'Coba lagi sebentar.',
      );
    } finally {
      setIsCreating(null);
    }
  }

  function handleDelete(stockOpname: StockOpname) {
    Alert.alert('Hapus sesi draft ini?', `${stockOpname.code} akan dihapus.`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteStockOpname(stockOpname.id);
            setStockOpnames(current => current.filter(item => item.id !== stockOpname.id));
          } catch {
            Alert.alert('Gagal menghapus', 'Coba lagi sebentar.');
          }
        },
      },
    ]);
  }

  function handleUpdated(updated: StockOpname) {
    setStockOpnames(current => current.map(item => (item.id === updated.id ? updated : item)));
    setOpenStockOpname(updated);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Stock Opname</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>Tutup</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.createRow}>
          <TouchableOpacity
            style={[styles.createButton, styles.createButtonProduct]}
            onPress={() => handleCreate('product')}
            disabled={isCreating !== null}>
            {isCreating === 'product' ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.createButtonText}>+ Opname Produk</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.createButton, styles.createButtonInventory]}
            onPress={() => handleCreate('inventory')}
            disabled={isCreating !== null}>
            {isCreating === 'inventory' ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.createButtonText}>+ Opname Bahan Baku</Text>
            )}
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.brand[600]} />
          </View>
        ) : loadError ? (
          <View style={styles.centerBox}>
            <Text style={styles.errorText}>{loadError}</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.listContent}>
            {stockOpnames.length === 0 ? (
              <Text style={styles.emptyText}>Belum ada sesi stock opname.</Text>
            ) : (
              stockOpnames.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.row}
                  onPress={() => setOpenStockOpname(item)}>
                  <View style={styles.rowLeft}>
                    <Text style={styles.rowCode}>{item.code}</Text>
                    <Text style={styles.rowMeta}>
                      {TYPE_LABELS[item.type]} · {item.items_count ?? item.items.length} item ·{' '}
                      {new Date(item.created_at).toLocaleDateString('id-ID')}
                    </Text>
                  </View>
                  <View style={styles.rowRight}>
                    <Text
                      style={[
                        styles.statusBadge,
                        item.status === 'draft' ? styles.statusDraft : styles.statusCompleted,
                      ]}>
                      {item.status === 'draft' ? 'Draft' : 'Selesai'}
                    </Text>
                    {item.status === 'draft' && (
                      <TouchableOpacity onPress={() => handleDelete(item)}>
                        <Text style={styles.deleteText}>Hapus</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
      </SafeAreaView>

      <StockOpnameCountingModal
        stockOpname={openStockOpname}
        onClose={() => setOpenStockOpname(null)}
        onUpdated={handleUpdated}
      />
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
  createRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  createButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  createButtonProduct: {
    backgroundColor: colors.brand[600],
    marginRight: 8,
  },
  createButtonInventory: {
    backgroundColor: colors.slate[700],
  },
  createButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    color: colors.rose[600],
    textAlign: 'center',
  },
  emptyText: {
    color: colors.slate[400],
    textAlign: 'center',
    marginTop: 24,
  },
  listContent: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.slate[200],
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  rowLeft: {
    flex: 1,
    marginRight: 8,
  },
  rowCode: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.slate[900],
  },
  rowMeta: {
    fontSize: 12,
    color: colors.slate[500],
    marginTop: 2,
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  statusDraft: {
    backgroundColor: colors.brand[50],
    color: colors.brand[700],
  },
  statusCompleted: {
    backgroundColor: colors.emerald[50],
    color: colors.emerald[600],
  },
  deleteText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.rose[600],
    marginTop: 6,
  },
  });
}
