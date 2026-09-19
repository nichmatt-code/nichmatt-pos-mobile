import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeContext';
import { useDebouncedValue } from '../utils/useDebouncedValue';
import { deleteCustomer, listCustomers } from '../api/customers';
import { ApiError } from '../api/client';
import { Customer } from '../types';
import CustomerFormModal from './CustomerFormModal';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/**
 * Layar kelola pelanggan (cari, tambah, edit, hapus) - meniru
 * Livewire\Customers\Index di web (search by name/phone, daftar
 * dipaginasi, hitung transaksi per pelanggan).
 */
export default function CustomerManagementModal({ visible, onClose }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);

  // Muat ulang dari halaman 1 setiap kali modal ini dibuka, atau setiap
  // kali kata pencarian (setelah di-debounce) berubah.
  useEffect(() => {
    if (!visible) {
      return;
    }

    let isCancelled = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    setLoadError(null);

    listCustomers({ search: debouncedSearch, page: 1 })
      .then(result => {
        if (!isCancelled) {
          setCustomers(result.data);
          setPage(result.currentPage);
          setLastPage(result.lastPage);
        }
      })
      .catch(error => {
        if (!isCancelled) {
          setLoadError(error instanceof ApiError ? error.message : 'Gagal memuat pelanggan.');
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [visible, debouncedSearch]);

  async function handleLoadMore() {
    if (isLoadingMore || page >= lastPage) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const result = await listCustomers({ search: debouncedSearch, page: page + 1 });
      setCustomers(current => [...current, ...result.data]);
      setPage(result.currentPage);
      setLastPage(result.lastPage);
    } catch {
      // Gagal muat halaman berikutnya bukan hal fatal - user masih bisa
      // lihat yang sudah termuat, tinggal coba scroll lagi nanti.
    } finally {
      setIsLoadingMore(false);
    }
  }

  function handleAdd() {
    setEditingCustomer(null);
    setIsFormVisible(true);
  }

  function handleEdit(customer: Customer) {
    setEditingCustomer(customer);
    setIsFormVisible(true);
  }

  function handleSaved(saved: Customer) {
    setCustomers(current => {
      const alreadyInList = current.some(item => item.id === saved.id);

      if (alreadyInList) {
        return current.map(item => (item.id === saved.id ? saved : item));
      }

      return [saved, ...current];
    });
  }

  function handleDelete(customer: Customer) {
    Alert.alert('Hapus pelanggan ini?', customer.name, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCustomer(customer.id);
            setCustomers(current => current.filter(item => item.id !== customer.id));
          } catch {
            Alert.alert('Gagal menghapus', 'Coba lagi sebentar.');
          }
        },
      },
    ]);
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
          <Text style={styles.title}>Pelanggan</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>Tutup</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Cari nama / nomor telepon..."
            placeholderTextColor={colors.slate[400]}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>+ Tambah</Text>
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
          <FlatList
            data={customers}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={styles.listContent}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
            ListEmptyComponent={
              <View style={styles.centerBox}>
                <Text style={styles.emptyText}>Belum ada pelanggan.</Text>
              </View>
            }
            ListFooterComponent={
              isLoadingMore ? (
                <ActivityIndicator style={styles.footerLoader} color={colors.brand[600]} />
              ) : null
            }
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.row} onPress={() => handleEdit(item)}>
                <View style={styles.rowLeft}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {item.phone}
                    {item.age !== null ? ` · ${item.age} th` : ''}
                    {typeof item.transactions_count === 'number'
                      ? ` · ${item.transactions_count} transaksi`
                      : ''}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item)}>
                  <Text style={styles.deleteText}>Hapus</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>

      <CustomerFormModal
        key={editingCustomer?.id ?? 'new'}
        visible={isFormVisible}
        customer={editingCustomer}
        onClose={() => setIsFormVisible(false)}
        onSaved={handleSaved}
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
    searchRow: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginTop: 12,
    },
    searchInput: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.slate[200],
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.slate[900],
      marginRight: 8,
    },
    addButton: {
      backgroundColor: colors.brand[600],
      borderRadius: 10,
      paddingHorizontal: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addButtonText: {
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
    footerLoader: {
      marginVertical: 16,
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
    rowName: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.slate[900],
    },
    rowMeta: {
      fontSize: 12,
      color: colors.slate[500],
      marginTop: 2,
    },
    deleteText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.rose[600],
    },
  });
}
