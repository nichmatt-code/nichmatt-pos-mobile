import React, { useEffect, useState } from 'react';
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
import { colors } from '../theme/colors';
import { formatRupiah } from '../utils/currency';
import { useDebouncedValue } from '../utils/useDebouncedValue';
import { getTransactionHistory } from '../api/transactionHistory';
import { getTransaction } from '../api/transactions';
import { ApiError } from '../api/client';
import { Transaction, TransactionSummary } from '../types';
import TransactionDetailModal from './TransactionDetailModal';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type Period = 'today' | 'week' | 'month';

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'today', label: 'Hari Ini' },
  { value: 'week', label: '7 Hari' },
  { value: 'month', label: 'Bulan Ini' },
];

/** `YYYY-MM-DD` di zona waktu lokal HP, BUKAN `toISOString()` (itu UTC -
 * bisa geser satu hari kalau dipakai untuk filter tanggal). */
function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateRangeFor(period: Period): { from: string; to: string } {
  const to = new Date();
  const from = new Date();

  if (period === 'week') {
    from.setDate(to.getDate() - 6);
  } else if (period === 'month') {
    from.setDate(1);
  }

  return { from: toDateString(from), to: toDateString(to) };
}

/**
 * Layar pencarian riwayat transaksi - bisa difilter berdasarkan rentang
 * tanggal cepat (Hari Ini/7 Hari/Bulan Ini) dan dicari berdasarkan kode
 * transaksi atau nama pelanggan. Tap satu baris untuk lihat detailnya.
 */
export default function TransactionHistoryModal({ visible, onClose }: Props) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [period, setPeriod] = useState<Period>('month');

  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Muat ulang dari halaman 1 setiap kali modal ini dibuka, atau setiap
  // kali filter tanggal/kata pencarian berubah.
  useEffect(() => {
    if (!visible) {
      return;
    }

    let isCancelled = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    setLoadError(null);

    getTransactionHistory({ ...dateRangeFor(period), search: debouncedSearch, page: 1 })
      .then(result => {
        if (!isCancelled) {
          setTransactions(result.data);
          setPage(result.currentPage);
          setLastPage(result.lastPage);
        }
      })
      .catch(error => {
        if (!isCancelled) {
          setLoadError(error instanceof ApiError ? error.message : 'Gagal memuat riwayat.');
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
  }, [visible, period, debouncedSearch]);

  async function handleLoadMore() {
    if (isLoadingMore || page >= lastPage) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const result = await getTransactionHistory({
        ...dateRangeFor(period),
        search: debouncedSearch,
        page: page + 1,
      });
      setTransactions(current => [...current, ...result.data]);
      setPage(result.currentPage);
      setLastPage(result.lastPage);
    } catch {
      // Gagal muat halaman berikutnya bukan hal fatal - user masih bisa
      // lihat yang sudah termuat, tinggal coba scroll lagi nanti.
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function handleOpenDetail(id: number) {
    setIsLoadingDetail(true);

    try {
      const transaction = await getTransaction(id);
      setSelectedTransaction(transaction);
    } catch (error) {
      Alert.alert(
        'Gagal memuat transaksi',
        error instanceof ApiError ? error.message : 'Coba lagi sebentar.',
      );
    } finally {
      setIsLoadingDetail(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Riwayat Transaksi</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>Tutup</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchWrapper}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Cari kode transaksi / nama customer..."
            placeholderTextColor={colors.slate[400]}
          />
        </View>

        <View style={styles.periodRow}>
          {PERIOD_OPTIONS.map(option => {
            const isActive = option.value === period;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.periodChip, isActive && styles.periodChipActive]}
                onPress={() => setPeriod(option.value)}>
                <Text style={[styles.periodChipText, isActive && styles.periodChipTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
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
            data={transactions}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={styles.listContent}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
            ListEmptyComponent={
              <View style={styles.centerBox}>
                <Text style={styles.emptyText}>Tidak ada transaksi di rentang ini.</Text>
              </View>
            }
            ListFooterComponent={
              isLoadingMore ? (
                <ActivityIndicator style={styles.footerLoader} color={colors.brand[600]} />
              ) : null
            }
            renderItem={({ item }) => (
              <TransactionRow transaction={item} onPress={() => handleOpenDetail(item.id)} />
            )}
          />
        )}
      </SafeAreaView>

      <TransactionDetailModal
        transaction={selectedTransaction}
        isLoading={isLoadingDetail}
        onClose={() => setSelectedTransaction(null)}
      />
    </Modal>
  );
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Tunai',
  qris: 'QRIS',
  kartu: 'Kartu',
};

function TransactionRow({
  transaction,
  onPress,
}: {
  transaction: TransactionSummary;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowNo}>{transaction.transaction_no}</Text>
        <Text style={styles.rowMeta}>
          {new Date(transaction.created_at).toLocaleString('id-ID')}
          {transaction.customer_name ? ` · ${transaction.customer_name}` : ''}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowTotal}>{formatRupiah(transaction.total)}</Text>
        <Text style={styles.rowMethod}>
          {PAYMENT_METHOD_LABELS[transaction.payment_method] ?? transaction.payment_method}
        </Text>
      </View>
    </TouchableOpacity>
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
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.slate[900],
  },
  periodRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 10,
  },
  periodChip: {
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 8,
    backgroundColor: colors.white,
  },
  periodChipActive: {
    backgroundColor: colors.slate[900],
    borderColor: colors.slate[900],
  },
  periodChipText: {
    color: colors.slate[500],
    fontWeight: '600',
    fontSize: 12,
  },
  periodChipTextActive: {
    color: colors.white,
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
    color: colors.slate[500],
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
    backgroundColor: colors.white,
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
  rowNo: {
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
  rowTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.brand[600],
  },
  rowMethod: {
    fontSize: 11,
    color: colors.slate[400],
    marginTop: 2,
  },
});
